/**
 * 队列管理模块
 * 负责事件的推送、调度、发送和离线缓存等功能
 */

import { state, plugins } from './core'
import { isBrowser, now } from './utils'
import { DB } from './db'
import { handleNetworkError, handleStorageError, handlePluginError } from './error'
import type { Payload, EventProperties } from './types'

/**
 * 队列常量定义
 */
export const QUEUE_CONSTANTS = {
  /**
   * 默认缓存过期时间（毫秒）
   */
  CACHE_EXPIRY: 1000,
  /**
   * 默认最大队列大小
   */
  DEFAULT_MAX_QUEUE_SIZE: 1000,
  /**
   * 默认批量发送大小
   */
  DEFAULT_BATCH_SIZE: 20,
  /**
   * 默认批量发送间隔（毫秒）
   */
  DEFAULT_BATCH_INTERVAL: 1000,
  /**
   * 最大批量发送大小
   */
  MAX_BATCH_SIZE: 50,
  /**
   * 最小批量发送大小
   */
  MIN_BATCH_SIZE: 5,
  /**
   * 最大批量发送间隔（毫秒）
   */
  MAX_BATCH_INTERVAL: 3000,
  /**
   * 最小批量发送间隔（毫秒）
   */
  MIN_BATCH_INTERVAL: 200,
  /**
   * 队列压力阈值 - 高
   */
  QUEUE_PRESSURE_HIGH: 0.7,
  /**
   * 队列压力阈值 - 很高
   */
  QUEUE_PRESSURE_VERY_HIGH: 0.9,
  /**
   * 队列压力阈值 - 低
   */
  QUEUE_PRESSURE_LOW: 0.2,
  /**
   * 队列压力阈值 - 中
   */
  QUEUE_PRESSURE_MEDIUM: 0.6,
  /**
   * 网络状态检查间隔（毫秒）
   */
  NETWORK_CHECK_INTERVAL: 5000,
  /**
   * Beacon数据大小限制（字节）
   */
  BEACON_SIZE_LIMIT: 65536,
  /**
   * 小数据阈值（字节）
   */
  SMALL_DATA_THRESHOLD: 1024,
  /**
   * 最大重试次数
   */
  MAX_RETRY_COUNT: 5,
  /**
   * 默认超时时间（毫秒）
   */
  DEFAULT_TIMEOUT: 30000,
  /**
   * 队列清理比例
   */
  QUEUE_CLEANUP_RATIO: 0.1,
  /**
   * 最大清理事件数
   */
  MAX_CLEANUP_COUNT: 10
}

/**
 * 定时器引用
 */
let timer: ReturnType<typeof setTimeout> | null = null

/**
 * 重试定时器引用数组
 */
let retryTimers: ReturnType<typeof setTimeout>[] = []

/**
 * 事件 ID 映射，用于快速去重
 */
const eventIdMap = new Map<string, boolean>()

/**
 * 队列状态管理
 */
const queueState = {
  /**
   * 队列压力值 (0-1)
   */
  pressure: 0,
  /**
   * 上次发送时间
   */
  lastSendTime: 0,
  /**
   * 发送成功次数
   */
  sendSuccessCount: 0,
  /**
   * 发送失败次数
   */
  sendFailCount: 0,
  /**
   * 平均发送时间
   */
  averageSendTime: 0,
  /**
   * 缓存的队列压力值
   */
  cachedQueuePressure: 0,
  /**
   * 缓存的动态队列大小
   */
  cachedDynamicQueueSize: 0,
  /**
   * 上次缓存时间
   */
  lastCacheTime: 0,
  /**
   * 缓存过期时间（毫秒）
   */
  cacheExpiry: QUEUE_CONSTANTS.CACHE_EXPIRY,
  /**
   * 缓存命中率
   */
  cacheHits: 0,
  /**
   * 缓存总请求次数
   */
  cacheRequests: 0,
  /**
   * 上次队列长度
   */
  lastQueueLength: 0,
  /**
   * 队列长度变化阈值
   */
  queueLengthThreshold: 10,
}

/**
 * 检查是否需要更新缓存
 * @returns {boolean} 是否需要更新缓存
 */
function shouldUpdateCache(): boolean {
  const queueLengthChange = Math.abs(state.queue.length - queueState.lastQueueLength)
  if (queueLengthChange > queueState.queueLengthThreshold) {
    queueState.lastQueueLength = state.queue.length
    return true
  }
  
  const nowTime = now()
  if (nowTime - queueState.lastCacheTime < queueState.cacheExpiry) {
    return false
  }
  
  return true
}

/**
 * 计算队列压力
 * @returns {number} 队列压力值 (0-1)
 */
function calculateQueuePressure(): number {
  queueState.cacheRequests++
  
  if (!shouldUpdateCache()) {
    queueState.cacheHits++
    return queueState.cachedQueuePressure
  }
  
  const maxQueueSize = state.options?.maxQueueSize || QUEUE_CONSTANTS.DEFAULT_MAX_QUEUE_SIZE
  const pressure = state.queue.length / maxQueueSize
  
  if (pressure > QUEUE_CONSTANTS.QUEUE_PRESSURE_HIGH) {
    queueState.cacheExpiry = Math.max(QUEUE_CONSTANTS.CACHE_EXPIRY * 0.5, 200)
  } else if (pressure < QUEUE_CONSTANTS.QUEUE_PRESSURE_LOW) {
    queueState.cacheExpiry = Math.min(QUEUE_CONSTANTS.CACHE_EXPIRY * 2, 2000)
  } else {
    queueState.cacheExpiry = QUEUE_CONSTANTS.CACHE_EXPIRY
  }
  
  queueState.cachedQueuePressure = pressure
  queueState.lastCacheTime = now()
  queueState.lastQueueLength = state.queue.length
  
  return pressure
}

/**
 * 动态调整队列大小
 * @returns {number} 动态队列大小
 */
function getDynamicQueueSize(): number {
  queueState.cacheRequests++
  
  if (!shouldUpdateCache()) {
    queueState.cacheHits++
    return queueState.cachedDynamicQueueSize
  }
  
  const baseSize = state.options?.maxQueueSize || QUEUE_CONSTANTS.DEFAULT_MAX_QUEUE_SIZE
  const pressure = calculateQueuePressure()
  
  let dynamicSize = baseSize
  
  if (pressure > 0.8) {
    dynamicSize = Math.max(baseSize * 0.8, 500)
  } else if (pressure < 0.3) {
    dynamicSize = Math.min(baseSize * 1.2, 2000)
  }
  
  queueState.cachedDynamicQueueSize = dynamicSize
  queueState.lastCacheTime = now()
  
  return dynamicSize
}

/**
 * 获取缓存统计信息
 * @returns {Object} 缓存统计信息
 */
function getCacheStats() {
  const hitRate = queueState.cacheRequests > 0 
    ? (queueState.cacheHits / queueState.cacheRequests) * 100 
    : 0
  
  return {
    hits: queueState.cacheHits,
    requests: queueState.cacheRequests,
    hitRate: hitRate.toFixed(2) + '%',
    currentExpiry: queueState.cacheExpiry,
    lastQueueLength: queueState.lastQueueLength,
  }
}

/**
 * 网络状态管理
 */
const networkState = {
  /**
   * 网络类型
   */
  type: 'unknown' as 'unknown' | 'online' | 'offline' | 'slow',
  /**
   * 上次检查时间
   */
  lastCheckTime: 0,
  /**
   * 有效网络类型
   */
  effectiveType: '4g' as '2g' | '3g' | '4g' | '5g' | 'unknown',
  /**
   * 往返时间
   */
  rtt: 0,
  /**
   * 下行速度
   */
  downlink: 0,
  /**
   * 网络状态检查间隔（毫秒）
   */
  checkInterval: QUEUE_CONSTANTS.NETWORK_CHECK_INTERVAL,
}

/**
 * 检查网络状态
 */
function checkNetworkState() {
  if (!isBrowser() || typeof navigator === 'undefined') {
    return
  }

  const nowTime = now()
  
  // 检查是否需要更新网络状态
  if (nowTime - networkState.lastCheckTime < networkState.checkInterval) {
    return
  }

  // 更新网络状态
  networkState.type = navigator.onLine ? 'online' : 'offline'
  networkState.lastCheckTime = nowTime

  // 检查网络连接信息
  if ('connection' in navigator) {
    const connection = navigator.connection as any
    networkState.effectiveType = connection.effectiveType || 'unknown'
    networkState.rtt = connection.rtt || 0
    networkState.downlink = connection.downlink || 0

    // 根据网络类型判断是否为慢速网络
    if (networkState.effectiveType === '2g' || networkState.rtt > 1000 || networkState.downlink < 1) {
      networkState.type = 'slow'
    }
  }
}

/**
 * 选择发送策略
 * @param {string} body - 已序列化的数据
 * @param {number} bodySize - 数据大小
 * @returns {'beacon' | 'fetch' | 'xhr'} 发送策略
 */
function selectSendStrategy(body: string, bodySize: number): 'beacon' | 'fetch' | 'xhr' {
  checkNetworkState()

  if (networkState.type === 'offline') {
    return 'beacon'
  } else if (networkState.type === 'slow') {
    return 'fetch'
  }

  if (bodySize > QUEUE_CONSTANTS.BEACON_SIZE_LIMIT) {
    return 'fetch'
  } else if (bodySize < QUEUE_CONSTANTS.SMALL_DATA_THRESHOLD) {
    return 'beacon'
  }

  return 'fetch'
}

/**
 * 使用 XMLHttpRequest 发送数据（作为最终回退）
 * @param {string} endpoint - 发送端点
 * @param {any} data - 要发送的数据
 * @param {number} timeout - 超时时间
 * @returns {Promise<boolean>} 是否发送成功
 */
function sendWithXHR(endpoint: string, data: any, timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isBrowser() || typeof XMLHttpRequest === 'undefined') {
      resolve(false)
      return
    }

    const xhr = new XMLHttpRequest()
    const body = JSON.stringify(data)

    xhr.open('POST', endpoint, true)
    xhr.setRequestHeader('Content-Type', 'application/json')

    // 设置超时
    if (timeout > 0) {
      xhr.timeout = timeout
    }

    xhr.onload = function() {
      resolve(xhr.status >= 200 && xhr.status < 300)
    }

    xhr.onerror = function() {
      resolve(false)
    }

    xhr.ontimeout = function() {
      resolve(false)
    }

    xhr.send(body)
  })
}

/**
 * 发送数据
 * @param {string} endpoint - 发送端点
 * @param {any} data - 要发送的数据
 * @returns {Promise<boolean>} 是否发送成功
 */
async function send(endpoint: string, data: any): Promise<boolean> {
  if (!isBrowser()) return false

  const options = state.options
  const timeout = options?.timeout || QUEUE_CONSTANTS.DEFAULT_TIMEOUT

  const body = JSON.stringify(data)
  const bodySize = body.length

  const strategy = selectSendStrategy(body, bodySize)

  try {
    if (strategy === 'beacon' && navigator.sendBeacon) {
      try {
        const success = navigator.sendBeacon(endpoint, body)
        if (options?.debug) {
          console.log('[Node-Trace] Sent with beacon:', success)
        }
        return success
      } catch (error) {
        if (options?.debug) {
          console.log('[Node-Trace] Beacon failed, falling back to fetch:', error)
        }
        handleNetworkError(error, { endpoint, method: 'beacon', dataSize: bodySize })
      }
    }

    if (strategy === 'fetch' || typeof navigator.sendBeacon === 'undefined') {
      try {
        const headers = {
          'Content-Type': 'application/json',
          ...options?.headers,
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          body,
          headers,
          keepalive: true,
          signal: timeout ? AbortSignal.timeout(timeout) : undefined,
        })

        if (options?.debug) {
          console.log('[Node-Trace] Sent with fetch:', res.ok)
        }
        return res.ok
      } catch (error) {
        if (options?.debug) {
          console.log('[Node-Trace] Fetch failed, falling back to XHR:', error)
        }
        handleNetworkError(error, { endpoint, method: 'fetch', dataSize: bodySize })
      }
    }

    try {
      const xhrSuccess = await sendWithXHR(endpoint, data, timeout)
      if (options?.debug) {
        console.log('[Node-Trace] Sent with XHR:', xhrSuccess)
      }
      return xhrSuccess
    } catch (error) {
      handleNetworkError(error, { endpoint, method: 'xhr', dataSize: bodySize })
      return false
    }
  } catch (error) {
    if (options?.debug) {
      console.log('[Node-Trace] All send strategies failed:', error)
    }
    handleNetworkError(error, { endpoint, dataSize: bodySize })
    return false
  }
}

/**
 * 检查事件是否已存在于队列中
 * @template T
 * @param {Payload<T>} event - 要检查的事件
 * @returns {boolean} 是否已存在
 */
function isEventExists<T extends EventProperties>(event: Payload<T>): boolean {
  const eventKey = `${event.id}_${event.event}_${event.timestamp}`
  return eventIdMap.has(eventKey)
}

/**
 * 推送事件到队列
 * @template T
 * @param {Payload<T>} event - 事件数据
 */
export function push<T extends EventProperties>(event: Payload<T>) {
  if (isEventExists(event)) {
    if (state.options?.debug) {
      console.log('[Node-Trace] Event already exists in queue, skipping:', event.event)
    }
    return
  }
  
  const maxQueueSize = getDynamicQueueSize()
  queueState.pressure = calculateQueuePressure()
  
  if (state.queue.length >= maxQueueSize) {
    let removeCount = 1
    if (queueState.pressure > QUEUE_CONSTANTS.QUEUE_PRESSURE_VERY_HIGH) {
      removeCount = Math.min(Math.ceil(state.queue.length * QUEUE_CONSTANTS.QUEUE_CLEANUP_RATIO), QUEUE_CONSTANTS.MAX_CLEANUP_COUNT)
    } else if (queueState.pressure > QUEUE_CONSTANTS.QUEUE_PRESSURE_HIGH) {
      removeCount = Math.min(Math.ceil(state.queue.length * 0.05), 5)
    }
    
    const removedEvents = state.queue.splice(0, removeCount)
    removedEvents.forEach(e => {
      const key = `${e.id}_${e.event}_${e.timestamp}`
      eventIdMap.delete(key)
    })
  }
  
  state.queue.push(event)
  const eventKey = `${event.id}_${event.event}_${event.timestamp}`
  eventIdMap.set(eventKey, true)
  
  if (state.options?.debug) {
    console.log('[Node-Trace] Event pushed:', event)
    console.log('[Node-Trace] Queue state:', {
      length: state.queue.length,
      maxSize: maxQueueSize,
      pressure: queueState.pressure,
    })
    console.log('[Node-Trace] Cache stats:', getCacheStats())
  }
  
  if (queueState.pressure > QUEUE_CONSTANTS.QUEUE_PRESSURE_HIGH) {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    flush()
  } else {
    schedule()
  }
}

/**
 * 调度发送任务
 */
function schedule() {
  if (timer) return
  
  // 实现自适应发送间隔
  let batchInterval = state.options?.batchInterval || QUEUE_CONSTANTS.DEFAULT_BATCH_INTERVAL
  
  // 根据队列压力调整发送间隔
  const pressure = calculateQueuePressure()
  if (pressure > QUEUE_CONSTANTS.QUEUE_PRESSURE_MEDIUM) {
    // 队列压力大，减小发送间隔
    batchInterval = Math.max(batchInterval * 0.5, QUEUE_CONSTANTS.MIN_BATCH_INTERVAL)
  } else if (pressure < QUEUE_CONSTANTS.QUEUE_PRESSURE_LOW) {
    // 队列压力小，增大发送间隔
    batchInterval = Math.min(batchInterval * 1.5, QUEUE_CONSTANTS.MAX_BATCH_INTERVAL)
  }
  
  timer = setTimeout(flush, batchInterval)
}

/**
 * 发送队列中的事件
 */
export async function flush() {
  if (!state.options || state.queue.length === 0) return

  const sendStartTime = now()
  
  let batchSize = state.options?.batchSize || QUEUE_CONSTANTS.DEFAULT_BATCH_SIZE
  const pressure = calculateQueuePressure()
  
  if (pressure > QUEUE_CONSTANTS.QUEUE_PRESSURE_MEDIUM) {
    batchSize = Math.max(Math.floor(batchSize * 0.8), QUEUE_CONSTANTS.MIN_BATCH_SIZE)
  } else if (pressure < QUEUE_CONSTANTS.QUEUE_PRESSURE_LOW) {
    batchSize = Math.min(Math.ceil(batchSize * 1.2), QUEUE_CONSTANTS.MAX_BATCH_SIZE)
  }
  
  batchSize = Math.min(batchSize, state.queue.length)
  
  let batch = state.queue.splice(0, batchSize) as Payload<EventProperties>[]
  
  batch.forEach(e => {
    const key = `${e.id}_${e.event}_${e.timestamp}`
    eventIdMap.delete(key)
  })

  const beforeSendPlugins = plugins.sort()
  for (const p of beforeSendPlugins) {
    if (p.beforeSend) {
      try {
        batch = p.beforeSend(batch)
      } catch (error) {
        handlePluginError(error, { plugin: p.name, context: 'beforeSend' })
      }
    }
  }

  const ok = await send(state.options.endpoint, {
    appId: state.options.appId,
    appKey: state.options.appKey,
    events: batch,
  })

  const sendTime = now() - sendStartTime
  
  queueState.lastSendTime = now()
  if (ok) {
    queueState.sendSuccessCount++
  } else {
    queueState.sendFailCount++
  }
  
  const totalSends = queueState.sendSuccessCount + queueState.sendFailCount
  if (totalSends > 0) {
    queueState.averageSendTime = (
      queueState.averageSendTime * (totalSends - 1) + sendTime
    ) / totalSends
  }

  const sortedPlugins = plugins.getAll()
  for (const p of sortedPlugins) {
    if (p.afterSend) {
      try {
        p.afterSend(batch, ok)
      } catch (error) {
        handlePluginError(error, { plugin: p.name, context: 'afterSend' })
      }
    }
  }

  if (!ok) {
    if (state.options?.debug) {
      console.log('[Node-Trace] Send failed, handling retry or offline cache')
      console.log('[Node-Trace] Send statistics:', {
        time: sendTime,
        successRate: queueState.sendSuccessCount / totalSends,
        averageTime: queueState.averageSendTime,
      })
    }
    
    const offlineEnabled = state.options?.offlineEnabled || false
    if (offlineEnabled && isBrowser()) {
      try {
        await DB.add(batch)
        
        if (state.options?.debug) {
          console.log('[Node-Trace] Events cached offline:', batch.length)
        }
      } catch (error) {
        handleStorageError(error, { eventCount: batch.length })
      }
    } else {
      const retryCount = state.options?.retryCount || 0
      if (retryCount > 0) {
        const baseInterval = state.options?.retryInterval || 1000
        const retryInterval = baseInterval * Math.pow(2, queueState.sendFailCount % QUEUE_CONSTANTS.MAX_RETRY_COUNT)
        
        const retryTimer = setTimeout(() => {
          state.queue.unshift(...batch)
          batch.forEach(e => {
            const key = `${e.id}_${e.event}_${e.timestamp}`
            eventIdMap.set(key, true)
          })
          if (state.options?.debug) {
            console.log('[Node-Trace] Retrying failed events:', batch.length)
          }
          schedule()
        }, retryInterval)
        
        retryTimers.push(retryTimer)
      }
    }
  } else if (isBrowser()) {
    await DB.clear()
    
    if (state.options?.debug) {
      console.log('[Node-Trace] Events sent successfully:', batch.length)
      console.log('[Node-Trace] Send statistics:', {
        time: sendTime,
        successRate: queueState.sendSuccessCount / totalSends,
        averageTime: queueState.averageSendTime,
      })
    }
  }

  timer = null
}

/**
 * 定时检查离线事件的定时器
 */
let offlineCheckTimer: ReturnType<typeof setInterval> | null = null

/**
 * 清除所有定时器
 */
export function clearTimers() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  
  retryTimers.forEach(t => clearTimeout(t))
  retryTimers = []
  
  if (offlineCheckTimer) {
    clearInterval(offlineCheckTimer)
    offlineCheckTimer = null
  }
}

/**
 * 启动离线事件检查定时器
 */
export function startOfflineCheckTimer() {
  if (!isBrowser() || offlineCheckTimer) return
  
  // 每30秒检查一次离线事件
  offlineCheckTimer = setInterval(async () => {
    if (state.options?.offlineEnabled) {
      await restoreOfflineEvents()
    }
  }, 30000)
}

/**
 * 恢复离线事件
 */
export async function restoreOfflineEvents() {
  if (!isBrowser()) return
  
  try {
    const offlineEvents = await DB.all()
    if (offlineEvents.length > 0) {
      const queueEventKeys = new Set<string>()
      state.queue.forEach(e => {
        const key = `${e.id}_${e.event}_${e.timestamp}`
        queueEventKeys.add(key)
      })
      
      const eventsToAdd = offlineEvents.filter(offlineEvent => {
        const key = `${offlineEvent.id}_${offlineEvent.event}_${offlineEvent.timestamp}`
        return !queueEventKeys.has(key)
      })
      
      if (eventsToAdd.length > 0) {
        const idsToDelete = eventsToAdd.map(event => event.id)
        
        if (idsToDelete.length > 0) {
          await DB.delete(idsToDelete)
        }
        
        state.queue.unshift(...eventsToAdd)
        eventsToAdd.forEach(e => {
          const key = `${e.id}_${e.event}_${e.timestamp}`
          eventIdMap.set(key, true)
        })
        
        if (state.options?.debug) {
          console.log('[Node-Trace] Restored offline events:', eventsToAdd.length)
          if (eventsToAdd.length < offlineEvents.length) {
            console.log('[Node-Trace] Filtered out duplicate events:', offlineEvents.length - eventsToAdd.length)
          }
          console.log('[Node-Trace] Deleted offline event ids:', idsToDelete.length)
        }
        
        schedule()
      } else {
        await DB.clear()
        
        if (state.options?.debug) {
          console.log('[Node-Trace] All offline events are duplicates, cleared offline storage')
        }
      }
    }
  } catch (error) {
    handleStorageError(error, { eventCount: 0 })
  }
}
