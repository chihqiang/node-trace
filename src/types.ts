/**
 * 类型定义模块
 * 包含项目中使用的各种类型和接口定义
 */

/**
 * 事件属性类型
 * 键值对形式，值可以是字符串、数字、布尔值、null或undefined
 */
export type EventProperties = Record<string, string | number | boolean | null | undefined>

/**
 * 泛型事件负载接口
 * @template T - 事件属性类型
 */
export interface Payload<T extends EventProperties = EventProperties> {
  /**
   * 事件ID
   */
  id: string
  /**
   * 事件名称
   */
  event: string
  /**
   * 事件属性
   */
  properties?: T
  /**
   * 事件时间戳
   */
  timestamp: number
  /**
   * 扩展参数
   */
  [key: string]: any
}

/**
 * 配置选项接口
 */
export interface Options {
  /**
   * 应用ID
   */
  appId: string
  /**
   * 应用密钥
   */
  appKey?: string
  /**
   * 事件发送端点
   */
  endpoint: string
  /**
   * 是否开启调试模式
   */
  debug?: boolean

  /**
   * 事件采样率（0-1）
   */
  sampleRate?: number
  /**
   * 事件黑名单
   */
  blacklist?: string[]
  /**
   * 事件白名单
   */
  whitelist?: string[]

  /**
   * 批量发送大小
   */
  batchSize?: number
  /**
   * 批量发送间隔（毫秒）
   */
  batchInterval?: number

  /**
   * 是否启用离线缓存
   */
  offlineEnabled?: boolean
  /**
   * 最大队列大小
   */
  maxQueueSize?: number

  /**
   * 重试次数
   */
  retryCount?: number
  /**
   * 重试间隔（毫秒）
   */
  retryInterval?: number

  /**
   * 请求头
   */
  headers?: Record<string, string>
  /**
   * 超时时间（毫秒）
   */
  timeout?: number

  /**
   * 发送前回调函数
   */
  beforeSend?: <T extends EventProperties>(event: Payload<T>) => Payload<T> | null
}

/**
 * 插件生命周期阶段
 */
export type PluginLifecycle = 'idle' | 'loading' | 'active' | 'error' | 'destroyed'

/**
 * 插件上下文接口
 */
export interface IPluginContext {
  /**
   * 获取插件管理器实例
   */
  getPlugins(): any
  
  /**
   * 获取指定插件实例
   * @param {string} name - 插件名称
   * @returns {IPlugin | null} 插件实例
   */
  getPlugin(name: string): IPlugin | null
  
  /**
   * 获取所有已注册的插件
   * @returns {IPlugin[]} 插件列表
   */
  getAllPlugins(): IPlugin[]
  
  /**
   * 调用插件方法
   * @param {string} pluginName - 插件名称
   * @param {string} methodName - 方法名称
   * @param {any[]} args - 方法参数
   * @returns {any} 方法返回值
   */
  callPluginMethod(pluginName: string, methodName: string, ...args: any[]): any
}

/**
 * 插件接口
 */
export interface IPlugin {
  /**
   * 插件名称
   */
  name: string
  /**
   * 插件版本
   */
  version?: string
  /**
   * 插件描述
   */
  description?: string
  
  /**
   * 插件设置方法
   */
  setup?(context: IPluginContext): void
  /**
   * 插件初始化方法
   */
  init?(context: IPluginContext): void
  /**
   * 插件激活方法
   */
  activate?(context: IPluginContext): void
  /**
   * 插件停用方法
   */
  deactivate?(context: IPluginContext): void
  /**
   * 插件销毁方法
   */
  destroy?(context: IPluginContext): void
  
  /**
   * 插件依赖
   */
  dependencies?: string[]
  /**
   * 插件冲突
   */
  conflicts?: string[]
  
  /**
   * 插件优先级（数字越小，优先级越高）
   */
  priority?: number
  
  /**
   * 插件是否启用
   */
  enabled?: boolean
  /**
   * 插件生命周期状态
   */
  lifecycle?: PluginLifecycle
  
  /**
   * 事件跟踪前回调
   */
  onTrack?: <T extends EventProperties>(event: Payload<T>) => Payload<T> | null
  /**
   * 事件跟踪后回调
   */
  onTracked?: <T extends EventProperties>(event: Payload<T>) => void
  /**
   * 发送前回调
   */
  beforeSend?: <T extends EventProperties>(events: Payload<T>[]) => Payload<T>[]
  /**
   * 发送后回调
   */
  afterSend?: <T extends EventProperties>(events: Payload<T>[], success: boolean) => void
  /**
   * 初始化前回调
   */
  beforeInit?(context: IPluginContext): void
  /**
   * 初始化后回调
   */
  afterInit?(context: IPluginContext): void
  /**
   * 销毁前回调
   */
  beforeDestroy?(context: IPluginContext): void
  /**
   * 销毁后回调
   */
  afterDestroy?(context: IPluginContext): void
  
  /**
   * 插件配置
   */
  config?: Record<string, any>
  
  /**
   * 插件状态
   */
  state?: Record<string, any>
  
  /**
   * 获取插件信息
   */
  getInfo?: () => Record<string, any>
}
