/**
 * Type definitions module
 * Contains various type and interface definitions used in the project
 */
/**
 * Event properties type
 * Key-value pairs, values can be strings, numbers, booleans, null, or undefined
 */
type EventProperties = Record<string, string | number | boolean | null | undefined>;
/**
 * Generic event payload interface
 * @template T - Event properties type
 */
interface Payload<T extends EventProperties = EventProperties> {
    /**
     * Event ID
     */
    id: string;
    /**
     * Event name
     */
    event: string;
    /**
     * Event properties
     */
    properties?: T;
    /**
     * Event timestamp
     */
    timestamp: number;
    /**
     * Extended parameters
     */
    [key: string]: unknown;
}
/**
 * Configuration options interface
 */
interface Options {
    /**
     * Application ID
     */
    appId: string;
    /**
     * Application key
     */
    appKey?: string;
    /**
     * Event sending endpoint
     */
    endpoint: string;
    /**
     * Whether to enable debug mode
     */
    debug?: boolean;
    /**
     * Event sampling rate (0-1)
     */
    sampleRate?: number;
    /**
     * Event blacklist
     */
    blacklist?: string[];
    /**
     * Event whitelist
     */
    whitelist?: string[];
    /**
     * Batch send size
     */
    batchSize?: number;
    /**
     * Batch send interval (milliseconds)
     */
    batchInterval?: number;
    /**
     * Whether to enable offline cache
     */
    offlineEnabled?: boolean;
    /**
     * Maximum queue size
     */
    maxQueueSize?: number;
    /**
     * Retry count
     */
    retryCount?: number;
    /**
     * Retry interval (milliseconds)
     */
    retryInterval?: number;
    /**
     * Request headers
     */
    headers?: Record<string, string>;
    /**
     * Timeout (milliseconds)
     */
    timeout?: number;
    /**
     * Before send callback function
     */
    beforeSend?: <T extends EventProperties>(event: Payload<T>) => Payload<T> | null;
}
/**
 * Plugin lifecycle stage
 */
type PluginLifecycle = 'idle' | 'loading' | 'active' | 'error' | 'destroyed';
/**
 * Plugin context interface
 */
interface IPluginContext {
    /**
     * Get plugin manager instance
     */
    getPlugins(): Record<string, IPlugin>;
    /**
     * Get specified plugin instance
     * @param name - Plugin name
     * @returns Plugin instance
     */
    getPlugin(name: string): IPlugin | null;
    /**
     * Get all registered plugins
     * @returns Plugin list
     */
    getAllPlugins(): IPlugin[];
    /**
     * Call plugin method
     * @param pluginName - Plugin name
     * @param methodName - Method name
     * @param args - Method arguments
     * @returns Method return value
     */
    callPluginMethod(pluginName: string, methodName: string, ...args: unknown[]): unknown;
}
/**
 * Plugin interface
 */
interface IPlugin {
    /**
     * Plugin name
     */
    name: string;
    /**
     * Plugin version
     */
    version?: string;
    /**
     * Plugin description
     */
    description?: string;
    /**
     * Plugin setup method
     */
    setup?(context: IPluginContext): void;
    /**
     * Plugin initialization method
     */
    init?(context: IPluginContext): void;
    /**
     * Plugin activation method
     */
    activate?(context: IPluginContext): void;
    /**
     * Plugin deactivation method
     */
    deactivate?(context: IPluginContext): void;
    /**
     * Plugin destruction method
     */
    destroy?(context: IPluginContext): void;
    /**
     * Plugin dependencies
     */
    dependencies?: string[];
    /**
     * Plugin conflicts
     */
    conflicts?: string[];
    /**
     * Plugin priority (lower number means higher priority)
     */
    priority?: number;
    /**
     * Whether the plugin is enabled
     */
    enabled?: boolean;
    /**
     * Plugin lifecycle status
     */
    lifecycle?: PluginLifecycle;
    /**
     * Before event tracking callback
     */
    onTrack?: <T extends EventProperties>(event: Payload<T>) => Payload<T> | null;
    /**
     * After event tracking callback
     */
    onTracked?: <T extends EventProperties>(event: Payload<T>) => void;
    /**
     * Before send callback
     */
    beforeSend?: <T extends EventProperties>(events: Payload<T>[]) => Payload<T>[];
    /**
     * After send callback
     */
    afterSend?: <T extends EventProperties>(events: Payload<T>[], success: boolean) => void;
    /**
     * Before initialization callback
     */
    beforeInit?(context: IPluginContext): void;
    /**
     * After initialization callback
     */
    afterInit?(context: IPluginContext): void;
    /**
     * Before destruction callback
     */
    beforeDestroy?(context: IPluginContext): void;
    /**
     * After destruction callback
     */
    afterDestroy?(context: IPluginContext): void;
    /**
     * Plugin configuration
     */
    config?: Record<string, unknown>;
    /**
     * Plugin state
     */
    state?: Record<string, unknown>;
    /**
     * Get plugin information
     */
    getInfo?: () => Record<string, unknown>;
}

/**
 * Core module
 * Contains core functions like initialization, event tracking, and plugin management
 */

/**
 * Plugin manager
 * Responsible for plugin registration, initialization, and destruction
 */
declare class Plugins {
    /**
     * Plugin map
     * @private
     * @type {Map<string, IPlugin>}
     */
    private plugins;
    /**
     * Create plugin context
     * @returns Plugin context
     */
    private createPluginContext;
    /**
     * Register plugin
     * @param plugin - Plugin instance
     * @returns Whether registration was successful
     */
    register(plugin: IPlugin): boolean;
    /**
     * Initialize plugin
     * @param plugin - Plugin instance
     * @returns Whether initialization was successful
     */
    init(plugin: IPlugin): boolean;
    /**
     * Destroy plugin
     * @param plugin - Plugin instance
     * @returns Whether destruction was successful
     */
    destroy(plugin: IPlugin): boolean;
    /**
     * Get plugin
     * @param name - Plugin name
     * @returns Plugin instance
     */
    get(name: string): IPlugin | undefined;
    /**
     * Get all plugins
     * @returns Plugin list
     */
    getAll(): IPlugin[];
    /**
     * Get enabled plugins
     * @returns Enabled plugin list
     */
    getEnabled(): IPlugin[];
    /**
     * Enable plugin
     * @param name - Plugin name
     * @returns Whether enabling was successful
     */
    enable(name: string): boolean;
    /**
     * Disable plugin
     * @param name - Plugin name
     * @returns Whether disabling was successful
     */
    disable(name: string): boolean;
    /**
     * Remove plugin
     * @param name - Plugin name
     * @returns Whether removal was successful
     */
    remove(name: string): boolean;
    /**
     * Clear all plugins
     */
    clear(): void;
    /**
     * Sort plugins by priority
     * @returns Sorted plugin list
     */
    sort(): IPlugin[];
}
/**
 * Plugin manager instance
 * @type {PluginManager}
 */
declare const plugins: Plugins;
/**
 * Initialize configuration
 * @param options - Configuration options
 */
declare function init(options: Options): void;
/**
 * Use plugin
 * @param plugin - Plugin instance
 */
declare function use(plugin: IPlugin): void;
/**
 * Track event
 * @template T
 * @param event - Event name
 * @param [properties] - Event properties
 */
declare function track<T extends EventProperties>(event: string, properties?: T): void;

/**
 * Queue management module
 * Responsible for event push, scheduling, sending, and offline caching
 * Refactored to modular architecture for better maintainability and testability
 */

/**
 * Send events in queue
 */
declare function flush(): Promise<void>;
/**
 * Clear all timers
 */
declare function clearTimers(): void;

/**
 * User management plugin
 * Responsible for device ID and user ID generation, storage, and management
 */

/**
 * Asynchronous version of device ID generation
 * @returns Device ID
 */
declare function generateStableDeviceIdAsync(): Promise<string>;
/**
 * Gets device ID
 * @returns Device ID
 */
declare function getDeviceId(): string;
/**
 * Sets user ID
 * @param id - User ID
 */
declare function setID(id: string): void;
/**
 * Gets user ID
 * @returns User ID
 */
declare function getID(): string;
/**
 * Clears user ID
 */
declare function clearID(): void;
/**
 * User plugin
 */
declare const userPlugin: IPlugin;

declare const storageUtils: {
    /**
     * Gets a value from localStorage
     * @param key - The storage key name
     * @param parser - Optional parser function to parse the stored string value
     * @returns The stored value, or null if not found or an error occurs
     */
    get: (key: string, parser?: (value: string) => unknown) => unknown;
    /**
     * Sets a value in localStorage
     * @param key - The storage key name
     * @param value - The value to store, non-string values will be converted to JSON string
     * @returns true if operation succeeds, false if it fails
     */
    set: (key: string, value: unknown) => boolean;
    /**
     * Removes a value from localStorage by key
     * @param key - The key name to remove
     * @returns true if operation succeeds, false if it fails
     */
    remove: (key: string) => boolean;
    /**
     * Clears all data from localStorage
     * @returns true if operation succeeds, false if it fails
     */
    clear: () => boolean;
};

/**
 * Browser data interface
 * Contains various information collected from the browser environment
 */
interface BrowserData {
    /** Device ID */
    device_id: string;
    /** Event name */
    event: string;
    /** User agent string */
    user_agent: string;
    /** Device width */
    device_width: number;
    /** Device height */
    device_height: number;
    /** Whether online */
    is_online: boolean;
    /** Connection type */
    connection_type?: string;
    /** Downlink speed */
    downlink?: number;
    /** Effective connection type */
    effective_type?: string;
    /** Round-trip time */
    rtt?: number;
    /** Application code name */
    app_code_name: string;
    /** Application name */
    app_name: string;
    /** Language setting */
    language: string;
    /** Platform information */
    platform: string;
    /** Time zone */
    time_zone: string;
    /** Browser version */
    browser_version?: string;
    /** Browser name */
    browser_name?: string;
    /** Browser major version */
    browser_major_version?: string;
    /** Engine name */
    engine_name?: string;
    /** Engine version */
    engine_version?: string;
    /** Device pixel ratio */
    device_pixel_ratio: number;
    /** Whether mobile device */
    is_mobile?: boolean;
    /** Whether tablet device */
    is_tablet?: boolean;
    /** Whether desktop device */
    is_desktop?: boolean;
    /** Current URL */
    current_url: string;
    /** Path name */
    pathname: string;
    /** Host name */
    hostname: string;
    /** Protocol */
    protocol: string;
    /** Port */
    port?: string;
    /** Query string */
    search?: string;
    /** Hash value */
    hash?: string;
    /** Document URL */
    document_url: string;
    /** Referrer URL */
    referrer_url: string;
    /** Content type */
    content_type: string;
    /** Document title */
    document_title: string;
    /** Document character set */
    document_charset: string;
    /** Document ready state */
    document_ready_state?: string;
    /** Screen width */
    screen_width: number;
    /** Screen height */
    screen_height: number;
    /** Screen available width */
    screen_available_width: number;
    /** Screen available height */
    screen_available_height: number;
    /** Screen color depth */
    screen_color_depth: number;
    /** Horizontal scroll position */
    scroll_x: number;
    /** Vertical scroll position */
    scroll_y: number;
    /** Country */
    country?: string;
    /** Region */
    region?: string;
    /** City */
    city?: string;
    /** Begin time */
    begin_time: number;
    /** Dynamic properties */
    [propName: string]: unknown;
}
/**
 * Browser utility object
 * Provides utility methods to get browser and device related information
 */
declare const browserUtils: {
    /**
     * Gets browser information
     * @returns Browser name, version, and platform information
     */
    getBrowser: () => {
        name: string;
        version: string;
        platform: string;
    };
    /**
     * Gets device type
     * @returns Device type: mobile, tablet, desktop, or unknown
     */
    getDeviceType: () => "mobile" | "tablet" | "desktop" | "unknown";
    /** Gets network state */
    getNetworkState: () => {
        type: "online" | "offline";
        effectiveType: "2g" | "3g" | "4g" | "5g" | "unknown";
        rtt: number;
        downlink: number;
    };
};
/**
 * Gets browser data
 * Collects and returns various information from the current browser environment
 * @returns Browser data object
 */
declare function getBrowserData(): BrowserData;
/**
 * Browser data collection plugin
 * Automatically collects browser environment data during event tracking
 */
declare const browserPlugin: IPlugin;

/**
 * Session management plugin
 * Responsible for session creation, maintenance, timeout handling, and session data collection
 */

/**
 * Session manager class
 */
declare class Sessions {
    /**
     * Session state
     */
    private session;
    /**
     * Timeout ID
     */
    private timeoutId;
    /**
     * Memory cache
     */
    private storageCache;
    /**
     * Last storage sync time
     */
    private lastStorageSync;
    /**
     * Storage sync interval (milliseconds)
     */
    private syncInterval;
    /**
     * Initialize session
     */
    start(): void;
    /**
     * Update session last active time
     */
    updateLastActive(): void;
    /**
     * Get session ID
     * @returns Session ID
     */
    getID(): string | null;
    /**
     * Get session start time
     * @returns Session start time
     */
    getStartTime(): number | null;
    /**
     * Get session duration
     * @returns Session duration
     */
    getDuration(): number;
    /**
     * Check if it's a new session
     * @returns Whether it's a new session
     */
    isNew(): boolean;
    /**
     * Clear timeout
     */
    clearTimeout(): void;
    /**
     * Increment page views count
     */
    incrementPageViews(): void;
    /**
     * Increment events count
     */
    incrementEvents(): void;
    /**
     * Get session statistics
     * @returns Session statistics
     */
    getStats(): {
        pageViews: number;
        events: number;
        duration: number;
    };
    /**
     * Get session context
     * @returns Session context
     */
    getContext(): EventProperties;
    /**
     * Stop session
     */
    stop(): void;
    /**
     * Start session timeout
     */
    private startSessionTimeout;
    /**
     * Reset session timeout
     */
    private resetSessionTimeout;
    /**
     * Sync storage cache
     */
    private syncStorage;
    /**
     * Get or create session
     * @returns Session state
     */
    private getOrCreateSession;
    /**
     * Generate session ID
     * @returns Session ID
     */
    private generateSessionId;
}
/**
 * Session manager instance
 */
declare const sessions: Sessions;
/**
 * Session plugin
 */
declare const sessionPlugin: IPlugin;

/**
 * Behavior management plugin
 * Responsible for tracking user behavior, page views, and behavior analysis
 */

/**
 * Behavior step interface
 */
interface BehaviorStep {
    /**
     * Event name
     */
    event: string;
    /**
     * Timestamp
     */
    timestamp: number;
    /**
     * Event properties
     */
    properties: EventProperties;
    /**
     * Path
     */
    path: string;
    /**
     * Referrer
     */
    referrer: string;
}
/**
 * Behavior manager
 * Responsible for tracking and managing user behavior
 */
declare class Behaviors {
    /**
     * Behavior path
     * @private
     */
    private behaviorPath;
    /**
     * Save timeout ID
     * @private
     */
    private saveTimeoutId;
    /**
     * Last save time
     * @private
     */
    private lastSaveTime;
    /**
     * Save interval (milliseconds)
     * @private
     */
    private saveInterval;
    /**
     * Initialize behavior manager
     */
    init(): void;
    /**
     * Load behavior path
     * @private
     * @returns Behavior path
     */
    private loadBehaviorPath;
    /**
     * Save behavior path
     * @private
     */
    private saveBehaviorPath;
    /**
     * Actually save behavior path to storage
     * @private
     */
    private saveBehaviorPathToStorage;
    /**
     * Track behavior
     * @param event - Event name
     * @param properties - Event properties
     */
    track(event: string, properties?: EventProperties): void;
    /**
     * Track page view
     * @param properties - Page properties
     */
    trackView(properties?: EventProperties): void;
    /**
     * Get behavior path
     * @returns Behavior path
     */
    getPath(): BehaviorStep[];
    /**
     * Get recent behaviors
     * @param limit - Limit count
     * @returns Recent behaviors
     */
    getRecent(limit?: number): BehaviorStep[];
    /**
     * Get behavior path statistics
     * @returns Behavior statistics
     * @returns totalSteps - Total steps
     * @returns uniqueEvents - Unique events count
     * @returns averageTimeBetweenSteps - Average time between steps
     */
    getStats(): {
        totalSteps: number;
        uniqueEvents: number;
        averageTimeBetweenSteps: number;
    };
    /**
     * Get behavior path context
     * @returns Behavior context
     */
    getContext(): EventProperties;
    /**
     * Clear behavior path
     */
    clear(): void;
    /**
     * Clear timeouts
     */
    clearTimeouts(): void;
    /**
     * Analyze behavior path
     * @returns Behavior analysis result
     * @returns mostFrequentEvents - Most frequent events
     * @returns commonPaths - Common paths
     * @returns averageSessionDuration - Average session duration
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
     * Extract sessions
     * @private
     * @returns Session list
     */
    private extractSessions;
}
/**
 * Behavior manager instance
 */
declare const behaviors: Behaviors;
/**
 * Behavior plugin
 */
declare const behaviorPlugin: IPlugin;

/**
 * Error plugin
 * Responsible for listening to and capturing JavaScript errors and unhandled Promise rejections
 */

/**
 * Error plugin
 */
declare const errorPlugin: IPlugin;

/**
 * Performance plugin
 * Responsible for collecting and sending page performance data, including load time, time to first byte, DOM parsing time, etc.
 */

/**
 * Performance plugin
 */
declare const performancePlugin: IPlugin;

/**
 * Page view plugin
 * Responsible for monitoring and tracking page view events, including initial load and route changes
 */

/**
 * Page view plugin
 */
declare const pageviewPlugin: IPlugin;

/**
 * Network plugin
 * Responsible for monitoring and tracking network requests, including XMLHttpRequest and fetch requests
 */

/**
 * Network plugin
 */
declare const networkPlugin: IPlugin;

/**
 * Error type definitions
 */
/**
 * Error types
 */
type ErrorType = "network" | "network:timeout" | "network:offline" | "network:server" | "network:client" | "storage" | "storage:quota" | "storage:access" | "browser" | "plugin" | "plugin:init" | "plugin:execute" | "queue" | "queue:full" | "queue:overflow" | "device" | "session" | "session:timeout" | "behavior" | "data" | "data:validation" | "data:serialization" | "config" | "init" | "runtime" | "unknown";
/**
 * Error levels
 */
type ErrorLevel = "debug" | "info" | "warn" | "error" | "fatal";
/**
 * Error interface
 */
interface TraceError {
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
interface ErrorHandlerConfig {
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
 * Error summary interface
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
 * Error handler class
 * Responsible for capturing, recording, and handling errors
 */
declare class ErrorHandler {
    /**
     * Configuration
     * @private
     */
    private config;
    /**
     * Error queue
     * @private
     */
    private errors;
    /**
     * Error statistics
     * @private
     */
    private stats;
    /**
     * Error timestamp list
     * @private
     */
    private errorTimestamps;
    /**
     * Constructor
     * @param config - Configuration options
     */
    constructor(config?: Partial<ErrorHandlerConfig>);
    /**
     * Initialize error statistics
     * @private
     */
    private initStats;
    /**
     * Generate error ID
     * @private
     * @returns Error ID
     */
    private generateErrorId;
    /**
     * Parse error stack
     * @private
     * @param stack - Error stack
     * @returns Parsed result
     */
    private parseStack;
    /**
     * Update error statistics
     * @private
     * @param error - Error object
     */
    private updateStats;
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
    captureError(type: ErrorType, message: string, error?: unknown, context?: Record<string, unknown>, level?: ErrorLevel, code?: string, source?: string): TraceError;
    /**
     * Check error rate
     * @private
     * @param error - Error object
     */
    private checkErrorRate;
    /**
     * Log error
     * @private
     * @param error - Error object
     */
    private logError;
    /**
     * Get error statistics
     * @returns Error statistics information
     */
    getStats(): ErrorStats;
    /**
     * Get recent errors
     * @param count - Number of errors
     * @returns List of recent errors
     */
    getRecentErrors(count?: number): TraceError[];
    /**
     * Check if there are errors
     * @returns Whether there are errors
     */
    hasErrors(): boolean;
    /**
     * Get error summary
     * @returns Error summary
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
     * Check if this error level should be logged
     * @private
     * @param level - Error level
     * @returns Whether to log
     */
    private shouldLog;
    /**
     * Get error queue
     * @returns Error queue
     */
    getErrors(): TraceError[];
    /**
     * Clear error queue
     */
    clearErrors(): void;
    /**
     * Handle network error
     * @param error - Error object
     * @param context - Error context
     */
    handleNetworkError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * Handle storage error
     * @param error - Error object
     * @param context - Error context
     */
    handleStorageError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * Handle browser API error
     * @param error - Error object
     * @param context - Error context
     */
    handleBrowserError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * Handle plugin error
     * @param error - Error object
     * @param context - Error context
     */
    handlePluginError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * Handle queue error
     * @param error - Error object
     * @param context - Error context
     */
    handleQueueError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * Handle device ID error
     * @param error - Error object
     * @param context - Error context
     */
    handleDeviceError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * Handle session error
     * @param error - Error object
     * @param context - Error context
     */
    handleSessionError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * Handle behavior error
     * @param error - Error object
     * @param context - Error context
     */
    handleBehaviorError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * Handle data error
     * @param error - Error object
     * @param context - Error context
     */
    handleDataError(error: unknown, context?: Record<string, unknown>): void;
    /**
     * Handle unknown error
     * @param error - Error object
     * @param context - Error context
     */
    handleUnknownError(error: unknown, context?: Record<string, unknown>): void;
}

/**
 * Error statistics module
 */

/**
 * Initialize error statistics
 * @returns Initialized error statistics object
 */
declare function initializeStats(): ErrorStats;
/**
 * Calculate error rate
 * @param timestamps - List of error timestamps
 * @returns Error rate object
 */
declare function calculateErrorRate(timestamps: number[]): {
    lastMinute: number;
    lastHour: number;
};
/**
 * Generate error summary
 * @param errors - List of errors
 * @param stats - Error statistics
 * @returns Error summary
 */
declare function generateErrorSummary(errors: TraceError[], stats: ErrorStats): ErrorSummary;
/**
 * Clean up expired timestamps
 * @param timestamps - List of timestamps
 * @param threshold - Threshold timestamp
 * @returns Cleaned list of timestamps
 */
declare function cleanupTimestamps(timestamps: number[], threshold: number): number[];

/**
 * Error handler instance
 */
declare const errorHandler: ErrorHandler;
/**
 * Capture error
 * @param type - Error type
 * @param message - Error message
 * @param error - Original error object
 * @param context - Error context
 * @param level - Error level
 */
declare function captureError(type: ErrorType, message: string, error?: unknown, context?: Record<string, unknown>, level?: ErrorLevel): void;
/**
 * Handle network error
 * @param error - Error object
 * @param context - Error context
 */
declare function handleNetworkError(error: unknown, context?: Record<string, unknown>): void;
/**
 * Handle storage error
 * @param error - Error object
 * @param context - Error context
 */
declare function handleStorageError(error: unknown, context?: Record<string, unknown>): void;
/**
 * Handle browser API error
 * @param error - Error object
 * @param context - Error context
 */
declare function handleBrowserError(error: unknown, context?: Record<string, unknown>): void;
/**
 * Handle plugin error
 * @param error - Error object
 * @param context - Error context
 */
declare function handlePluginError(error: unknown, context?: Record<string, unknown>): void;
/**
 * Handle queue error
 * @param error - Error object
 * @param context - Error context
 */
declare function handleQueueError(error: unknown, context?: Record<string, unknown>): void;
/**
 * Handle device ID error
 * @param error - Error object
 * @param context - Error context
 */
declare function handleDeviceError(error: unknown, context?: Record<string, unknown>): void;
/**
 * Handle session error
 * @param error - Error object
 * @param context - Error context
 */
declare function handleSessionError(error: unknown, context?: Record<string, unknown>): void;
/**
 * Handle behavior error
 * @param error - Error object
 * @param context - Error context
 */
declare function handleBehaviorError(error: unknown, context?: Record<string, unknown>): void;
/**
 * Handle data error
 * @param error - Error object
 * @param context - Error context
 */
declare function handleDataError(error: unknown, context?: Record<string, unknown>): void;
/**
 * Handle unknown error
 * @param error - Error object
 * @param context - Error context
 */
declare function handleUnknownError(error: unknown, context?: Record<string, unknown>): void;

export { type BrowserData, ErrorHandler, type ErrorHandlerConfig, type ErrorLevel, type ErrorStats, type ErrorSummary, type ErrorType, type EventProperties, type IPlugin, type Options, type Payload, type TraceError, behaviorPlugin, behaviors, browserPlugin, browserUtils, calculateErrorRate, captureError, cleanupTimestamps, clearID, clearTimers, errorHandler, errorPlugin, flush, generateErrorSummary, generateStableDeviceIdAsync, getBrowserData, getDeviceId, getID, handleBehaviorError, handleBrowserError, handleDataError, handleDeviceError, handleNetworkError, handlePluginError, handleQueueError, handleSessionError, handleStorageError, handleUnknownError, init, initializeStats, networkPlugin, pageviewPlugin, performancePlugin, plugins, sessionPlugin, sessions, setID, storageUtils, track, use, userPlugin };
