/**
 * Error handler implementation
 */
import { state } from "../core";
import {
  ErrorType,
  ErrorLevel,
  TraceError,
  ErrorHandlerConfig,
  ErrorStats,
} from "./types";

/**
 * Error handler class
 * Responsible for capturing, recording, and handling errors
 */
export class ErrorHandler {
  /**
   * Configuration
   * @private
   */
  private config: ErrorHandlerConfig;

  /**
   * Error queue
   * @private
   */
  private errors: TraceError[] = [];

  /**
   * Error statistics
   * @private
   */
  private stats: ErrorStats = {
    total: 0,
    byType: {} as Record<ErrorType, number>,
    byLevel: {} as Record<ErrorLevel, number>,
    byCode: {} as Record<string, number>,
    lastError: 0,
    rate: {
      lastMinute: 0,
      lastHour: 0,
    },
    consecutiveErrors: 0,
    maxConsecutiveErrors: 0,
  };

  /**
   * Error timestamp list
   * @private
   */
  private errorTimestamps: number[] = [];

  /**
   * Constructor
   * @param config - Configuration options
   */
  constructor(config?: Partial<ErrorHandlerConfig>) {
    this.config = {
      capture: true,
      logLevel: "warn",
      maxErrors: 100,
      ...config,
    };

    // Initialize error statistics
    this.initStats();
  }

  /**
   * Initialize error statistics
   * @private
   */
  private initStats(): void {
    // Initialize statistics by type
    const errorTypes: ErrorType[] = [
      "network",
      "network:timeout",
      "network:offline",
      "network:server",
      "network:client",
      "storage",
      "storage:quota",
      "storage:access",
      "browser",
      "plugin",
      "plugin:init",
      "plugin:execute",
      "queue",
      "queue:full",
      "queue:overflow",
      "device",
      "session",
      "session:timeout",
      "behavior",
      "data",
      "data:validation",
      "data:serialization",
      "config",
      "init",
      "runtime",
      "unknown",
    ];

    errorTypes.forEach((type) => {
      this.stats.byType[type] = 0;
    });

    // Initialize statistics by level
    const errorLevels: ErrorLevel[] = [
      "debug",
      "info",
      "warn",
      "error",
      "fatal",
    ];
    errorLevels.forEach((level) => {
      this.stats.byLevel[level] = 0;
    });
  }

  /**
   * Generate error ID
   * @private
   * @returns Error ID
   */
  private generateErrorId(): string {
    return (
      "error_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  /**
   * Parse error stack
   * @private
   * @param stack - Error stack
   * @returns Parsed result
   */
  private parseStack(stack: string): { file?: string; line?: number } {
    const stackLines = stack.split("\n");
    for (const line of stackLines) {
      const match = line.match(/at \s*(?:\w+\s+)?\(?([^:]+):(\d+):(\d+)\)?/);
      if (match) {
        return {
          file: match[1],
          line: parseInt(match[2]),
        };
      }
    }
    return {};
  }

  /**
   * Update error statistics
   * @private
   * @param error - Error object
   */
  private updateStats(error: TraceError): void {
    // Update total error count
    this.stats.total++;

    // Update statistics by type
    this.stats.byType[error.type] = (this.stats.byType[error.type] || 0) + 1;

    // Update statistics by level
    this.stats.byLevel[error.level] =
      (this.stats.byLevel[error.level] || 0) + 1;

    // Update statistics by code
    if (error.code) {
      this.stats.byCode[error.code] = (this.stats.byCode[error.code] || 0) + 1;
    }

    // Update last error time
    this.stats.lastError = error.timestamp;

    // Update error timestamp list
    this.errorTimestamps.push(error.timestamp);

    // Clean up expired timestamps (keep only the last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.errorTimestamps = this.errorTimestamps.filter((ts) => ts > oneHourAgo);

    // Update error rate
    const oneMinuteAgo = Date.now() - 60 * 1000;
    this.stats.rate.lastMinute = this.errorTimestamps.filter(
      (ts) => ts > oneMinuteAgo,
    ).length;
    this.stats.rate.lastHour = this.errorTimestamps.length;

    // Update consecutive error count
    const timeSinceLastError = error.timestamp - this.stats.lastError;
    if (timeSinceLastError < 5000) {
      // Errors within 5 seconds are considered consecutive
      this.stats.consecutiveErrors++;
      if (this.stats.consecutiveErrors > this.stats.maxConsecutiveErrors) {
        this.stats.maxConsecutiveErrors = this.stats.consecutiveErrors;
      }
    } else {
      this.stats.consecutiveErrors = 1;
    }
  }

  /**
   * Record error
   * @param type - Error type
   * @param message - Error message
   * @param error - Original error object
   * @param context - Error context
   * @param level - Error level
   * @param code - Error code
   * @param source - Error source
   */
  public captureError(
    type: ErrorType,
    message: string,
    error?: unknown,
    context?: Record<string, unknown>,
    level: ErrorLevel = "error",
    code?: string,
    source?: string,
  ): TraceError {
    const errorObj = error as Error | undefined;
    const errorDetails = error as { details?: unknown } | undefined;

    if (!this.config.capture) {
      const dummyError: TraceError = {
        type,
        level,
        message,
        code,
        stack: errorObj?.stack,
        context,
        timestamp: Date.now(),
        id: this.generateErrorId(),
      };
      return dummyError;
    }

    // Parse error stack
    let file: string | undefined;
    let line: number | undefined;
    if (errorObj?.stack) {
      const stackInfo = this.parseStack(errorObj.stack);
      file = stackInfo.file;
      line = stackInfo.line;
    }

    // Create error object
    const traceError: TraceError = {
      type,
      level,
      message,
      code,
      stack: errorObj?.stack,
      context,
      details: errorDetails?.details as Record<string, unknown> | undefined,
      source: source || "unknown",
      file,
      line,
      timestamp: Date.now(),
      id: this.generateErrorId(),
      event: context?.event as string | undefined,
      userId: context?.userId as string | undefined,
      deviceId: context?.deviceId as string | undefined,
    };

    // Add to error queue
    this.errors.push(traceError);

    // Limit error queue size
    if (this.errors.length > this.config.maxErrors) {
      this.errors.shift();
    }

    // Update error statistics
    this.updateStats(traceError);

    // Log error
    this.logError(traceError);

    // Check if error rate is too high
    this.checkErrorRate(traceError);

    return traceError;
  }

  /**
   * Check error rate
   * @private
   * @param error - Error object
   */
  private checkErrorRate(error: TraceError): void {
    // Check if error rate is too high
    if (this.stats.rate.lastMinute > 10) {
      // More than 10 errors per minute, there may be a problem
      if (typeof console !== "undefined") {
        console.warn("[Node-Trace] High error rate detected:", {
          errorsPerMinute: this.stats.rate.lastMinute,
          consecutiveErrors: this.stats.consecutiveErrors,
          maxConsecutiveErrors: this.stats.maxConsecutiveErrors,
        });
      }
    }

    // Check consecutive error count
    if (this.stats.consecutiveErrors > 5) {
      // More than 5 consecutive errors, there may be a serious problem
      if (typeof console !== "undefined") {
        console.error("[Node-Trace] Critical error sequence detected:", {
          consecutiveErrors: this.stats.consecutiveErrors,
          lastError: error,
          recentErrors: this.errors.slice(-3),
        });
      }
    }
  }

  /**
   * Log error
   * @private
   * @param error - Error object
   */
  private logError(error: TraceError): void {
    const debugEnabled = state.options?.debug || false;
    const shouldLog = this.shouldLog(error.level);

    if (debugEnabled && shouldLog) {
      const prefix = `[Node-Trace] [${error.type.toUpperCase()}]${error.code ? ` [${error.code}]` : ""}`;
      const contextStr = error.context
        ? ` Context: ${JSON.stringify(error.context)}`
        : "";
      const detailsStr = error.details
        ? ` Details: ${JSON.stringify(error.details)}`
        : "";
      const stackStr = error.stack ? `\nStack: ${error.stack}` : "";
      const errorIdStr = ` ErrorID: ${error.id}`;

      switch (error.level) {
        case "debug":
          console.debug(
            `${prefix} ${error.message}${errorIdStr}${contextStr}${detailsStr}${stackStr}`,
          );
          break;
        case "info":
          console.info(
            `${prefix} ${error.message}${errorIdStr}${contextStr}${detailsStr}${stackStr}`,
          );
          break;
        case "warn":
          console.warn(
            `${prefix} ${error.message}${errorIdStr}${contextStr}${detailsStr}${stackStr}`,
          );
          break;
        case "error":
          console.error(
            `${prefix} ${error.message}${errorIdStr}${contextStr}${detailsStr}${stackStr}`,
          );
          break;
        case "fatal":
          console.error(
            `${prefix} [FATAL] ${error.message}${errorIdStr}${contextStr}${detailsStr}${stackStr}`,
          );
          break;
      }
    }
  }

  /**
   * Get error statistics
   * @returns Error statistics information
   */
  public getStats(): ErrorStats {
    return {
      ...this.stats,
    };
  }

  /**
   * Get recent errors
   * @param count - Number of errors
   * @returns List of recent errors
   */
  public getRecentErrors(count: number = 10): TraceError[] {
    return this.errors.slice(-count);
  }

  /**
   * Check if there are errors
   * @returns Whether there are errors
   */
  public hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Get error summary
   * @returns Error summary
   */
  public getErrorSummary(): {
    total: number;
    lastError: TraceError | null;
    mostFrequentType: ErrorType | null;
    mostFrequentLevel: ErrorLevel | null;
    rate: {
      lastMinute: number;
      lastHour: number;
    };
  } {
    if (this.errors.length === 0) {
      return {
        total: 0,
        lastError: null,
        mostFrequentType: null,
        mostFrequentLevel: null,
        rate: {
          lastMinute: 0,
          lastHour: 0,
        },
      };
    }

    // Find most frequent error type
    let mostFrequentType: ErrorType | null = null;
    let maxTypeCount = 0;
    Object.entries(this.stats.byType).forEach(([type, count]) => {
      if (count > maxTypeCount) {
        maxTypeCount = count;
        mostFrequentType = type as ErrorType;
      }
    });

    // Find most frequent error level
    let mostFrequentLevel: ErrorLevel | null = null;
    let maxLevelCount = 0;
    Object.entries(this.stats.byLevel).forEach(([level, count]) => {
      if (count > maxLevelCount) {
        maxLevelCount = count;
        mostFrequentLevel = level as ErrorLevel;
      }
    });

    return {
      total: this.stats.total,
      lastError: this.errors[this.errors.length - 1],
      mostFrequentType,
      mostFrequentLevel,
      rate: {
        lastMinute: this.stats.rate.lastMinute,
        lastHour: this.stats.rate.lastHour,
      },
    };
  }

  /**
   * Check if this error level should be logged
   * @private
   * @param level - Error level
   * @returns Whether to log
   */
  private shouldLog(level: ErrorLevel): boolean {
    const levelOrder = ["debug", "info", "warn", "error", "fatal"];
    const configLevelIndex = levelOrder.indexOf(this.config.logLevel);
    const errorLevelIndex = levelOrder.indexOf(level);
    return errorLevelIndex >= configLevelIndex;
  }

  /**
   * Get error queue
   * @returns Error queue
   */
  public getErrors(): TraceError[] {
    return [...this.errors];
  }

  /**
   * Clear error queue
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * Handle network error
   * @param error - Error object
   * @param context - Error context
   */
  public handleNetworkError(
    error: unknown,
    context?: Record<string, unknown>,
  ): void {
    this.captureError("network", "Network error occurred", error, context);
  }

  /**
   * Handle storage error
   * @param error - Error object
   * @param context - Error context
   */
  public handleStorageError(
    error: unknown,
    context?: Record<string, unknown>,
  ): void {
    this.captureError(
      "storage",
      "Storage error occurred",
      error,
      context,
      "warn",
    );
  }

  /**
   * Handle browser API error
   * @param error - Error object
   * @param context - Error context
   */
  public handleBrowserError(
    error: unknown,
    context?: Record<string, unknown>,
  ): void {
    this.captureError(
      "browser",
      "Browser API error occurred",
      error,
      context,
      "warn",
    );
  }

  /**
   * Handle plugin error
   * @param error - Error object
   * @param context - Error context
   */
  public handlePluginError(
    error: unknown,
    context?: Record<string, unknown>,
  ): void {
    this.captureError("plugin", "Plugin error occurred", error, context);
  }

  /**
   * Handle queue error
   * @param error - Error object
   * @param context - Error context
   */
  public handleQueueError(
    error: unknown,
    context?: Record<string, unknown>,
  ): void {
    this.captureError("queue", "Queue error occurred", error, context);
  }

  /**
   * Handle device ID error
   * @param error - Error object
   * @param context - Error context
   */
  public handleDeviceError(
    error: unknown,
    context?: Record<string, unknown>,
  ): void {
    this.captureError(
      "device",
      "Device ID error occurred",
      error,
      context,
      "warn",
    );
  }

  /**
   * Handle session error
   * @param error - Error object
   * @param context - Error context
   */
  public handleSessionError(
    error: unknown,
    context?: Record<string, unknown>,
  ): void {
    this.captureError(
      "session",
      "Session error occurred",
      error,
      context,
      "warn",
    );
  }

  /**
   * Handle behavior error
   * @param error - Error object
   * @param context - Error context
   */
  public handleBehaviorError(
    error: unknown,
    context?: Record<string, unknown>,
  ): void {
    this.captureError(
      "behavior",
      "Behavior error occurred",
      error,
      context,
      "warn",
    );
  }

  /**
   * Handle data error
   * @param error - Error object
   * @param context - Error context
   */
  public handleDataError(
    error: unknown,
    context?: Record<string, unknown>,
  ): void {
    this.captureError("data", "Data processing error occurred", error, context);
  }

  /**
   * Handle unknown error
   * @param error - Error object
   * @param context - Error context
   */
  public handleUnknownError(
    error: unknown,
    context?: Record<string, unknown>,
  ): void {
    this.captureError("unknown", "Unknown error occurred", error, context);
  }
}
