/**
 * 队列常量定义
 */

export const QUEUE_CONSTANTS = {
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
  MAX_CLEANUP_COUNT: 10,
  /**
   * 离线事件检查间隔（毫秒）
   */
  OFFLINE_CHECK_INTERVAL: 30000,
  /**
   * 事件去重缓存最大大小
   */
  DEDUPE_CACHE_MAX_SIZE: 10000,
};
