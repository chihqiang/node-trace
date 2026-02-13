/**
 * 错误类型定义
 */

/**
 * 错误类型
 */
export type ErrorType =
  | "network" // 网络错误
  | "network:timeout" // 网络超时错误
  | "network:offline" // 离线错误
  | "network:server" // 服务器错误
  | "network:client" // 客户端错误
  | "storage" // 存储错误
  | "storage:quota" // 存储配额错误
  | "storage:access" // 存储访问错误
  | "browser" // 浏览器 API 错误
  | "plugin" // 插件错误
  | "plugin:init" // 插件初始化错误
  | "plugin:execute" // 插件执行错误
  | "queue" // 队列错误
  | "queue:full" // 队列满错误
  | "queue:overflow" // 队列溢出错误
  | "device" // 设备 ID 错误
  | "session" // 会话错误
  | "session:timeout" // 会话超时错误
  | "behavior" // 行为错误
  | "data" // 数据处理错误
  | "data:validation" // 数据验证错误
  | "data:serialization" // 数据序列化错误
  | "config" // 配置错误
  | "init" // 初始化错误
  | "runtime" // 运行时错误
  | "unknown"; // 未知错误

/**
 * 错误级别
 */
export type ErrorLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * 错误接口
 */
export interface TraceError {
  /**
   * 错误类型
   */
  type: ErrorType;
  /**
   * 错误级别
   */
  level: ErrorLevel;
  /**
   * 错误消息
   */
  message: string;
  /**
   * 错误代码
   */
  code?: string;
  /**
   * 错误堆栈
   */
  stack?: string;
  /**
   * 错误上下文
   */
  context?: Record<string, unknown>;
  /**
   * 错误详情
   */
  details?: Record<string, unknown>;
  /**
   * 错误来源
   */
  source?: string;
  /**
   * 错误发生的文件
   */
  file?: string;
  /**
   * 错误发生的行号
   */
  line?: number;
  /**
   * 时间戳
   */
  timestamp: number;
  /**
   * 错误ID
   */
  id: string;
  /**
   * 相关事件
   */
  event?: string;
  /**
   * 用户ID
   */
  userId?: string;
  /**
   * 设备ID
   */
  deviceId?: string;
}

/**
 * 错误处理配置
 */
export interface ErrorHandlerConfig {
  /**
   * 是否捕获错误
   */
  capture: boolean;
  /**
   * 日志级别
   */
  logLevel: ErrorLevel;
  /**
   * 最大错误数量
   */
  maxErrors: number;
}

/**
 * 错误统计接口
 */
export interface ErrorStats {
  total: number;
  byType: Record<ErrorType, number>;
  byLevel: Record<ErrorLevel, number>;
  byCode: Record<string, number>;
  lastError: number;
  rate: {
    lastMinute: number;
    lastHour: number;
  };
  consecutiveErrors: number;
  maxConsecutiveErrors: number;
}

/**
 * 错误摘要接口
 */
export interface ErrorSummary {
  total: number;
  lastError: TraceError | null;
  mostFrequentType: ErrorType | null;
  mostFrequentLevel: ErrorLevel | null;
  rate: {
    lastMinute: number;
    lastHour: number;
  };
}
