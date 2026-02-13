/**
 * 类型定义模块
 * 包含项目中使用的各种类型和接口定义
 */
/**
 * 事件属性类型
 * 键值对形式，值可以是字符串、数字、布尔值、null或undefined
 */
type EventProperties = Record<string, string | number | boolean | null | undefined>;
/**
 * 泛型事件负载接口
 * @template T - 事件属性类型
 */
interface Payload<T extends EventProperties = EventProperties> {
    /**
     * 事件ID
     */
    id: string;
    /**
     * 事件名称
     */
    event: string;
    /**
     * 事件属性
     */
    properties?: T;
    /**
     * 事件时间戳
     */
    timestamp: number;
    /**
     * 扩展参数
     */
    [key: string]: unknown;
}
/**
 * 配置选项接口
 */
interface Options {
    /**
     * 应用ID
     */
    appId: string;
    /**
     * 应用密钥
     */
    appKey?: string;
    /**
     * 事件发送端点
     */
    endpoint: string;
    /**
     * 是否开启调试模式
     */
    debug?: boolean;
    /**
     * 事件采样率（0-1）
     */
    sampleRate?: number;
    /**
     * 事件黑名单
     */
    blacklist?: string[];
    /**
     * 事件白名单
     */
    whitelist?: string[];
    /**
     * 批量发送大小
     */
    batchSize?: number;
    /**
     * 批量发送间隔（毫秒）
     */
    batchInterval?: number;
    /**
     * 是否启用离线缓存
     */
    offlineEnabled?: boolean;
    /**
     * 最大队列大小
     */
    maxQueueSize?: number;
    /**
     * 重试次数
     */
    retryCount?: number;
    /**
     * 重试间隔（毫秒）
     */
    retryInterval?: number;
    /**
     * 请求头
     */
    headers?: Record<string, string>;
    /**
     * 超时时间（毫秒）
     */
    timeout?: number;
    /**
     * 发送前回调函数
     */
    beforeSend?: <T extends EventProperties>(event: Payload<T>) => Payload<T> | null;
}
/**
 * 插件生命周期阶段
 */
type PluginLifecycle = 'idle' | 'loading' | 'active' | 'error' | 'destroyed';
/**
 * 插件上下文接口
 */
interface IPluginContext {
    /**
     * 获取插件管理器实例
     */
    getPlugins(): Record<string, IPlugin>;
    /**
     * 获取指定插件实例
     * @param {string} name - 插件名称
     * @returns {IPlugin | null} 插件实例
     */
    getPlugin(name: string): IPlugin | null;
    /**
     * 获取所有已注册的插件
     * @returns {IPlugin[]} 插件列表
     */
    getAllPlugins(): IPlugin[];
    /**
     * 调用插件方法
     * @param {string} pluginName - 插件名称
     * @param {string} methodName - 方法名称
     * @param {unknown[]} args - 方法参数
     * @returns {unknown} 方法返回值
     */
    callPluginMethod(pluginName: string, methodName: string, ...args: unknown[]): unknown;
}
/**
 * 插件接口
 */
interface IPlugin {
    /**
     * 插件名称
     */
    name: string;
    /**
     * 插件版本
     */
    version?: string;
    /**
     * 插件描述
     */
    description?: string;
    /**
     * 插件设置方法
     */
    setup?(context: IPluginContext): void;
    /**
     * 插件初始化方法
     */
    init?(context: IPluginContext): void;
    /**
     * 插件激活方法
     */
    activate?(context: IPluginContext): void;
    /**
     * 插件停用方法
     */
    deactivate?(context: IPluginContext): void;
    /**
     * 插件销毁方法
     */
    destroy?(context: IPluginContext): void;
    /**
     * 插件依赖
     */
    dependencies?: string[];
    /**
     * 插件冲突
     */
    conflicts?: string[];
    /**
     * 插件优先级（数字越小，优先级越高）
     */
    priority?: number;
    /**
     * 插件是否启用
     */
    enabled?: boolean;
    /**
     * 插件生命周期状态
     */
    lifecycle?: PluginLifecycle;
    /**
     * 事件跟踪前回调
     */
    onTrack?: <T extends EventProperties>(event: Payload<T>) => Payload<T> | null;
    /**
     * 事件跟踪后回调
     */
    onTracked?: <T extends EventProperties>(event: Payload<T>) => void;
    /**
     * 发送前回调
     */
    beforeSend?: <T extends EventProperties>(events: Payload<T>[]) => Payload<T>[];
    /**
     * 发送后回调
     */
    afterSend?: <T extends EventProperties>(events: Payload<T>[], success: boolean) => void;
    /**
     * 初始化前回调
     */
    beforeInit?(context: IPluginContext): void;
    /**
     * 初始化后回调
     */
    afterInit?(context: IPluginContext): void;
    /**
     * 销毁前回调
     */
    beforeDestroy?(context: IPluginContext): void;
    /**
     * 销毁后回调
     */
    afterDestroy?(context: IPluginContext): void;
    /**
     * 插件配置
     */
    config?: Record<string, unknown>;
    /**
     * 插件状态
     */
    state?: Record<string, unknown>;
    /**
     * 获取插件信息
     */
    getInfo?: () => Record<string, unknown>;
}

/**
 * 核心模块
 * 包含初始化、事件跟踪、插件管理等核心功能
 */

/**
 * 插件管理器
 * 负责插件的注册、初始化、销毁等操作
 */
declare class Plugins {
    /**
     * 插件映射
     * @private
     * @type {Map<string, IPlugin>}
     */
    private plugins;
    /**
     * 创建插件上下文
     * @returns {IPluginContext} 插件上下文
     */
    private createPluginContext;
    /**
     * 注册插件
     * @param {IPlugin} plugin - 插件实例
     * @returns {boolean} 是否注册成功
     */
    register(plugin: IPlugin): boolean;
    /**
     * 初始化插件
     * @param {IPlugin} plugin - 插件实例
     * @returns {boolean} 是否初始化成功
     */
    init(plugin: IPlugin): boolean;
    /**
     * 销毁插件
     * @param {IPlugin} plugin - 插件实例
     * @returns {boolean} 是否销毁成功
     */
    destroy(plugin: IPlugin): boolean;
    /**
     * 获取插件
     * @param {string} name - 插件名称
     * @returns {IPlugin | undefined} 插件实例
     */
    get(name: string): IPlugin | undefined;
    /**
     * 获取所有插件
     * @returns {IPlugin[]} 插件列表
     */
    getAll(): IPlugin[];
    /**
     * 获取启用的插件
     * @returns {IPlugin[]} 启用的插件列表
     */
    getEnabled(): IPlugin[];
    /**
     * 启用插件
     * @param {string} name - 插件名称
     * @returns {boolean} 是否启用成功
     */
    enable(name: string): boolean;
    /**
     * 禁用插件
     * @param {string} name - 插件名称
     * @returns {boolean} 是否禁用成功
     */
    disable(name: string): boolean;
    /**
     * 移除插件
     * @param {string} name - 插件名称
     * @returns {boolean} 是否移除成功
     */
    remove(name: string): boolean;
    /**
     * 清空插件
     */
    clear(): void;
    /**
     * 按优先级排序插件
     * @returns {IPlugin[]} 排序后的插件列表
     */
    sort(): IPlugin[];
}
/**
 * 插件管理器实例
 * @type {PluginManager}
 */
declare const plugins: Plugins;
/**
 * 初始化配置
 * @param {Options} options - 配置选项
 */
declare function init(options: Options): void;
/**
 * 使用插件
 * @param {IPlugin} plugin - 插件实例
 */
declare function use(plugin: IPlugin): void;
/**
 * 跟踪事件
 * @template T
 * @param {string} event - 事件名称
 * @param {T} [properties] - 事件属性
 * @returns {void}
 */
declare function track<T extends EventProperties>(event: string, properties?: T): void;

/**
 * 队列管理模块
 * 负责事件的推送、调度、发送和离线缓存等功能
 * 重构为模块化架构，提高可维护性和可测试性
 */

/**
 * 发送队列中的事件
 */
declare function flush(): Promise<void>;
/**
 * 清除所有定时器
 */
declare function clearTimers(): void;

/**
 * 用户管理插件
 * 负责设备ID和用户ID的生成、存储和管理
 */

/**
 * 异步版本的设备ID生成
 * @returns 设备ID
 */
declare function generateStableDeviceIdAsync(): Promise<string>;
/**
 * 获取设备ID
 * @returns 设备ID
 */
declare function getDeviceId(): string;
/**
 * 设置用户ID
 * @param id - 用户ID
 */
declare function setID(id: string): void;
/**
 * 获取用户ID
 * @returns 用户ID
 */
declare function getID(): string;
/**
 * 清除用户ID
 */
declare function clearID(): void;
/**
 * 用户插件
 */
declare const userPlugin: IPlugin;

declare const storageUtils: {
    get: (key: string, parser?: (value: string) => unknown) => unknown;
    set: (key: string, value: unknown) => boolean;
    remove: (key: string) => boolean;
    clear: () => boolean;
};

interface BrowserData {
    device_id: string;
    event: string;
    user_agent: string;
    device_width: number;
    device_height: number;
    is_online: boolean;
    connection_type?: string;
    downlink?: number;
    effective_type?: string;
    rtt?: number;
    app_code_name: string;
    app_name: string;
    language: string;
    platform: string;
    time_zone: string;
    browser_version?: string;
    browser_name?: string;
    browser_major_version?: string;
    engine_name?: string;
    engine_version?: string;
    device_pixel_ratio: number;
    is_mobile?: boolean;
    is_tablet?: boolean;
    is_desktop?: boolean;
    current_url: string;
    pathname: string;
    hostname: string;
    protocol: string;
    port?: string;
    search?: string;
    hash?: string;
    document_url: string;
    referrer_url: string;
    content_type: string;
    document_title: string;
    document_charset: string;
    document_ready_state?: string;
    screen_width: number;
    screen_height: number;
    screen_available_width: number;
    screen_available_height: number;
    screen_color_depth: number;
    scroll_x: number;
    scroll_y: number;
    country?: string;
    region?: string;
    city?: string;
    begin_time: number;
    [propName: string]: unknown;
}
declare const browserUtils: {
    getBrowser: () => {
        name: string;
        version: string;
        platform: string;
    };
    getDeviceType: () => "mobile" | "tablet" | "desktop" | "unknown";
    getNetworkState: () => {
        type: "online" | "offline";
        effectiveType: "2g" | "3g" | "4g" | "5g" | "unknown";
        rtt: number;
        downlink: number;
    };
};
declare function getBrowserData(): BrowserData;
declare const browserPlugin: IPlugin;

/**
 * 会话管理插件
 * 负责会话的创建、维护、超时处理和会话数据的收集
 */

/**
 * 会话管理器类
 */
declare class Sessions {
    /**
     * 会话状态
     */
    private session;
    /**
     * 超时定时器ID
     */
    private timeoutId;
    /**
     * 内存缓存
     */
    private storageCache;
    /**
     * 上次存储同步时间
     */
    private lastStorageSync;
    /**
     * 存储同步间隔（毫秒）
     */
    private syncInterval;
    /**
     * 初始化会话
     */
    start(): void;
    /**
     * 更新会话最后活动时间
     */
    updateLastActive(): void;
    /**
     * 获取会话ID
     * @returns {string | null} 会话ID
     */
    getID(): string | null;
    /**
     * 获取会话开始时间
     * @returns {number | null} 会话开始时间
     */
    getStartTime(): number | null;
    /**
     * 获取会话持续时间
     * @returns {number} 会话持续时间
     */
    getDuration(): number;
    /**
     * 检查是否为新会话
     * @returns {boolean} 是否为新会话
     */
    isNew(): boolean;
    /**
     * 清理定时器
     */
    clearTimeout(): void;
    /**
     * 增加页面浏览次数
     */
    incrementPageViews(): void;
    /**
     * 增加事件次数
     */
    incrementEvents(): void;
    /**
     * 获取会话统计信息
     * @returns {Object} 会话统计信息
     */
    getStats(): {
        pageViews: number;
        events: number;
        duration: number;
    };
    /**
     * 获取会话上下文
     * @returns {EventProperties} 会话上下文
     */
    getContext(): EventProperties;
    /**
     * 结束会话
     */
    stop(): void;
    /**
     * 开始会话超时定时器
     */
    private startSessionTimeout;
    /**
     * 重置会话超时定时器
     */
    private resetSessionTimeout;
    /**
     * 同步存储缓存
     */
    private syncStorage;
    /**
     * 获取或创建会话
     * @returns {SessionState} 会话状态
     */
    private getOrCreateSession;
    /**
     * 生成会话ID
     * @returns {string} 会话ID
     */
    private generateSessionId;
}
/**
 * 会话管理器实例
 */
declare const sessions: Sessions;
/**
 * 会话插件
 */
declare const sessionPlugin: IPlugin;

/**
 * 行为管理插件
 * 负责跟踪用户行为、页面浏览和行为分析
 */

/**
 * 行为步骤接口
 */
interface BehaviorStep {
    /**
     * 事件名称
     */
    event: string;
    /**
     * 时间戳
     */
    timestamp: number;
    /**
     * 事件属性
     */
    properties: EventProperties;
    /**
     * 路径
     */
    path: string;
    /**
     * 来源
     */
    referrer: string;
}
/**
 * 行为管理器
 * 负责跟踪和管理用户行为
 */
declare class Behaviors {
    /**
     * 行为路径
     * @private
     */
    private behaviorPath;
    /**
     * 保存定时器ID
     * @private
     */
    private saveTimeoutId;
    /**
     * 最后保存时间
     * @private
     */
    private lastSaveTime;
    /**
     * 保存间隔（毫秒）
     * @private
     */
    private saveInterval;
    /**
     * 初始化行为管理器
     */
    init(): void;
    /**
     * 加载行为路径
     * @private
     * @returns {BehaviorStep[]} 行为路径
     */
    private loadBehaviorPath;
    /**
     * 保存行为路径
     * @private
     */
    private saveBehaviorPath;
    /**
     * 实际保存行为路径到存储
     * @private
     */
    private saveBehaviorPathToStorage;
    /**
     * 记录行为
     * @param {string} event - 事件名称
     * @param {EventProperties} [properties={}] - 事件属性
     */
    track(event: string, properties?: EventProperties): void;
    /**
     * 记录页面浏览
     * @param {EventProperties} [properties={}] - 页面属性
     */
    trackView(properties?: EventProperties): void;
    /**
     * 获取行为路径
     * @returns {BehaviorStep[]} 行为路径
     */
    getPath(): BehaviorStep[];
    /**
     * 获取最近的行为
     * @param {number} [limit=10] - 限制数量
     * @returns {BehaviorStep[]} 最近的行为
     */
    getRecent(limit?: number): BehaviorStep[];
    /**
     * 获取行为路径统计
     * @returns {Object} 行为统计信息
     * @returns {number} totalSteps - 总步骤数
     * @returns {number} uniqueEvents - 唯一事件数
     * @returns {number} averageTimeBetweenSteps - 步骤间平均时间
     */
    getStats(): {
        totalSteps: number;
        uniqueEvents: number;
        averageTimeBetweenSteps: number;
    };
    /**
     * 获取行为路径上下文
     * @returns {EventProperties} 行为上下文
     */
    getContext(): EventProperties;
    /**
     * 清空行为路径
     */
    clear(): void;
    /**
     * 清除定时器
     */
    clearTimeouts(): void;
    /**
     * 分析行为路径
     * @returns {Object} 行为分析结果
     * @returns {Array} mostFrequentEvents - 最频繁的事件
     * @returns {Array} commonPaths - 常见路径
     * @returns {number} averageSessionDuration - 平均会话持续时间
     */
    analyze(): {
        mostFrequentEvents: Array<{
            event: string;
            count: number;
        }>;
        commonPaths: Array<{
            path: string;
            count: number;
        }>;
        averageSessionDuration: number;
    };
    /**
     * 提取会话
     * @private
     * @returns {Array} 会话列表
     */
    private extractSessions;
}
/**
 * 行为管理器实例
 */
declare const behaviors: Behaviors;
/**
 * 行为插件
 */
declare const behaviorPlugin: IPlugin;

/**
 * 错误插件
 * 负责监听和捕获JavaScript错误和未处理的Promise拒绝
 */

/**
 * 错误插件
 */
declare const errorPlugin: IPlugin;

/**
 * 性能插件
 * 负责收集和发送页面性能数据，包括加载时间、首字节时间、DOM解析时间等
 */

/**
 * 性能插件
 */
declare const performancePlugin: IPlugin;

/**
 * 页面浏览插件
 * 负责监控和跟踪页面浏览事件，包括初始加载和路由变化
 */

/**
 * 页面浏览插件
 */
declare const pageviewPlugin: IPlugin;

/**
 * 网络插件
 * 负责监控和跟踪网络请求，包括XMLHttpRequest和fetch请求
 */

/**
 * 网络插件
 */
declare const networkPlugin: IPlugin;

/**
 * 错误类型定义
 */
/**
 * 错误类型
 */
type ErrorType = "network" | "network:timeout" | "network:offline" | "network:server" | "network:client" | "storage" | "storage:quota" | "storage:access" | "browser" | "plugin" | "plugin:init" | "plugin:execute" | "queue" | "queue:full" | "queue:overflow" | "device" | "session" | "session:timeout" | "behavior" | "data" | "data:validation" | "data:serialization" | "config" | "init" | "runtime" | "unknown";
/**
 * 错误级别
 */
type ErrorLevel = "debug" | "info" | "warn" | "error" | "fatal";
/**
 * 错误接口
 */
interface TraceError {
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
interface ErrorHandlerConfig {
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
interface ErrorStats {
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
interface ErrorSummary {
    total: number;
    lastError: TraceError | null;
    mostFrequentType: ErrorType | null;
    mostFrequentLevel: ErrorLevel | null;
    rate: {
        lastMinute: number;
        lastHour: number;
    };
}

/**
 * 错误处理类
 * 负责捕获、记录和处理错误
 */
declare class ErrorHandler {
    /**
     * 配置
     * @private
     */
    private config;
    /**
     * 错误队列
     * @private
     */
    private errors;
    /**
     * 错误统计
     * @private
     */
    private stats;
    /**
     * 错误时间戳列表
     * @private
     */
    private errorTimestamps;
    /**
     * 构造函数
     * @param {Partial<ErrorHandlerConfig>} [config] - 配置选项
     */
    constructor(config?: Partial<ErrorHandlerConfig>);
    /**
     * 初始化错误统计
     * @private
     */
    private initStats;
    /**
     * 生成错误ID
     * @private
     * @returns {string} 错误ID
     */
    private generateErrorId;
    /**
     * 解析错误堆栈
     * @private
     * @param {string} stack - 错误堆栈
     * @returns {Object} 解析结果
     */
    private parseStack;
    /**
     * 更新错误统计
     * @private
     * @param {TraceError} error - 错误对象
     */
    private updateStats;
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
    captureError(type: ErrorType, message: string, error?: unknown, context?: Record<string, unknown>, level?: ErrorLevel, code?: string, source?: string): TraceError;
    /**
     * 检查错误率
     * @private
     * @param {TraceError} error - 错误对象
     */
    private checkErrorRate;
    /**
     * 记录错误日志
     * @private
     * @param {TraceError} error - 错误对象
     */
    private logError;
    /**
     * 获取错误统计
     * @returns {ErrorStats} 错误统计信息
     */
    getStats(): ErrorStats;
    /**
     * 获取最近的错误
     * @param {number} [count=10] - 错误数量
     * @returns {TraceError[]} 最近的错误列表
     */
    getRecentErrors(count?: number): TraceError[];
    /**
     * 检查是否有错误
     * @returns {boolean} 是否有错误
     */
    hasErrors(): boolean;
    /**
     * 获取错误摘要
     * @returns {ErrorSummary} 错误摘要
     */
    getErrorSummary(): {
        total: number;
        lastError: TraceError | null;
        mostFrequentType: ErrorType | null;
        mostFrequentLevel: ErrorLevel | null;
        rate: {
            lastMinute: number;
            lastHour: number;
        };
    };
    /**
     * 检查是否应该记录该级别的错误
     * @private
     * @param {ErrorLevel} level - 错误级别
     * @returns {boolean} 是否应该记录
     */
    private shouldLog;
    /**
     * 获取错误队列
     * @returns {TraceError[]} 错误队列
     */
    getErrors(): TraceError[];
    /**
     * 清空错误队列
     */
    clearErrors(): void;
    /**
     * 处理网络错误
     * @param {unknown} error - 错误对象
     * @param {Record<string, unknown>} [context] - 错误上下文
     */
    handleNetworkError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * 处理存储错误
     * @param {unknown} error - 错误对象
     * @param {Record<string, unknown>} [context] - 错误上下文
     */
    handleStorageError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * 处理浏览器 API 错误
     * @param {unknown} error - 错误对象
     * @param {Record<string, unknown>} [context] - 错误上下文
     */
    handleBrowserError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * 处理插件错误
     * @param {unknown} error - 错误对象
     * @param {Record<string, unknown>} [context] - 错误上下文
     */
    handlePluginError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * 处理队列错误
     * @param {unknown} error - 错误对象
     * @param {Record<string, unknown>} [context] - 错误上下文
     */
    handleQueueError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * 处理设备 ID 错误
     * @param {unknown} error - 错误对象
     * @param {Record<string, unknown>} [context] - 错误上下文
     */
    handleDeviceError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * 处理会话错误
     * @param {unknown} error - 错误对象
     * @param {Record<string, unknown>} [context] - 错误上下文
     */
    handleSessionError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * 处理行为错误
     * @param {unknown} error - 错误对象
     * @param {Record<string, unknown>} [context] - 错误上下文
     */
    handleBehaviorError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * 处理数据错误
     * @param {unknown} error - 错误对象
     * @param {Record<string, unknown>} [context] - 错误上下文
     */
    handleDataError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * 处理未知错误
     * @param {unknown} error - 错误对象
     * @param {Record<string, unknown>} [context] - 错误上下文
     */
    handleUnknownError(error: unknown, context?: Record<string, unknown>): void;
}

/**
 * 错误统计模块
 */

/**
 * 初始化错误统计
 * @returns {ErrorStats} 初始化后的错误统计对象
 */
declare function initializeStats(): ErrorStats;
/**
 * 计算错误率
 * @param {number[]} timestamps - 错误时间戳列表
 * @returns {Object} 错误率对象
 */
declare function calculateErrorRate(timestamps: number[]): {
    lastMinute: number;
    lastHour: number;
};
/**
 * 生成错误摘要
 * @param {TraceError[]} errors - 错误列表
 * @param {ErrorStats} stats - 错误统计
 * @returns {ErrorSummary} 错误摘要
 */
declare function generateErrorSummary(errors: TraceError[], stats: ErrorStats): ErrorSummary;
/**
 * 清理过期的时间戳
 * @param {number[]} timestamps - 时间戳列表
 * @param {number} threshold - 阈值时间戳
 * @returns {number[]} 清理后的时间戳列表
 */
declare function cleanupTimestamps(timestamps: number[], threshold: number): number[];

/**
 * 错误处理器实例
 */
declare const errorHandler: ErrorHandler;
/**
 * 记录错误
 * @param {import('./types').ErrorType} type - 错误类型
 * @param {string} message - 错误消息
 * @param {unknown} [error] - 原始错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 * @param {import('./types').ErrorLevel} [level=error] - 错误级别
 */
declare function captureError(type: ErrorType, message: string, error?: unknown, context?: Record<string, unknown>, level?: ErrorLevel): void;
/**
 * 处理网络错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
declare function handleNetworkError(error: unknown, context?: Record<string, unknown>): void;
/**
 * 处理存储错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
declare function handleStorageError(error: unknown, context?: Record<string, unknown>): void;
/**
 * 处理浏览器 API 错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
declare function handleBrowserError(error: unknown, context?: Record<string, unknown>): void;
/**
 * 处理插件错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
declare function handlePluginError(error: unknown, context?: Record<string, unknown>): void;
/**
 * 处理队列错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
declare function handleQueueError(error: unknown, context?: Record<string, unknown>): void;
/**
 * 处理设备 ID 错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
declare function handleDeviceError(error: unknown, context?: Record<string, unknown>): void;
/**
 * 处理会话错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
declare function handleSessionError(error: unknown, context?: Record<string, unknown>): void;
/**
 * 处理行为错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
declare function handleBehaviorError(error: unknown, context?: Record<string, unknown>): void;
/**
 * 处理数据错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
declare function handleDataError(error: unknown, context?: Record<string, unknown>): void;
/**
 * 处理未知错误
 * @param {unknown} error - 错误对象
 * @param {Record<string, unknown>} [context] - 错误上下文
 */
declare function handleUnknownError(error: unknown, context?: Record<string, unknown>): void;

export { type BrowserData, ErrorHandler, type ErrorHandlerConfig, type ErrorLevel, type ErrorStats, type ErrorSummary, type ErrorType, type EventProperties, type IPlugin, type Options, type Payload, type TraceError, behaviorPlugin, behaviors, browserPlugin, browserUtils, calculateErrorRate, captureError, cleanupTimestamps, clearID, clearTimers, errorHandler, errorPlugin, flush, generateErrorSummary, generateStableDeviceIdAsync, getBrowserData, getDeviceId, getID, handleBehaviorError, handleBrowserError, handleDataError, handleDeviceError, handleNetworkError, handlePluginError, handleQueueError, handleSessionError, handleStorageError, handleUnknownError, init, initializeStats, networkPlugin, pageviewPlugin, performancePlugin, plugins, sessionPlugin, sessions, setID, storageUtils, track, use, userPlugin };
