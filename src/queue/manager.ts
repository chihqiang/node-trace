import type { Payload, EventProperties } from "../types";
import { QUEUE_CONSTANTS } from "./constants";
import { EventDedupe } from "./dedupe";
import { sender } from "./sender";
import { plugins } from "../core";
import { handleNetworkError, handlePluginError } from "../error";
import { DB } from "../db";
import { isBrowser } from "../utils";
import { PriorityQueue, determineEventPriority } from "./priority";

/**
 * Queue statistics
 */
export interface QueueStats {
  totalEvents: number;
  sendSuccessCount: number;
  sendFailCount: number;
  averageSendTime: number;
  lastSendTime: number;
}

/**
 * Queue configuration
 */
export interface QueueConfig {
  maxQueueSize: number;
  batchSize: number;
  batchInterval: number;
  retryCount: number;
  retryInterval: number;
  offlineEnabled: boolean;
  debug: boolean;
  endpoint: string;
  appId: string;
  appKey?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Queue manager
 */
export class QueueManager {
  private queue: Payload<EventProperties>[];
  private priorityQueue: PriorityQueue<EventProperties>;
  private dedupe: EventDedupe;
  private stats: QueueStats;
  private config: QueueConfig | null;
  private timer: ReturnType<typeof setTimeout> | null;
  private retryTimers: ReturnType<typeof setTimeout>[];
  private offlineCheckTimer: ReturnType<typeof setInterval> | null;
  private cachedPressure: number | null;
  private pressureCacheTime: number;
  private readonly PRESSURE_CACHE_TTL: number;

  constructor() {
    this.queue = [];
    this.priorityQueue = new PriorityQueue();
    this.dedupe = new EventDedupe(QUEUE_CONSTANTS.DEDUPE_CACHE_MAX_SIZE);
    this.stats = {
      totalEvents: 0,
      sendSuccessCount: 0,
      sendFailCount: 0,
      averageSendTime: 0,
      lastSendTime: 0,
    };
    this.config = null;
    this.timer = null;
    this.retryTimers = [];
    this.offlineCheckTimer = null;
    this.cachedPressure = null;
    this.pressureCacheTime = 0;
    this.PRESSURE_CACHE_TTL = 1000;
  }

  /**
   * Initialize queue
   */
  init(config: QueueConfig): void {
    this.config = config;
    this.startOfflineCheck();
  }

  /**
   * Calculate queue pressure (0-1)
   */
  private calculatePressure(): number {
    if (!this.config) return 0;

    const now = Date.now();
    if (
      this.cachedPressure !== null &&
      now - this.pressureCacheTime < this.PRESSURE_CACHE_TTL
    ) {
      return this.cachedPressure;
    }

    const pressure = this.queue.length / this.config.maxQueueSize;
    this.cachedPressure = pressure;
    this.pressureCacheTime = now;
    return pressure;
  }

  /**
   * Get dynamic batch size
   */
  private getDynamicBatchSize(): number {
    if (!this.config) return QUEUE_CONSTANTS.DEFAULT_BATCH_SIZE;

    const pressure = this.calculatePressure();
    let batchSize = this.config.batchSize;

    if (pressure > QUEUE_CONSTANTS.QUEUE_PRESSURE_MEDIUM) {
      batchSize = Math.max(
        Math.floor(batchSize * 0.8),
        QUEUE_CONSTANTS.MIN_BATCH_SIZE,
      );
    } else if (pressure < QUEUE_CONSTANTS.QUEUE_PRESSURE_LOW) {
      batchSize = Math.min(
        Math.ceil(batchSize * 1.2),
        QUEUE_CONSTANTS.MAX_BATCH_SIZE,
      );
    }

    return Math.min(batchSize, this.queue.length);
  }

  /**
   * Get dynamic send interval
   */
  private getDynamicInterval(): number {
    if (!this.config) return QUEUE_CONSTANTS.DEFAULT_BATCH_INTERVAL;

    const pressure = this.calculatePressure();
    let interval = this.config.batchInterval;

    if (pressure > QUEUE_CONSTANTS.QUEUE_PRESSURE_MEDIUM) {
      interval = Math.max(interval * 0.5, QUEUE_CONSTANTS.MIN_BATCH_INTERVAL);
    } else if (pressure < QUEUE_CONSTANTS.QUEUE_PRESSURE_LOW) {
      interval = Math.min(interval * 1.5, QUEUE_CONSTANTS.MAX_BATCH_INTERVAL);
    }

    return interval;
  }

  /**
   * Handle queue full scenario
   */
  private handleQueueFull(): void {
    if (!this.config) return;

    const pressure = this.calculatePressure();
    let removeCount = 1;

    if (pressure > QUEUE_CONSTANTS.QUEUE_PRESSURE_VERY_HIGH) {
      removeCount = Math.min(
        Math.ceil(this.queue.length * QUEUE_CONSTANTS.QUEUE_CLEANUP_RATIO),
        QUEUE_CONSTANTS.MAX_CLEANUP_COUNT,
      );
    } else if (pressure > QUEUE_CONSTANTS.QUEUE_PRESSURE_HIGH) {
      removeCount = Math.min(Math.ceil(this.queue.length * 0.05), 5);
    }

    const removedEvents = this.queue.splice(0, removeCount);
    this.dedupe.removeBatch(removedEvents);

    if (this.config.debug) {
      console.log("[Node-Trace] Queue full, removed events:", removeCount);
    }
  }

  /**
   * Push event to queue
   */
  push<T extends EventProperties>(event: Payload<T>): void {
    if (this.dedupe.exists(event)) {
      if (this.config?.debug) {
        console.log(
          "[Node-Trace] Event already exists, skipping:",
          event.event,
        );
      }
      return;
    }

    if (!this.config) {
      this.queue.push(event);
      this.dedupe.add(event);
      return;
    }

    if (this.queue.length >= this.config.maxQueueSize) {
      this.handleQueueFull();
    }

    this.queue.push(event);
    this.dedupe.add(event);
    this.stats.totalEvents++;

    const priority = determineEventPriority(event.event);
    this.priorityQueue.push(event, priority);

    if (this.config.debug) {
      console.log(
        "[Node-Trace] Event pushed:",
        event.event,
        "priority:",
        priority,
      );
      console.log("[Node-Trace] Queue length:", this.queue.length);
    }

    this.cachedPressure = null;

    const pressure = this.calculatePressure();
    if (pressure > QUEUE_CONSTANTS.QUEUE_PRESSURE_HIGH) {
      this.flush();
    } else {
      this.schedule();
    }
  }

  /**
   * Schedule send task
   */
  private schedule(): void {
    if (this.timer) return;

    const interval = this.getDynamicInterval();
    this.timer = setTimeout(() => {
      this.flush();
    }, interval);
  }

  /**
   * Update send statistics
   */
  private updateStats(sendTime: number, success: boolean): void {
    this.stats.lastSendTime = Date.now();

    if (success) {
      this.stats.sendSuccessCount++;
    } else {
      this.stats.sendFailCount++;
    }

    const totalSends = this.stats.sendSuccessCount + this.stats.sendFailCount;
    if (totalSends > 0) {
      this.stats.averageSendTime =
        (this.stats.averageSendTime * (totalSends - 1) + sendTime) / totalSends;
    }
  }

  /**
   * Handle send failure
   */
  private async handleSendFailure(
    batch: Payload<EventProperties>[],
  ): Promise<void> {
    if (!this.config) return;

    if (this.config.debug) {
      console.log("[Node-Trace] Send failed, batch size:", batch.length);
    }

    if (this.config.offlineEnabled && isBrowser()) {
      try {
        await DB.add(batch);
        if (this.config.debug) {
          console.log("[Node-Trace] Events cached offline:", batch.length);
        }
      } catch (error) {
        handleNetworkError(error, { eventCount: batch.length });
      }
    } else if (this.config.retryCount > 0) {
      const baseInterval = this.config.retryInterval;
      const retryInterval =
        baseInterval *
        Math.pow(2, this.stats.sendFailCount % QUEUE_CONSTANTS.MAX_RETRY_COUNT);

      const retryTimer = setTimeout(() => {
        this.queue.unshift(...batch);
        batch.forEach((event) => this.dedupe.add(event));
        if (this.config?.debug) {
          console.log("[Node-Trace] Retrying events:", batch.length);
        }
        this.schedule();
      }, retryInterval);

      this.retryTimers.push(retryTimer);
    }
  }

  /**
   * Handle send success
   */
  private async handleSendSuccess(
    batch: Payload<EventProperties>[],
  ): Promise<void> {
    if (this.config?.debug) {
      console.log("[Node-Trace] Events sent successfully:", batch.length);
    }

    if (isBrowser()) {
      await DB.forceFlush();
      await DB.clear();
    }
  }

  /**
   * Apply plugin beforeSend hooks
   */
  private applyBeforeSendHooks(
    batch: Payload<EventProperties>[],
  ): Payload<EventProperties>[] {
    const sortedPlugins = plugins.sort();
    let result = batch;

    for (const plugin of sortedPlugins) {
      if (plugin.beforeSend) {
        try {
          result = plugin.beforeSend(result);
        } catch (error) {
          handlePluginError(error, {
            plugin: plugin.name,
            context: "beforeSend",
          });
        }
      }
    }

    return result;
  }

  /**
   * Apply plugin afterSend hooks
   */
  private applyAfterSendHooks(
    batch: Payload<EventProperties>[],
    success: boolean,
  ): void {
    const sortedPlugins = plugins.getAll();

    for (const plugin of sortedPlugins) {
      if (plugin.afterSend) {
        try {
          plugin.afterSend(batch, success);
        } catch (error) {
          handlePluginError(error, {
            plugin: plugin.name,
            context: "afterSend",
          });
        }
      }
    }
  }

  /**
   * Send events in queue
   */
  async flush(): Promise<void> {
    if (!this.config || this.queue.length === 0) {
      return;
    }

    const batchSize = this.getDynamicBatchSize();

    const priorityBatch = this.priorityQueue.getBatch(batchSize);
    const batchIds = new Set(priorityBatch.map((e) => e.id));

    const batch = this.queue.filter((e) => batchIds.has(e.id));
    this.queue = this.queue.filter((e) => !batchIds.has(e.id));
    this.dedupe.removeBatch(batch);

    const processedBatch = this.applyBeforeSendHooks(batch);

    const result = await sender.send({
      endpoint: this.config.endpoint,
      data: {
        appId: this.config.appId,
        appKey: this.config.appKey,
        events: processedBatch,
      },
      timeout: this.config.timeout,
      headers: this.config.headers,
      debug: this.config.debug,
    });

    this.updateStats(result.time, result.success);
    this.applyAfterSendHooks(processedBatch, result.success);

    if (result.success) {
      await this.handleSendSuccess(processedBatch);
    } else {
      await this.handleSendFailure(processedBatch);
    }

    this.timer = null;
  }

  /**
   * Start offline event check
   */
  private startOfflineCheck(): void {
    if (!isBrowser() || this.offlineCheckTimer) {
      return;
    }

    if (!this.config?.offlineEnabled) {
      return;
    }

    this.offlineCheckTimer = setInterval(async () => {
      await this.restoreOfflineEvents();
    }, QUEUE_CONSTANTS.OFFLINE_CHECK_INTERVAL);
  }

  /**
   * Restore offline events
   */
  async restoreOfflineEvents(): Promise<void> {
    if (!isBrowser()) return;

    try {
      const offlineEvents = await DB.all();
      if (offlineEvents.length === 0) {
        return;
      }

      const queueEventKeys = new Set<string>();
      this.queue.forEach((event) => {
        const key = `${event.id}_${event.event}_${event.timestamp}`;
        queueEventKeys.add(key);
      });

      const eventsToAdd = offlineEvents.filter((offlineEvent) => {
        const key = `${offlineEvent.id}_${offlineEvent.event}_${offlineEvent.timestamp}`;
        return !queueEventKeys.has(key);
      });

      if (eventsToAdd.length > 0) {
        const idsToDelete = eventsToAdd.map((event) => event.id);

        if (idsToDelete.length > 0) {
          await DB.delete(idsToDelete);
        }

        this.queue.unshift(...eventsToAdd);
        eventsToAdd.forEach((event) => this.dedupe.add(event));

        if (this.config?.debug) {
          console.log(
            "[Node-Trace] Restored offline events:",
            eventsToAdd.length,
          );
        }

        this.schedule();
      } else {
        await DB.clear();

        if (this.config?.debug) {
          console.log(
            "[Node-Trace] All offline events are duplicates, cleared",
          );
        }
      }
    } catch (error) {
      handleNetworkError(error, { eventCount: 0 });
    }
  }

  /**
   * Clear all timers
   */
  clearTimers(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.retryTimers.forEach((t) => clearTimeout(t));
    this.retryTimers = [];

    if (this.offlineCheckTimer) {
      clearInterval(this.offlineCheckTimer);
      this.offlineCheckTimer = null;
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return { ...this.stats };
  }

  /**
   * Get queue length
   */
  length(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
    this.priorityQueue.clear();
    this.dedupe.clear();
  }
}

/**
 * Queue manager instance
 */
export const queueManager = new QueueManager();
