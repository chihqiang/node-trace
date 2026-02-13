/**
 * Error handling module
 * Main entry file, exports all error handling related types and functions
 */

// Export types
export * from "./types";

// Export error handler
export { ErrorHandler } from "./handler";

// Export statistics utilities
export * from "./stats";

// Create error handler instance
import { ErrorHandler } from "./handler";

/**
 * Error handler instance
 */
export const errorHandler = new ErrorHandler();

/**
 * Capture error
 * @param type - Error type
 * @param message - Error message
 * @param error - Original error object
 * @param context - Error context
 * @param level - Error level
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
 * Handle network error
 * @param error - Error object
 * @param context - Error context
 */
export function handleNetworkError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleNetworkError(error, context);
}

/**
 * Handle storage error
 * @param error - Error object
 * @param context - Error context
 */
export function handleStorageError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleStorageError(error, context);
}

/**
 * Handle browser API error
 * @param error - Error object
 * @param context - Error context
 */
export function handleBrowserError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleBrowserError(error, context);
}

/**
 * Handle plugin error
 * @param error - Error object
 * @param context - Error context
 */
export function handlePluginError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handlePluginError(error, context);
}

/**
 * Handle queue error
 * @param error - Error object
 * @param context - Error context
 */
export function handleQueueError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleQueueError(error, context);
}

/**
 * Handle device ID error
 * @param error - Error object
 * @param context - Error context
 */
export function handleDeviceError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleDeviceError(error, context);
}

/**
 * Handle session error
 * @param error - Error object
 * @param context - Error context
 */
export function handleSessionError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleSessionError(error, context);
}

/**
 * Handle behavior error
 * @param error - Error object
 * @param context - Error context
 */
export function handleBehaviorError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleBehaviorError(error, context);
}

/**
 * Handle data error
 * @param error - Error object
 * @param context - Error context
 */
export function handleDataError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleDataError(error, context);
}

/**
 * Handle unknown error
 * @param error - Error object
 * @param context - Error context
 */
export function handleUnknownError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorHandler.handleUnknownError(error, context);
}
