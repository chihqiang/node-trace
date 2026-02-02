/**
 * 队列管理模块
 * 负责事件的推送、调度、发送和离线缓存等功能
 * 重构为模块化架构，提高可维护性和可测试性
 */

import type { Payload, EventProperties } from './types'
import { queueManager } from './queue/manager'
import { QUEUE_CONSTANTS } from './queue/constants'

/**
 * 推送事件到队列
 * @template T
 * @param {Payload<T>} event - 事件数据
 */
export function push<T extends EventProperties>(event: Payload<T>) {
  queueManager.push(event)
}

/**
 * 发送队列中的事件
 */
export async function flush() {
  await queueManager.flush()
}

/**
 * 清除所有定时器
 */
export function clearTimers() {
  queueManager.clearTimers()
}

/**
 * 启动离线事件检查定时器
 */
export function startOfflineCheckTimer() {
  // 队列管理器会在 init 时启动离线检查
  // 这里保留为空函数以保持向后兼容
}

/**
 * 导出队列常量
 */
export { QUEUE_CONSTANTS }
