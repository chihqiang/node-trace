/**
 * 错误统计模块
 */
import {
  ErrorType,
  ErrorLevel,
  TraceError,
  ErrorStats,
  ErrorSummary,
} from "./types";

/**
 * 初始化错误统计
 * @returns {ErrorStats} 初始化后的错误统计对象
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
 * 计算错误率
 * @param {number[]} timestamps - 错误时间戳列表
 * @returns {Object} 错误率对象
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
 * 生成错误摘要
 * @param {TraceError[]} errors - 错误列表
 * @param {ErrorStats} stats - 错误统计
 * @returns {ErrorSummary} 错误摘要
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

  // 找到最频繁的错误类型
  let mostFrequentType: ErrorType | null = null;
  let maxTypeCount = 0;
  Object.entries(stats.byType).forEach(([type, count]) => {
    if (count > maxTypeCount) {
      maxTypeCount = count;
      mostFrequentType = type as ErrorType;
    }
  });

  // 找到最频繁的错误级别
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
 * 清理过期的时间戳
 * @param {number[]} timestamps - 时间戳列表
 * @param {number} threshold - 阈值时间戳
 * @returns {number[]} 清理后的时间戳列表
 */
export function cleanupTimestamps(
  timestamps: number[],
  threshold: number,
): number[] {
  return timestamps.filter((ts) => ts > threshold);
}
