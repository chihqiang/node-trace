/**
 * 核心模块
 * 包含初始化、事件跟踪、插件管理等核心功能
 */

import { push, startOfflineCheckTimer, clearTimers } from './queue'
import { queueManager } from './queue/manager'
import { now, stringUtils } from './utils'
import { handlePluginError } from './error'
import type { Options, Payload, IPlugin, IPluginContext, EventProperties, PluginLifecycle } from './types'

/**
 * 默认配置常量
 */
export const DEFAULT_OPTIONS = {
  /**
   * 默认应用密钥
   */
  appKey: '',
  /**
   * 默认调试模式
   */
  debug: false,
  /**
   * 默认采样率
   */
  sampleRate: 1,
  /**
   * 默认黑名单
   */
  blacklist: [],
  /**
   * 默认白名单
   */
  whitelist: undefined,
  /**
   * 默认批量发送大小
   */
  batchSize: 20,
  /**
   * 默认批量发送间隔（毫秒）
   */
  batchInterval: 1000,
  /**
   * 默认离线缓存启用状态
   */
  offlineEnabled: false,
  /**
   * 默认最大队列大小
   */
  maxQueueSize: 1000,
  /**
   * 默认重试次数
   */
  retryCount: 3,
  /**
   * 默认重试间隔（毫秒）
   */
  retryInterval: 1000,
  /**
   * 默认请求头
   */
  headers: {},
  /**
   * 默认超时时间（毫秒）
   */
  timeout: 30000,
  /**
   * 默认发送前回调
   */
  beforeSend: undefined,
}

/**
 * 全局状态管理
 */
export const state = {
  /**
   * 配置选项
   * @type {Options | null}
   */
  options: null as Options | null,
  /**
   * 事件队列
   * @type {Payload<EventProperties>[]}
   */
  queue: [] as Payload<EventProperties>[],
  /**
   * 插件列表
   * @type {IPlugin[]}
   */
  plugins: [] as IPlugin[],
  /**
   * 排序后的插件缓存
   * @type {IPlugin[] | null}
   */
  sortedPluginsCache: null as IPlugin[] | null
}

/**
 * 插件管理器
 * 负责插件的注册、初始化、销毁等操作
 */
class Plugins {
  /**
   * 插件映射
   * @private
   * @type {Map<string, IPlugin>}
   */
  private plugins: Map<string, IPlugin> = new Map()

  /**
   * 创建插件上下文
   * @returns {IPluginContext} 插件上下文
   */
  private createPluginContext(): IPluginContext {
    return {
      getPlugins: () => Object.fromEntries(this.plugins) as unknown as Record<string, IPlugin>,
      getPlugin: (name: string) => this.plugins.get(name) || null,
      getAllPlugins: () => this.getAll(),
      callPluginMethod: (pluginName: string, methodName: string, ...args: unknown[]) => {
        const plugin = this.plugins.get(pluginName)
        if (plugin && typeof (plugin as unknown as Record<string, unknown>)[methodName] === 'function') {
          const method = (plugin as unknown as Record<string, unknown>)[methodName] as (...args: unknown[]) => unknown
          return method(...args)
        }
        return null
      }
    }
  }

  /**
   * 注册插件
   * @param {IPlugin} plugin - 插件实例
   * @returns {boolean} 是否注册成功
   */
  register(plugin: IPlugin): boolean {
    try {
      // 检查插件名称是否已存在
      if (this.plugins.has(plugin.name)) {
        console.warn(`[Node-Trace] Plugin ${plugin.name} already registered`)
        return false
      }

      // 检查插件依赖
      if (plugin.dependencies && plugin.dependencies.length > 0) {
        for (const dep of plugin.dependencies) {
          if (!this.plugins.has(dep)) {
            console.warn(`[Node-Trace] Plugin ${plugin.name} depends on ${dep}, which is not registered`)
            return false
          }
        }
      }

      // 检查插件冲突
      if (plugin.conflicts && plugin.conflicts.length > 0) {
        for (const conflict of plugin.conflicts) {
          if (this.plugins.has(conflict)) {
            console.warn(`[Node-Trace] Plugin ${plugin.name} conflicts with ${conflict}`)
            return false
          }
        }
      }

      // 初始化插件状态
      plugin.lifecycle = 'idle'
      plugin.enabled = true
      plugin.priority = plugin.priority || 0

      // 注册插件
      this.plugins.set(plugin.name, plugin)
      
      // 清除插件排序缓存
      state.sortedPluginsCache = null
      
      return true
    } catch (error) {
      handlePluginError(error, { plugin: plugin.name })
      return false
    }
  }

  /**
   * 初始化插件
   * @param {IPlugin} plugin - 插件实例
   * @returns {boolean} 是否初始化成功
   */
  init(plugin: IPlugin): boolean {
    try {
      // 更新插件生命周期
      plugin.lifecycle = 'loading'

      const context = this.createPluginContext()

      // 调用插件的 beforeInit 方法
      if (plugin.beforeInit) {
        plugin.beforeInit(context)
      }

      // 调用插件的 setup 方法
      if (plugin.setup) {
        plugin.setup(context)
      }

      // 调用插件的 init 方法
      if (plugin.init) {
        plugin.init(context)
      }

      // 调用插件的 activate 方法
      if (plugin.activate) {
        plugin.activate(context)
      }

      // 调用插件的 afterInit 方法
      if (plugin.afterInit) {
        plugin.afterInit(context)
      }

      // 更新插件生命周期
      plugin.lifecycle = 'active'
      return true
    } catch (error) {
      handlePluginError(error, { plugin: plugin.name })
      plugin.lifecycle = 'error'
      return false
    }
  }

  /**
   * 销毁插件
   * @param {IPlugin} plugin - 插件实例
   * @returns {boolean} 是否销毁成功
   */
  destroy(plugin: IPlugin): boolean {
    try {
      const context = this.createPluginContext()

      // 调用插件的 beforeDestroy 方法
      if (plugin.beforeDestroy) {
        plugin.beforeDestroy(context)
      }

      // 调用插件的 deactivate 方法
      if (plugin.deactivate) {
        plugin.deactivate(context)
      }

      // 调用插件的 destroy 方法
      if (plugin.destroy) {
        plugin.destroy(context)
      }

      // 调用插件的 afterDestroy 方法
      if (plugin.afterDestroy) {
        plugin.afterDestroy(context)
      }

      // 更新插件生命周期
      plugin.lifecycle = 'destroyed'
      return true
    } catch (error) {
      handlePluginError(error, { plugin: plugin.name })
      return false
    }
  }

  /**
   * 获取插件
   * @param {string} name - 插件名称
   * @returns {IPlugin | undefined} 插件实例
   */
  get(name: string): IPlugin | undefined {
    return this.plugins.get(name)
  }

  /**
   * 获取所有插件
   * @returns {IPlugin[]} 插件列表
   */
  getAll(): IPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 获取启用的插件
   * @returns {IPlugin[]} 启用的插件列表
   */
  getEnabled(): IPlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.enabled)
  }

  /**
   * 启用插件
   * @param {string} name - 插件名称
   * @returns {boolean} 是否启用成功
   */
  enable(name: string): boolean {
    const plugin = this.plugins.get(name)
    if (!plugin) return false

    plugin.enabled = true
    
    // 清除插件排序缓存
    state.sortedPluginsCache = null
    
    return true
  }

  /**
   * 禁用插件
   * @param {string} name - 插件名称
   * @returns {boolean} 是否禁用成功
   */
  disable(name: string): boolean {
    const plugin = this.plugins.get(name)
    if (!plugin) return false

    plugin.enabled = false
    
    // 清除插件排序缓存
    state.sortedPluginsCache = null
    
    return true
  }

  /**
   * 移除插件
   * @param {string} name - 插件名称
   * @returns {boolean} 是否移除成功
   */
  remove(name: string): boolean {
    const plugin = this.plugins.get(name)
    if (!plugin) return false

    // 销毁插件
    this.destroy(plugin)

    // 从插件列表中移除
    const result = this.plugins.delete(name)
    
    // 清除插件排序缓存
    state.sortedPluginsCache = null
    
    return result
  }

  /**
   * 清空插件
   */
  clear(): void {
    for (const plugin of this.plugins.values()) {
      this.destroy(plugin)
    }
    this.plugins.clear()
    
    // 清除插件排序缓存
    state.sortedPluginsCache = null
  }

  /**
   * 按优先级排序插件
   * @returns {IPlugin[]} 排序后的插件列表
   */
  sort(): IPlugin[] {
    return Array.from(this.plugins.values())
      .filter(plugin => plugin.enabled)
      .sort((a, b) => (a.priority || 0) - (b.priority || 0))
  }
}

/**
 * 插件管理器实例
 * @type {PluginManager}
 */
export const plugins = new Plugins()

/**
 * 初始化配置
 * @param {Options} options - 配置选项
 */
export function init(options: Options) {
  state.options = {
    ...DEFAULT_OPTIONS,
    ...options
  }

  // 初始化队列管理器
  queueManager.init({
    maxQueueSize: options.maxQueueSize || 1000,
    batchSize: options.batchSize || 20,
    batchInterval: options.batchInterval || 1000,
    retryCount: options.retryCount || 3,
    retryInterval: options.retryInterval || 1000,
    offlineEnabled: options.offlineEnabled || false,
    debug: options.debug || false,
    endpoint: options.endpoint,
    appId: options.appId,
    appKey: options.appKey,
    headers: options.headers,
    timeout: options.timeout,
  })

  // 启动离线事件检查定时器
  startOfflineCheckTimer()
}

/**
 * 使用插件
 * @param {IPlugin} plugin - 插件实例
 */
export function use(plugin: IPlugin) {
  // 注册插件
  const registered = plugins.register(plugin)
  if (!registered) {
    console.warn(`[Node-Trace] Failed to register plugin ${plugin.name}`)
    return
  }

  // 初始化插件
  plugins.init(plugin)

  // 添加到状态中的插件列表
  state.plugins.push(plugin)
}

/**
 * 检查是否应该发送事件
 * @param {string} event - 事件名称
 * @returns {boolean} 是否应该发送
 */
function shouldSend(event: string) {
  const opt = state.options
  if (!opt) return true

  if (opt.sampleRate && Math.random() > opt.sampleRate) return false
  if (opt.blacklist?.includes(event)) return false
  if (opt.whitelist && !opt.whitelist.includes(event)) return false

  return true
}

/**
 * 跟踪事件
 * @template T
 * @param {string} event - 事件名称
 * @param {T} [properties] - 事件属性
 * @returns {void}
 */
export function track<T extends EventProperties>(event: string, properties?: T) {
  if (!shouldSend(event)) return

  // 生成唯一事件ID
  const eventId = stringUtils.generateEventId()
  let payload: Payload<T> = { id: eventId, event, properties, timestamp: now() }

  // 使用排序后的插件列表，确保插件按优先级执行（缓存结果）
  let allPlugins = state.sortedPluginsCache
  if (!allPlugins) {
    allPlugins = plugins.sort()  
    state.sortedPluginsCache = allPlugins
  }
  for (const p of allPlugins) { 
    if (p.onTrack) {
      try {
        const r = p.onTrack(payload)
        if (r === null) return
        payload = r
      } catch (error) {
        handlePluginError(error, { plugin: p.name, event: event })
      }
    }
  }

  const final = state.options?.beforeSend?.(payload)
  if (final === null) return

  const eventToPush = final || payload
  push(eventToPush)

  // 调用插件的 onTracked 方法
  for (const p of allPlugins) {
    if (p.onTracked) {
      try {
        p.onTracked(eventToPush)
      } catch (error) {
        handlePluginError(error, { plugin: p.name, event: event })
      }
    }
  }
}
