/**
 * Type definitions module
 * Contains various type and interface definitions used in the project
 */

/**
 * Event properties type
 * Key-value pairs, values can be strings, numbers, booleans, null, or undefined
 */
export type EventProperties = Record<string, string | number | boolean | null | undefined>

/**
 * Extended event properties type
 * Allows plugins to add additional fields
 */
export type ExtendedEventProperties = {
  device_id?: string
  user_id?: string
  session_id?: string
  browser?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Generic event payload interface
 * @template T - Event properties type
 */
export interface Payload<T extends EventProperties = EventProperties> {
  /**
   * Event ID
   */
  id: string
  /**
   * Event name
   */
  event: string
  /**
   * Event properties
   */
  properties?: T
  /**
   * Event timestamp
   */
  timestamp: number
  /**
   * Extended parameters
   */
  [key: string]: unknown
}

/**
 * Configuration options interface
 */
export interface Options {
  /**
   * Application ID
   */
  appId: string
  /**
   * Application key
   */
  appKey?: string
  /**
   * Event sending endpoint
   */
  endpoint: string
  /**
   * Whether to enable debug mode
   */
  debug?: boolean

  /**
   * Event sampling rate (0-1)
   */
  sampleRate?: number
  /**
   * Event blacklist
   */
  blacklist?: string[]
  /**
   * Event whitelist
   */
  whitelist?: string[]

  /**
   * Batch send size
   */
  batchSize?: number
  /**
   * Batch send interval (milliseconds)
   */
  batchInterval?: number

  /**
   * Whether to enable offline cache
   */
  offlineEnabled?: boolean
  /**
   * Maximum queue size
   */
  maxQueueSize?: number

  /**
   * Retry count
   */
  retryCount?: number
  /**
   * Retry interval (milliseconds)
   */
  retryInterval?: number

  /**
   * Request headers
   */
  headers?: Record<string, string>
  /**
   * Timeout (milliseconds)
   */
  timeout?: number

  /**
   * Before send callback function
   */
  beforeSend?: <T extends EventProperties>(event: Payload<T>) => Payload<T> | null
}

/**
 * Plugin lifecycle stage
 */
export type PluginLifecycle = 'idle' | 'loading' | 'active' | 'error' | 'destroyed'

/**
 * Plugin context interface
 */
export interface IPluginContext {
  /**
   * Get plugin manager instance
   */
  getPlugins(): Record<string, IPlugin>
  
  /**
   * Get specified plugin instance
   * @param name - Plugin name
   * @returns Plugin instance
   */
  getPlugin(name: string): IPlugin | null
  
  /**
   * Get all registered plugins
   * @returns Plugin list
   */
  getAllPlugins(): IPlugin[]
  
  /**
   * Call plugin method
   * @param pluginName - Plugin name
   * @param methodName - Method name
   * @param args - Method arguments
   * @returns Method return value
   */
  callPluginMethod(pluginName: string, methodName: string, ...args: unknown[]): unknown
}

/**
 * Plugin interface
 */
export interface IPlugin {
  /**
   * Plugin name
   */
  name: string
  /**
   * Plugin version
   */
  version?: string
  /**
   * Plugin description
   */
  description?: string
  
  /**
   * Plugin setup method
   */
  setup?(context: IPluginContext): void
  /**
   * Plugin initialization method
   */
  init?(context: IPluginContext): void
  /**
   * Plugin activation method
   */
  activate?(context: IPluginContext): void
  /**
   * Plugin deactivation method
   */
  deactivate?(context: IPluginContext): void
  /**
   * Plugin destruction method
   */
  destroy?(context: IPluginContext): void
  
  /**
   * Plugin dependencies
   */
  dependencies?: string[]
  /**
   * Plugin conflicts
   */
  conflicts?: string[]
  
  /**
   * Plugin priority (lower number means higher priority)
   */
  priority?: number
  
  /**
   * Whether the plugin is enabled
   */
  enabled?: boolean
  /**
   * Plugin lifecycle status
   */
  lifecycle?: PluginLifecycle
  
  /**
   * Before event tracking callback
   */
  onTrack?: <T extends EventProperties>(event: Payload<T>) => Payload<T> | null
  /**
   * After event tracking callback
   */
  onTracked?: <T extends EventProperties>(event: Payload<T>) => void
  /**
   * Before send callback
   */
  beforeSend?: <T extends EventProperties>(events: Payload<T>[]) => Payload<T>[]
  /**
   * After send callback
   */
  afterSend?: <T extends EventProperties>(events: Payload<T>[], success: boolean) => void
  /**
   * Before initialization callback
   */
  beforeInit?(context: IPluginContext): void
  /**
   * After initialization callback
   */
  afterInit?(context: IPluginContext): void
  /**
   * Before destruction callback
   */
  beforeDestroy?(context: IPluginContext): void
  /**
   * After destruction callback
   */
  afterDestroy?(context: IPluginContext): void
  
  /**
   * Plugin configuration
   */
  config?: Record<string, unknown>
  
  /**
   * Plugin state
   */
  state?: Record<string, unknown>
  
  /**
   * Get plugin information
   */
  getInfo?: () => Record<string, unknown>
}
