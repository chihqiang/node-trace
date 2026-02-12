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
 * @returns {Promise<string>} 设备ID
 */
declare function generateStableDeviceIdAsync(): Promise<string>;
/**
 * 获取设备ID
 * @returns {string} 设备ID
 */
declare function getDeviceId(): string;
/**
 * 设置用户ID
 * @param {string} id - 用户ID
 */
declare function setID(id: string): void;
/**
 * 获取用户ID
 * @returns {string} 用户ID
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

/**
 * 浏览器信息插件
 * 负责获取浏览器数据、设备信息和存储操作
 */

/**
 * 浏览器数据接口
 */
interface BrowserData {
    /**
     * 设备ID
     */
    device_id: string;
    /**
     * 事件名称
     */
    event: string;
    /**
     * 用户代理字符串
     */
    user_agent: string;
    /**
     * 设备宽度
     */
    device_width: number;
    /**
     * 设备高度
     */
    device_height: number;
    /**
     * 是否在线
     */
    is_online: boolean;
    /**
     * 连接类型
     */
    connection_type?: string;
    /**
     * 下行速度
     */
    downlink?: number;
    /**
     * 有效连接类型
     */
    effective_type?: string;
    /**
     * 往返时间
     */
    rtt?: number;
    /**
     * 应用代码名称
     */
    app_code_name: string;
    /**
     * 应用名称
     */
    app_name: string;
    /**
     * 语言
     */
    language: string;
    /**
     * 平台
     */
    platform: string;
    /**
     * 时区
     */
    time_zone: string;
    /**
     * 浏览器版本
     */
    browser_version?: string;
    /**
     * 浏览器名称
     */
    browser_name?: string;
    /**
     * 浏览器主版本
     */
    browser_major_version?: string;
    /**
     * 引擎名称
     */
    engine_name?: string;
    /**
     * 引擎版本
     */
    engine_version?: string;
    /**
     * 设备像素比
     */
    device_pixel_ratio: number;
    /**
     * 是否为移动设备
     */
    is_mobile?: boolean;
    /**
     * 是否为平板设备
     */
    is_tablet?: boolean;
    /**
     * 是否为桌面设备
     */
    is_desktop?: boolean;
    /**
     * 当前URL
     */
    current_url: string;
    /**
     * 路径名
     */
    pathname: string;
    /**
     * 主机名
     */
    hostname: string;
    /**
     * 协议
     */
    protocol: string;
    /**
     * 端口
     */
    port?: string;
    /**
     * 搜索参数
     */
    search?: string;
    /**
     * 哈希
     */
    hash?: string;
    /**
     * 文档URL
     */
    document_url: string;
    /**
     * 来源URL
     */
    referrer_url: string;
    /**
     * 内容类型
     */
    content_type: string;
    /**
     * 文档标题
     */
    document_title: string;
    /**
     * 文档字符集
     */
    document_charset: string;
    /**
     * 文档就绪状态
     */
    document_ready_state?: string;
    /**
     * 屏幕宽度
     */
    screen_width: number;
    /**
     * 屏幕高度
     */
    screen_height: number;
    /**
     * 可用屏幕宽度
     */
    screen_available_width: number;
    /**
     * 可用屏幕高度
     */
    screen_available_height: number;
    /**
     * 屏幕颜色深度
     */
    screen_color_depth: number;
    /**
     * 滚动X坐标
     */
    scroll_x: number;
    /**
     * 滚动Y坐标
     */
    scroll_y: number;
    /**
     * 国家
     */
    country?: string;
    /**
     * 地区
     */
    region?: string;
    /**
     * 城市
     */
    city?: string;
    /**
     * 开始时间
     */
    begin_time: number;
    /**
     * 其他属性
     */
    [propName: string]: unknown;
}
/**
 * 浏览器工具函数
 */
declare const browserUtils: {
    /**
     * 检测浏览器类型
     * @returns {Object} 浏览器信息
     * @returns {string} name - 浏览器名称
     * @returns {string} version - 浏览器版本
     * @returns {string} platform - 平台
     */
    getBrowser: () => {
        name: string;
        version: string;
        platform: string;
    };
    /**
     * 检测设备类型
     * @returns {('mobile'|'tablet'|'desktop'|'unknown')} 设备类型
     */
    getDeviceType: () => "mobile" | "tablet" | "desktop" | "unknown";
    /**
     * 检测网络状态
     * @returns {Object} 网络状态
     * @returns {('online'|'offline')} type - 网络类型
     * @returns {('2g'|'3g'|'4g'|'5g'|'unknown')} effectiveType - 有效网络类型
     * @returns {number} rtt - 往返时间
     * @returns {number} downlink - 下行速度
     */
    getNetworkState: () => {
        type: "online" | "offline";
        effectiveType: "2g" | "3g" | "4g" | "5g" | "unknown";
        rtt: number;
        downlink: number;
    };
};
/**
 * 存储工具函数
 */
declare const storageUtils: {
    /**
     * 安全获取本地存储
     * @param {string} key - 存储键
     * @param {Function} [parser] - 解析函数
     * @returns {unknown} 存储值
     */
    get: (key: string, parser?: (value: string) => unknown) => unknown;
    /**
     * 安全设置本地存储
     * @param {string} key - 存储键
     * @param {unknown} value - 存储值
     * @returns {boolean} 是否设置成功
     */
    set: (key: string, value: unknown) => boolean;
    /**
     * 安全移除本地存储
     * @param {string} key - 存储键
     * @returns {boolean} 是否移除成功
     */
    remove: (key: string) => boolean;
    /**
     * 安全清空本地存储
     * @returns {boolean} 是否清空成功
     */
    clear: () => boolean;
};
/**
 * 获取浏览器数据
 * @returns {BrowserData} 浏览器数据
 */
declare function getBrowserData(): BrowserData;
/**
 * 浏览器插件
 */
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

export { type BrowserData, type EventProperties, type IPlugin, type Options, type Payload, behaviorPlugin, behaviors, browserPlugin, browserUtils, clearID, clearTimers, errorPlugin, flush, generateStableDeviceIdAsync, getBrowserData, getDeviceId, getID, init, networkPlugin, pageviewPlugin, performancePlugin, plugins, sessionPlugin, sessions, setID, storageUtils, track, use, userPlugin };
