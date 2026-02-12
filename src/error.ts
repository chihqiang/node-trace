/**
 * 错误处理模块
 * 负责捕获、记录和处理各种类型的错误
 */
import { state } from './core'

/**
 * 错误类型
 */
export type ErrorType = 
  | 'network'              // 网络错误
  | 'network:timeout'      // 网络超时错误
  | 'network:offline'      // 离线错误
  | 'network:server'       // 服务器错误
  | 'network:client'       // 客户端错误
  | 'storage'              // 存储错误
  | 'storage:quota'        // 存储配额错误
  | 'storage:access'       // 存储访问错误
  | 'browser'              // 浏览器 API 错误
  | 'plugin'               // 插件错误
  | 'plugin:init'          // 插件初始化错误
  | 'plugin:execute'       // 插件执行错误
  | 'queue'                // 队列错误
  | 'queue:full'           // 队列满错误
  | 'queue:overflow'       // 队列溢出错误
  | 'device'               // 设备 ID 错误
  | 'session'              // 会话错误
  | 'session:timeout'      // 会话超时错误
  | 'behavior'             // 行为错误
  | 'data'                 // 数据处理错误
  | 'data:validation'      // 数据验证错误
  | 'data:serialization'   // 数据序列化错误
  | 'config'               // 配置错误
  | 'init'                 // 初始化错误
  | 'runtime'              // 运行时错误
  | 'unknown'              // 未知错误

/**
 * 错误级别
 */
export type ErrorLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/**
 * 错误接口
 */
export interface TraceError {
  /**
   * 错误类型
   */
  type: ErrorType
  /**
   * 错误级别
   */
  level: ErrorLevel
  /**
   * 错误消息
   */
  message: string
  /**
   * 错误代码
   */
  code?: string
  /**
   * 错误堆栈
   */
  stack?: string
  /**
   * 错误上下文
   */
  context?: Record<string, unknown>
  /**
   * 错误详情
   */
  details?: Record<string, unknown>
  /**
   * 错误来源
   */
  source?: string
  /**
   * 错误发生的文件
   */
  file?: string
  /**
   * 错误发生的行号
   */
  line?: number
  /**
   * 时间戳
   */
  timestamp: number
  /**
   * 错误ID
   */
  id: string
  /**
   * 相关事件
   */
  event?: string
  /**
   * 用户ID
   */
  userId?: string
  /**
   * 设备ID
   */
  deviceId?: string
}

/**
 * 错误处理配置
 */
export interface ErrorHandlerConfig {
  /**
   * 是否捕获错误
   */
  capture: boolean
  /**
   * 日志级别
   */
  logLevel: ErrorLevel
  /**
   * 最大错误数量
   */
  maxErrors: number
}

/**
 * 错误处理类
 * 负责捕获、记录和处理错误
 */
export class ErrorHandler {
  /**
   * 配置
   * @private
   */
  private config: ErrorHandlerConfig
  
  /**
   * 错误队列
   * @private
   */
  private errors: TraceError[] = []
  
  /**
   * 错误统计
   * @private
   */
  private stats: {
    total: number
    byType: Record<ErrorType, number>
    byLevel: Record<ErrorLevel, number>
    byCode: Record<string, number>
    lastError: number
    rate: {
      lastMinute: number
      lastHour: number
    }
    consecutiveErrors: number
    maxConsecutiveErrors: number
  } = {
    total: 0,
    byType: {} as Record<ErrorType, number>,
    byLevel: {} as Record<ErrorLevel, number>,
    byCode: {} as Record<string, number>,
    lastError: 0,
    rate: {
      lastMinute: 0,
      lastHour: 0
    },
    consecutiveErrors: 0,
    maxConsecutiveErrors: 0
  }
  
  /**
   * 错误时间戳列表
   * @private
   */
  private errorTimestamps: number[] = []

  /**
   * 构造函数
   * @param {Partial<ErrorHandlerConfig>} [config] - 配置选项
   */
  constructor(config?: Partial<ErrorHandlerConfig>) {
    this.config = {
      capture: true,
      logLevel: 'warn',
      maxErrors: 100,
      ...config
    }
    
    // 初始化错误统计
    this.initStats()
  }
  
  /**
   * 初始化错误统计
   * @private
   */
  private initStats(): void {
    // 初始化按类型统计
    const errorTypes: ErrorType[] = [
      'network', 'network:timeout', 'network:offline', 'network:server', 'network:client',
      'storage', 'storage:quota', 'storage:access',
      'browser',
      'plugin', 'plugin:init', 'plugin:execute',
      'queue', 'queue:full', 'queue:overflow',
      'device',
      'session', 'session:timeout',
      'behavior',
      'data', 'data:validation', 'data:serialization',
      'config',
      'init',
      'runtime',
      'unknown'
    ]
    
    errorTypes.forEach(type => {
      this.stats.byType[type] = 0
    })
    
    // 初始化按级别统计
    const errorLevels: ErrorLevel[] = ['debug', 'info', 'warn', 'error', 'fatal']
    errorLevels.forEach(level => {
      this.stats.byLevel[level] = 0
    })
  }

  /**
   * 生成错误ID
   * @private
   * @returns {string} 错误ID
   */
  private generateErrorId(): string {
    return 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 解析错误堆栈
   * @private
   * @param {string} stack - 错误堆栈
   * @returns {Object} 解析结果
   */
  private parseStack(stack: string): { file?: string, line?: number } {
    const stackLines = stack.split('\n')
    for (const line of stackLines) {
      const match = line.match(/at \s*(?:\w+\s+)?\(?([^:]+):(\d+):(\d+)\)?/)
      if (match) {
        return {
          file: match[1],
          line: parseInt(match[2])
        }
      }
    }
    return {}
  }

  /**
   * 更新错误统计
   * @private
   * @param {TraceError} error - 错误对象
   */
  private updateStats(error: TraceError): void {
    // 更新总错误数
    this.stats.total++
    
    // 更新按类型统计
    this.stats.byType[error.type] = (this.stats.byType[error.type] || 0) + 1
    
    // 更新按级别统计
    this.stats.byLevel[error.level] = (this.stats.byLevel[error.level] || 0) + 1
    
    // 更新按代码统计
    if (error.code) {
      this.stats.byCode[error.code] = (this.stats.byCode[error.code] || 0) + 1
    }
    
    // 更新最后错误时间
    this.stats.lastError = error.timestamp
    
    // 更新错误时间戳列表
    this.errorTimestamps.push(error.timestamp)
    
    // 清理过期的时间戳（只保留最近一小时的）
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    this.errorTimestamps = this.errorTimestamps.filter(ts => ts > oneHourAgo)
    
    // 更新错误率
    const oneMinuteAgo = Date.now() - 60 * 1000
    this.stats.rate.lastMinute = this.errorTimestamps.filter(ts => ts > oneMinuteAgo).length
    this.stats.rate.lastHour = this.errorTimestamps.length
    
    // 更新连续错误数
    const timeSinceLastError = error.timestamp - this.stats.lastError
    if (timeSinceLastError < 5000) {
      // 5秒内的错误视为连续错误
      this.stats.consecutiveErrors++
      if (this.stats.consecutiveErrors > this.stats.maxConsecutiveErrors) {
        this.stats.maxConsecutiveErrors = this.stats.consecutiveErrors
      }
    } else {
      this.stats.consecutiveErrors = 1
    }
  }

  /**
   * 记录错误
   * @param {ErrorType} type - 错误类型
   * @param {string} message - 错误消息
   * @param {unknown} [error] - 原始错误对象
   * @param {Record<string, unknown>} [context] - 错误上下文
   * @param {ErrorLevel} [level=error] - 错误级别
   * @param {string} [code] - 错误代码
   * @param {string} [source] - 错误来源
   */
  public captureError(
    type: ErrorType,
    message: string,
    error?: unknown,
    context?: Record<string, unknown>,
    level: ErrorLevel = 'error',
    code?: string,
    source?: string
  ): TraceError {
    const errorObj = error as Error | undefined
    const errorDetails = error as { details?: unknown } | undefined

    if (!this.config.capture) {
      const dummyError: TraceError = {
        type,
        level,
        message,
        code,
        stack: errorObj?.stack,
        context,
        timestamp: Date.now(),
        id: this.generateErrorId()
      }
      return dummyError
    }

    // 解析错误堆栈
    let file: string | undefined
    let line: number | undefined
    if (errorObj?.stack) {
      const stackInfo = this.parseStack(errorObj.stack)
      file = stackInfo.file
      line = stackInfo.line
    }

    // 创建错误对象
    const traceError: TraceError = {
      type,
      level,
      message,
      code,
      stack: errorObj?.stack,
      context,
      details: errorDetails?.details as Record<string, unknown> | undefined,
      source: source || 'unknown',
      file,
      line,
      timestamp: Date.now(),
      id: this.generateErrorId(),
      event: context?.event as string | undefined,
      userId: context?.userId as string | undefined,
      deviceId: context?.deviceId as string | undefined
    }

    // 添加到错误队列
    this.errors.push(traceError)

    // 限制错误队列大小
    if (this.errors.length > this.config.maxErrors) {
      this.errors.shift()
    }

    // 更新错误统计
    this.updateStats(traceError)

    // 记录错误日志
    this.logError(traceError)
    
    // 检查错误率是否过高
    this.checkErrorRate(traceError)
    
    return traceError
  }

  /**
   * 检查错误率
   * @private
   * @param {TraceError} error - 错误对象
   */
  private checkErrorRate(error: TraceError): void {
    // 检查错误率是否过高
    if (this.stats.rate.lastMinute > 10) {
      // 每分钟超过10个错误，可能存在问题
      if (typeof console !== 'undefined') {
        console.warn('[Node-Trace] High error rate detected:', {
          errorsPerMinute: this.stats.rate.lastMinute,
          consecutiveErrors: this.stats.consecutiveErrors,
          maxConsecutiveErrors: this.stats.maxConsecutiveErrors
        })
      }
    }
    
    // 检查连续错误数
    if (this.stats.consecutiveErrors > 5) {
      // 连续超过5个错误，可能存在严重问题
      if (typeof console !== 'undefined') {
        console.error('[Node-Trace] Critical error sequence detected:', {
          consecutiveErrors: this.stats.consecutiveErrors,
          lastError: error,
          recentErrors: this.errors.slice(-3)
        })
      }
    }
  }

  /**
   * 记录错误日志
   * @private
   * @param {TraceError} error - 错误对象
   */
  private logError(error: TraceError): void {
    const debugEnabled = state.options?.debug || false
    const shouldLog = this.shouldLog(error.level)

    if (debugEnabled && shouldLog) {
      const prefix = `[Node-Trace] [${error.type.toUpperCase()}]${error.code ? ` [${error.code}]` : ''}`
      const contextStr = error.context ? ` Context: ${JSON.stringify(error.context)}` : ''
      const detailsStr = error.details ? ` Details: ${JSON.stringify(error.details)}` : ''
      const stackStr = error.stack ? `\nStack: ${error.stack}` : ''
      const errorIdStr = ` ErrorID: ${error.id}`

      switch (error.level) {
        case 'debug':
          console.debug(`${prefix} ${error.message}${errorIdStr}${contextStr}${detailsStr}${stackStr}`)
          break
        case 'info':
          console.info(`${prefix} ${error.message}${errorIdStr}${contextStr}${detailsStr}${stackStr}`)
          break
        case 'warn':
          console.warn(`${prefix} ${error.message}${errorIdStr}${contextStr}${detailsStr}${stackStr}`)
          break
        case 'error':
          console.error(`${prefix} ${error.message}${errorIdStr}${contextStr}${detailsStr}${stackStr}`)
          break
        case 'fatal':
          console.error(`${prefix} [FATAL] ${error.message}${errorIdStr}${contextStr}${detailsStr}${stackStr}`)
          break
      }
    }
  }

  /**
   * 获取错误统计
   * @returns {Object} 错误统计信息
   */
  public getStats(): {
    total: number
    byType: Record<ErrorType, number>
    byLevel: Record<ErrorLevel, number>
    byCode: Record<string, number>
    rate: {
      lastMinute: number
      lastHour: number
    }
    consecutiveErrors: number
    maxConsecutiveErrors: number
  } {
    return {
      ...this.stats
    }
  }

  /**
   * 获取最近的错误
   * @param {number} [count=10] - 错误数量
   * @returns {TraceError[]} 最近的错误列表
   */
  public getRecentErrors(count: number = 10): TraceError[] {
    return this.errors.slice(-count)
  }

  

  /**
   * 检查是否有错误
   * @returns {boolean} 是否有错误
   */
  public hasErrors(): boolean {
    return this.errors.length > 0
  }

  /**
   * 获取错误摘要
   * @returns {Object} 错误摘要
   */
  public getErrorSummary(): {
    total: number
    lastError: TraceError | null
    mostFrequentType: ErrorType | null
    mostFrequentLevel: ErrorLevel | null
    rate: {
      lastMinute: number
      lastHour: number
    }
  } {
    if (this.errors.length === 0) {
      return {
        total: 0,
        lastError: null,
        mostFrequentType: null,
        mostFrequentLevel: null,
        rate: {
          lastMinute: 0,
          lastHour: 0
        }
      }
    }

    // 找到最频繁的错误类型
    let mostFrequentType: ErrorType | null = null
    let maxTypeCount = 0
    Object.entries(this.stats.byType).forEach(([type, count]) => {
      if (count > maxTypeCount) {
        maxTypeCount = count
        mostFrequentType = type as ErrorType
      }
    })

    // 找到最频繁的错误级别
    let mostFrequentLevel: ErrorLevel | null = null
    let maxLevelCount = 0
    Object.entries(this.stats.byLevel).forEach(([level, count]) => {
      if (count > maxLevelCount) {
        maxLevelCount = count
        mostFrequentLevel = level as ErrorLevel
      }
    })

    return {
      total: this.stats.total,
      lastError: this.errors[this.errors.length - 1],
      mostFrequentType,
      mostFrequentLevel,
      rate: {
        lastMinute: this.stats.rate.lastMinute,
        lastHour: this.stats.rate.lastHour
      }
    }
  }

  /**
   * 检查是否应该记录该级别的错误
   * @private
   * @param {ErrorLevel} level - 错误级别
   * @returns {boolean} 是否应该记录
   */
  private shouldLog(level: ErrorLevel): boolean {
    const levelOrder = ['debug', 'info', 'warn', 'error', 'fatal']
    const configLevelIndex = levelOrder.indexOf(this.config.logLevel)
    const errorLevelIndex = levelOrder.indexOf(level)
    return errorLevelIndex >= configLevelIndex
  }

  /**
   * 获取错误队列
   * @returns {TraceError[]} 错误队列
   */
  public getErrors(): TraceError[] {
    return [...this.errors]
  }

  /**
   * 清空错误队列
   */
  public clearErrors(): void {
    this.errors = []
  }

  /**
   * 处理网络错误
   * @param {unknown} error - 错误对象
   * @param {Record<string, unknown>} [context] - 错误上下文
   */
  public handleNetworkError(error: unknown, context?: Record<string, unknown>): void {
    this.captureError('network', 'Network error occurred', error, context)
  }

  /**
   * 处理存储错误
   * @param {unknown} error - 错误对象
   * @param {Record<string, unknown>} [context] - 错误上下文
   */
  public handleStorageError(error: unknown, context?: Record<string, unknown>): void {
    this.captureError('storage', 'Storage error occurred', error, context, 'warn')
  }

  /**
   * 处理浏览器 API 错误
   * @param {unknown} error - 错误对象
   * @param {Record<string, unknown>} [context] - 错误上下文
   */
  public handleBrowserError(error: unknown, context?: Record<string, unknown>): void {
    this.captureError('browser', 'Browser API error occurred', error, context, 'warn')
  }

  /**
   * 处理插件错误
   * @param {unknown} error - 错误对象
   * @param {Record<string, unknown>} [context] - 错误上下文
   */
  public handlePluginError(error: unknown, context?: Record<string, unknown>): void {
    this.captureError('plugin', 'Plugin error occurred', error, context)
  }

  /**
   * 处理队列错误
   * @param {unknown} error - 错误对象
   * @param {Record<string, unknown>} [context] - 错误上下文
   */
  public handleQueueError(error: unknown, context?: Record<string, unknown>): void {
    this.captureError('queue', 'Queue error occurred', error, context)
  }

  /**
   * 处理设备 ID 错误
   * @param {unknown} error - 错误对象
   * @param {Record<string, unknown>} [context] - 错误上下文
   */
  public handleDeviceError(error: unknown, context?: Record<string, unknown>): void {
    this.captureError('device', 'Device ID error occurred', error, context, 'warn')
  }

  /**
   * 处理会话错误
   * @param {unknown} error - 错误对象
   * @param {Record<string, unknown>} [context] - 错误上下文
   */
  public handleSessionError(error: unknown, context?: Record<string, unknown>): void {
    this.captureError('session', 'Session error occurred', error, context, 'warn')
  }

  /**
   * 处理行为错误
   * @param {unknown} error - 错误对象
   * @param {Record<string, unknown>} [context] - 错误上下文
   */
  public handleBehaviorError(error: unknown, context?: Record<string, unknown>): void {
    this.captureError('behavior', 'Behavior error occurred', error, context, 'warn')
  }

  /**
   * 处理数据错误
   * @param {unknown} error - 错误对象
   * @param {Record<string, unknown>} [context] - 错误上下文
   */
  public handleDataError(error: unknown, context?: Record<string, unknown>): void {
    this.captureError('data', 'Data processing error occurred', error, context)
  }

  /**
   * 处理未知错误
   * @param {unknown} error - 错误对象
   * @param {Record<string, unknown>} [context] - 错误上下文
   */
  public handleUnknownError(error: unknown, context?: Record<string, unknown>): void {
    this.captureError('unknown', 'Unknown error occurred', error, context)
  }
}

/**
 * 错误处理器实例
 */
export const errorHandler = new ErrorHandler()

/**
 * 记录错误
 * @param {ErrorType} type - 错误类型
 * @param {string} message - 错误消息
 * @param {unknown} [error] - 原始错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 * @param {ErrorLevel} [level=error] - 错误级别
 */
export function captureError(
  type: ErrorType,
  message: string,
  error?: unknown,
  context?: Record<string, unknown>,
  level: ErrorLevel = 'error'
): void {
  errorHandler.captureError(type, message, error, context, level)
}

/**
 * 处理网络错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleNetworkError(error: unknown, context?: Record<string, unknown>): void {
  errorHandler.handleNetworkError(error, context)
}

/**
 * 处理存储错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleStorageError(error: unknown, context?: Record<string, unknown>): void {
  errorHandler.handleStorageError(error, context)
}

/**
 * 处理浏览器 API 错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleBrowserError(error: unknown, context?: Record<string, unknown>): void {
  errorHandler.handleBrowserError(error, context)
}

/**
 * 处理插件错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handlePluginError(error: unknown, context?: Record<string, unknown>): void {
  errorHandler.handlePluginError(error, context)
}

/**
 * 处理队列错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleQueueError(error: unknown, context?: Record<string, unknown>): void {
  errorHandler.handleQueueError(error, context)
}

/**
 * 处理设备 ID 错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleDeviceError(error: unknown, context?: Record<string, unknown>): void {
  errorHandler.handleDeviceError(error, context)
}

/**
 * 处理会话错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleSessionError(error: unknown, context?: Record<string, unknown>): void {
  errorHandler.handleSessionError(error, context)
}

/**
 * 处理行为错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleBehaviorError(error: unknown, context?: Record<string, unknown>): void {
  errorHandler.handleBehaviorError(error, context)
}

/**
 * 处理数据错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleDataError(error: unknown, context?: Record<string, unknown>): void {
  errorHandler.handleDataError(error, context)
}

/**
 * 处理未知错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
export function handleUnknownError(error: unknown, context?: Record<string, unknown>): void {
  errorHandler.handleUnknownError(error, context)
}
