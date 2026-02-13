/**
 * Queue management module
 * Responsible for event push, scheduling, sending, and offline caching
 * Refactored to modular architecture for better maintainability and testability
 */

import type { Payload, EventProperties } from './types'
import { queueManager } from './queue/manager'
import { QUEUE_CONSTANTS } from './queue/constants'

/**
 * Push event to queue
 * @template T
 * @param event - Event data
 */
export function push<T extends EventProperties>(event: Payload<T>) {
  queueManager.push(event)
}

/**
 * Send events in queue
 */
export async function flush() {
  await queueManager.flush()
}

/**
 * Clear all timers
 */
export function clearTimers() {
  queueManager.clearTimers()
}

/**
 * Start offline event check timer
 */
export function startOfflineCheckTimer() {
  // Queue manager will start offline check during init
  // Keep as empty function for backward compatibility
}

/**
 * Export queue constants
 */
export { QUEUE_CONSTANTS }
