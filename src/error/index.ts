/**
 * 错误处理模块
 * 主入口文件，导出所有错误处理相关的类型和函数
 */

// 导出类型
export * from "./types";

// 导出错误处理器
export { ErrorHandler } from "./handler";

// 导出统计工具
export * from "./stats";

// 创建错误处理器实例
import { ErrorHandler } from "./handler";

/**
 * 错误处理器实例
 */
export const errorHandler = new ErrorHandler();

/**
 * 记录错误
 * @param {import('./types').ErrorType} type - 错误类型
 * @param {string} message - 错误消息
 * @param {unknown} [error] - 原始错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 * @param {import('./types').ErrorLevel} [level=error] - 错误级别
 */
export function captureError(
  type: import("./types").ErrorType,
  message: string,
  error?: unknown,
  context?: Record<string, unknown>,
  level: import("./types").ErrorLevel = "error",
): void {
  errorHandler.captureError(type, message, error, context, level);
}

/**
 * 处理网络错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleNetworkError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleNetworkError(error, context);
}

/**
 * 处理存储错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleStorageError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleStorageError(error, context);
}

/**
 * 处理浏览器 API 错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleBrowserError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleBrowserError(error, context);
}

/**
 * 处理插件错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handlePluginError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handlePluginError(error, context);
}

/**
 * 处理队列错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleQueueError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleQueueError(error, context);
}

/**
 * 处理设备 ID 错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleDeviceError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleDeviceError(error, context);
}

/**
 * 处理会话错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleSessionError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleSessionError(error, context);
}

/**
 * 处理行为错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleBehaviorError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleBehaviorError(error, context);
}

/**
 * 处理数据错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleDataError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleDataError(error, context);
}

/**
 * 处理未知错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleUnknownError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleUnknownError(error, context);
}
