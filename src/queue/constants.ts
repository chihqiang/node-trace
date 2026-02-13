/**
 * Queue constants definition
 */

export const QUEUE_CONSTANTS = {
  /**
   * Default max queue size
   */
  DEFAULT_MAX_QUEUE_SIZE: 1000,
  /**
   * Default batch size
   */
  DEFAULT_BATCH_SIZE: 20,
  /**
   * Default batch interval (milliseconds)
   */
  DEFAULT_BATCH_INTERVAL: 1000,
  /**
   * Max batch size
   */
  MAX_BATCH_SIZE: 50,
  /**
   * Min batch size
   */
  MIN_BATCH_SIZE: 5,
  /**
   * Max batch interval (milliseconds)
   */
  MAX_BATCH_INTERVAL: 3000,
  /**
   * Min batch interval (milliseconds)
   */
  MIN_BATCH_INTERVAL: 200,
  /**
   * Queue pressure threshold - high
   */
  QUEUE_PRESSURE_HIGH: 0.7,
  /**
   * Queue pressure threshold - very high
   */
  QUEUE_PRESSURE_VERY_HIGH: 0.9,
  /**
   * Queue pressure threshold - low
   */
  QUEUE_PRESSURE_LOW: 0.2,
  /**
   * Queue pressure threshold - medium
   */
  QUEUE_PRESSURE_MEDIUM: 0.6,
  /**
   * Network status check interval (milliseconds)
   */
  NETWORK_CHECK_INTERVAL: 5000,
  /**
   * Beacon data size limit (bytes)
   */
  BEACON_SIZE_LIMIT: 65536,
  /**
   * Small data threshold (bytes)
   */
  SMALL_DATA_THRESHOLD: 1024,
  /**
   * Max retry count
   */
  MAX_RETRY_COUNT: 5,
  /**
   * Default timeout (milliseconds)
   */
  DEFAULT_TIMEOUT: 30000,
  /**
   * Queue cleanup ratio
   */
  QUEUE_CLEANUP_RATIO: 0.1,
  /**
   * Max cleanup event count
   */
  MAX_CLEANUP_COUNT: 10,
  /**
   * Offline event check interval (milliseconds)
   */
  OFFLINE_CHECK_INTERVAL: 30000,
  /**
   * Event deduplication cache max size
   */
  DEDUPE_CACHE_MAX_SIZE: 10000,
};
