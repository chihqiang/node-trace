/**
 * Core module
 * Contains core functions like initialization, event tracking, and plugin management
 */

import { push, startOfflineCheckTimer } from './queue'
import { queueManager } from './queue/manager'
import { now, stringUtils } from './utils'
import { handlePluginError } from './error'
import type { Options, Payload, IPlugin, IPluginContext, EventProperties } from './types'

/**
 * Default configuration constants
 */
export const DEFAULT_OPTIONS = {
  /**
   * Default app key
   */
  appKey: '',
  /**
   * Default debug mode
   */
  debug: false,
  /**
   * Default sample rate
   */
  sampleRate: 1,
  /**
   * Default blacklist
   */
  blacklist: [],
  /**
   * Default whitelist
   */
  whitelist: undefined,
  /**
   * Default batch size
   */
  batchSize: 20,
  /**
   * Default batch interval (milliseconds)
   */
  batchInterval: 1000,
  /**
   * Default offline cache enabled state
   */
  offlineEnabled: false,
  /**
   * Default max queue size
   */
  maxQueueSize: 1000,
  /**
   * Default retry count
   */
  retryCount: 3,
  /**
   * Default retry interval (milliseconds)
   */
  retryInterval: 1000,
  /**
   * Default request headers
   */
  headers: {},
  /**
   * Default timeout (milliseconds)
   */
  timeout: 30000,
  /**
   * Default before send callback
   */
  beforeSend: undefined,
}

/**
 * Global state management
 */
export const state = {
  /**
   * Configuration options
   * @type {Options | null}
   */
  options: null as Options | null,
  /**
   * Event queue
   * @type {Payload<EventProperties>[]}
   */
  queue: [] as Payload<EventProperties>[],
  /**
   * Plugin list
   * @type {IPlugin[]}
   */
  plugins: [] as IPlugin[],
  /**
   * Sorted plugins cache
   * @type {IPlugin[] | null}
   */
  sortedPluginsCache: null as IPlugin[] | null
}

/**
 * Plugin manager
 * Responsible for plugin registration, initialization, and destruction
 */
class Plugins {
  /**
   * Plugin map
   * @private
   * @type {Map<string, IPlugin>}
   */
  private plugins: Map<string, IPlugin> = new Map()

  /**
   * Create plugin context
   * @returns Plugin context
   */
  private createPluginContext(): IPluginContext {
    return {
      getPlugins: () => Object.fromEntries(this.plugins) as unknown as Record<string, IPlugin>,
      getPlugin: (name: string) => this.plugins.get(name) || null,
      getAllPlugins: () => this.getAll(),
      callPluginMethod: (pluginName: string, methodName: string, ...args: unknown[]) => {
        const plugin = this.plugins.get(pluginName)
        if (plugin && typeof (plugin as unknown as Record<string, unknown>)[methodName] === 'function') {
          const method = (plugin as unknown as Record<string, unknown>)[methodName] as (...args: unknown[]) => unknown
          return method(...args)
        }
        return null
      }
    }
  }

  /**
   * Register plugin
   * @param plugin - Plugin instance
   * @returns Whether registration was successful
   */
  register(plugin: IPlugin): boolean {
    try {
      // Check if plugin name already exists
      if (this.plugins.has(plugin.name)) {
        console.warn(`[Node-Trace] Plugin ${plugin.name} already registered`)
        return false
      }

      // Check plugin dependencies
      if (plugin.dependencies && plugin.dependencies.length > 0) {
        for (const dep of plugin.dependencies) {
          if (!this.plugins.has(dep)) {
            console.warn(`[Node-Trace] Plugin ${plugin.name} depends on ${dep}, which is not registered`)
            return false
          }
        }
      }

      // Check plugin conflicts
      if (plugin.conflicts && plugin.conflicts.length > 0) {
        for (const conflict of plugin.conflicts) {
          if (this.plugins.has(conflict)) {
            console.warn(`[Node-Trace] Plugin ${plugin.name} conflicts with ${conflict}`)
            return false
          }
        }
      }

      // Initialize plugin state
      plugin.lifecycle = 'idle'
      plugin.enabled = true
      plugin.priority = plugin.priority || 0

      // Register plugin
      this.plugins.set(plugin.name, plugin)
      
      // Clear plugin sort cache
      state.sortedPluginsCache = null
      
      return true
    } catch (error) {
      handlePluginError(error, { plugin: plugin.name })
      return false
    }
  }

  /**
   * Initialize plugin
   * @param plugin - Plugin instance
   * @returns Whether initialization was successful
   */
  init(plugin: IPlugin): boolean {
    try {
      // Update plugin lifecycle
      plugin.lifecycle = 'loading'

      const context = this.createPluginContext()

      // Call plugin's beforeInit method
      if (plugin.beforeInit) {
        plugin.beforeInit(context)
      }

      // Call plugin's setup method
      if (plugin.setup) {
        plugin.setup(context)
      }

      // Call plugin's init method
      if (plugin.init) {
        plugin.init(context)
      }

      // Call plugin's activate method
      if (plugin.activate) {
        plugin.activate(context)
      }

      // Call plugin's afterInit method
      if (plugin.afterInit) {
        plugin.afterInit(context)
      }

      // Update plugin lifecycle
      plugin.lifecycle = 'active'
      return true
    } catch (error) {
      handlePluginError(error, { plugin: plugin.name })
      plugin.lifecycle = 'error'
      return false
    }
  }

  /**
   * Destroy plugin
   * @param plugin - Plugin instance
   * @returns Whether destruction was successful
   */
  destroy(plugin: IPlugin): boolean {
    try {
      const context = this.createPluginContext()

      // Call plugin's beforeDestroy method
      if (plugin.beforeDestroy) {
        plugin.beforeDestroy(context)
      }

      // Call plugin's deactivate method
      if (plugin.deactivate) {
        plugin.deactivate(context)
      }

      // Call plugin's destroy method
      if (plugin.destroy) {
        plugin.destroy(context)
      }

      // Call plugin's afterDestroy method
      if (plugin.afterDestroy) {
        plugin.afterDestroy(context)
      }

      // Update plugin lifecycle
      plugin.lifecycle = 'destroyed'
      return true
    } catch (error) {
      handlePluginError(error, { plugin: plugin.name })
      return false
    }
  }

  /**
   * Get plugin
   * @param name - Plugin name
   * @returns Plugin instance
   */
  get(name: string): IPlugin | undefined {
    return this.plugins.get(name)
  }

  /**
   * Get all plugins
   * @returns Plugin list
   */
  getAll(): IPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Get enabled plugins
   * @returns Enabled plugin list
   */
  getEnabled(): IPlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.enabled)
  }

  /**
   * Enable plugin
   * @param name - Plugin name
   * @returns Whether enabling was successful
   */
  enable(name: string): boolean {
    const plugin = this.plugins.get(name)
    if (!plugin) return false

    plugin.enabled = true
    
    // Clear plugin sort cache
    state.sortedPluginsCache = null
    
    return true
  }

  /**
   * Disable plugin
   * @param name - Plugin name
   * @returns Whether disabling was successful
   */
  disable(name: string): boolean {
    const plugin = this.plugins.get(name)
    if (!plugin) return false

    plugin.enabled = false
    
    // Clear plugin sort cache
    state.sortedPluginsCache = null
    
    return true
  }

  /**
   * Remove plugin
   * @param name - Plugin name
   * @returns Whether removal was successful
   */
  remove(name: string): boolean {
    const plugin = this.plugins.get(name)
    if (!plugin) return false

    // Destroy plugin
    this.destroy(plugin)

    // Remove from plugin list
    const result = this.plugins.delete(name)
    
    // Clear plugin sort cache
    state.sortedPluginsCache = null
    
    return result
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    for (const plugin of this.plugins.values()) {
      this.destroy(plugin)
    }
    this.plugins.clear()
    
    // Clear plugin sort cache
    state.sortedPluginsCache = null
  }

  /**
   * Sort plugins by priority
   * @returns Sorted plugin list
   */
  sort(): IPlugin[] {
    return Array.from(this.plugins.values())
      .filter(plugin => plugin.enabled)
      .sort((a, b) => (a.priority || 0) - (b.priority || 0))
  }
}

/**
 * Plugin manager instance
 * @type {PluginManager}
 */
export const plugins = new Plugins()

/**
 * Initialize configuration
 * @param options - Configuration options
 */
export function init(options: Options) {
  state.options = {
    ...DEFAULT_OPTIONS,
    ...options
  }

  // Initialize queue manager
  queueManager.init({
    maxQueueSize: options.maxQueueSize || 1000,
    batchSize: options.batchSize || 20,
    batchInterval: options.batchInterval || 1000,
    retryCount: options.retryCount || 3,
    retryInterval: options.retryInterval || 1000,
    offlineEnabled: options.offlineEnabled || false,
    debug: options.debug || false,
    endpoint: options.endpoint,
    appId: options.appId,
    appKey: options.appKey,
    headers: options.headers,
    timeout: options.timeout,
  })

  // Start offline event check timer
  startOfflineCheckTimer()
}

/**
 * Use plugin
 * @param plugin - Plugin instance
 */
export function use(plugin: IPlugin) {
  // Register plugin
  const registered = plugins.register(plugin)
  if (!registered) {
    console.warn(`[Node-Trace] Failed to register plugin ${plugin.name}`)
    return
  }

  // Initialize plugin
  plugins.init(plugin)

  // Add to state plugin list
  state.plugins.push(plugin)
}

/**
 * Check if event should be sent
 * @param event - Event name
 * @returns Whether event should be sent
 */
function shouldSend(event: string) {
  const opt = state.options
  if (!opt) return true

  if (opt.sampleRate && Math.random() > opt.sampleRate) return false
  if (opt.blacklist?.includes(event)) return false
  if (opt.whitelist && !opt.whitelist.includes(event)) return false

  return true
}

/**
 * Track event
 * @template T
 * @param event - Event name
 * @param [properties] - Event properties
 */
export function track<T extends EventProperties>(event: string, properties?: T) {
  if (!shouldSend(event)) return

  const eventId = stringUtils.generateEventId()
  let payload: Payload<T> = { id: eventId, event, properties, timestamp: now() }

  let allPlugins = state.sortedPluginsCache
  if (!allPlugins) {
    allPlugins = plugins.sort()  
    state.sortedPluginsCache = allPlugins
  }

  const pluginsToNotify: IPlugin[] = []

  for (const p of allPlugins) { 
    if (p.onTrack) {
      try {
        const r = p.onTrack(payload)
        if (r === null) return
        payload = r
      } catch (error) {
        handlePluginError(error, { plugin: p.name, event: event })
      }
    }
    if (p.onTracked) {
      pluginsToNotify.push(p)
    }
  }

  const final = state.options?.beforeSend?.(payload)
  if (final === null) return

  const eventToPush = final || payload
  push(eventToPush)

  for (const p of pluginsToNotify) {
    try {
      p.onTracked?.(eventToPush)
    } catch (error) {
      handlePluginError(error, { plugin: p.name, event: event })
    }
  }
}
