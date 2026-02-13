/**
 * Error type definitions
 */

/**
 * Error types
 */
export type ErrorType =
  | "network" // Network error
  | "network:timeout" // Network timeout error
  | "network:offline" // Offline error
  | "network:server" // Server error
  | "network:client" // Client error
  | "storage" // Storage error
  | "storage:quota" // Storage quota error
  | "storage:access" // Storage access error
  | "browser" // Browser API error
  | "plugin" // Plugin error
  | "plugin:init" // Plugin initialization error
  | "plugin:execute" // Plugin execution error
  | "queue" // Queue error
  | "queue:full" // Queue full error
  | "queue:overflow" // Queue overflow error
  | "device" // Device ID error
  | "session" // Session error
  | "session:timeout" // Session timeout error
  | "behavior" // Behavior error
  | "data" // Data processing error
  | "data:validation" // Data validation error
  | "data:serialization" // Data serialization error
  | "config" // Configuration error
  | "init" // Initialization error
  | "runtime" // Runtime error
  | "unknown"; // Unknown error

/**
 * Error levels
 */
export type ErrorLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Error interface
 */
export interface TraceError {
  /**
   * Error type
   */
  type: ErrorType;
  /**
   * Error level
   */
  level: ErrorLevel;
  /**
   * Error message
   */
  message: string;
  /**
   * Error code
   */
  code?: string;
  /**
   * Error stack
   */
  stack?: string;
  /**
   * Error context
   */
  context?: Record<string, unknown>;
  /**
   * Error details
   */
  details?: Record<string, unknown>;
  /**
   * Error source
   */
  source?: string;
  /**
   * File where error occurred
   */
  file?: string;
  /**
   * Line number where error occurred
   */
  line?: number;
  /**
   * Timestamp
   */
  timestamp: number;
  /**
   * Error ID
   */
  id: string;
  /**
   * Related event
   */
  event?: string;
  /**
   * User ID
   */
  userId?: string;
  /**
   * Device ID
   */
  deviceId?: string;
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  /**
   * Whether to capture errors
   */
  capture: boolean;
  /**
   * Log level
   */
  logLevel: ErrorLevel;
  /**
   * Maximum number of errors
   */
  maxErrors: number;
}

/**
 * Error statistics interface
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
 * Error summary interface
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
