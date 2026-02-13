/**
 * Error statistics module
 */
import {
  ErrorType,
  ErrorLevel,
  TraceError,
  ErrorStats,
  ErrorSummary,
} from "./types";

/**
 * Initialize error statistics
 * @returns Initialized error statistics object
 */
export function initializeStats(): ErrorStats {
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

  const errorLevels: ErrorLevel[] = ["debug", "info", "warn", "error", "fatal"];

  const byType = {} as Record<ErrorType, number>;
  errorTypes.forEach((type) => {
    byType[type] = 0;
  });

  const byLevel = {} as Record<ErrorLevel, number>;
  errorLevels.forEach((level) => {
    byLevel[level] = 0;
  });

  return {
    total: 0,
    byType,
    byLevel,
    byCode: {},
    lastError: 0,
    rate: {
      lastMinute: 0,
      lastHour: 0,
    },
    consecutiveErrors: 0,
    maxConsecutiveErrors: 0,
  };
}

/**
 * Calculate error rate
 * @param timestamps - List of error timestamps
 * @returns Error rate object
 */
export function calculateErrorRate(timestamps: number[]): {
  lastMinute: number;
  lastHour: number;
} {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  return {
    lastMinute: timestamps.filter((ts) => ts > oneMinuteAgo).length,
    lastHour: timestamps.filter((ts) => ts > oneHourAgo).length,
  };
}

/**
 * Generate error summary
 * @param errors - List of errors
 * @param stats - Error statistics
 * @returns Error summary
 */
export function generateErrorSummary(
  errors: TraceError[],
  stats: ErrorStats,
): ErrorSummary {
  if (errors.length === 0) {
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

  // Find the most frequent error type
  let mostFrequentType: ErrorType | null = null;
  let maxTypeCount = 0;
  Object.entries(stats.byType).forEach(([type, count]) => {
    if (count > maxTypeCount) {
      maxTypeCount = count;
      mostFrequentType = type as ErrorType;
    }
  });

  // Find the most frequent error level
  let mostFrequentLevel: ErrorLevel | null = null;
  let maxLevelCount = 0;
  Object.entries(stats.byLevel).forEach(([level, count]) => {
    if (count > maxLevelCount) {
      maxLevelCount = count;
      mostFrequentLevel = level as ErrorLevel;
    }
  });

  return {
    total: stats.total,
    lastError: errors[errors.length - 1],
    mostFrequentType,
    mostFrequentLevel,
    rate: stats.rate,
  };
}

/**
 * Clean up expired timestamps
 * @param timestamps - List of timestamps
 * @param threshold - Threshold timestamp
 * @returns Cleaned list of timestamps
 */
export function cleanupTimestamps(
  timestamps: number[],
  threshold: number,
): number[] {
  return timestamps.filter((ts) => ts > threshold);
}
