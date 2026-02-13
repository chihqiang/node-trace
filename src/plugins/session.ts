/**
 * Session management plugin
 * Responsible for session creation, maintenance, timeout handling, and session data collection
 */

import { isBrowser } from "../utils";
import { storageUtils } from "./browser";
import { handleSessionError } from "../error";
import type {
  EventProperties,
  IPlugin,
  IPluginContext,
  Payload,
} from "../types";

/**
 * Session ID storage key
 */
const SESSION_ID_KEY = "__analytics_session_id__";

/**
 * Session start time storage key
 */
const SESSION_START_KEY = "__analytics_session_start__";

/**
 * Session last active time storage key
 */
const SESSION_LAST_ACTIVE_KEY = "__analytics_session_last_active__";

/**
 * Session constants definition
 */
export const SESSION_CONSTANTS = {
  /**
   * Session timeout (30 minutes)
   */
  TIMEOUT: 30 * 60 * 1000,
  /**
   * Storage sync interval (milliseconds)
   */
  SYNC_INTERVAL: 5000,
};

/**
 * Session state interface
 */
interface SessionState {
  /**
   * Session ID
   */
  id: string;
  /**
   * Session start time
   */
  startTime: number;
  /**
   * Session last active time
   */
  lastActive: number;
  /**
   * Page views count
   */
  pageViews: number;
  /**
   * Events count
   */
  events: number;
  /**
   * Whether it's a new session
   */
  isNew: boolean;
}

/**
 * Session manager class
 */
class Sessions {
  /**
   * Session state
   */
  private session: SessionState | null = null;
  /**
   * Timeout ID
   */
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  /**
   * Memory cache
   */
  private storageCache: Record<string, string | null> = {};
  /**
   * Last storage sync time
   */
  private lastStorageSync: number = 0;
  /**
   * Storage sync interval (milliseconds)
   */
  private syncInterval: number = SESSION_CONSTANTS.SYNC_INTERVAL;

  /**
   * Initialize session
   */
  start(): void {
    if (!isBrowser()) return;

    try {
      this.session = this.getOrCreateSession();
      this.startSessionTimeout();
      this.updateLastActive();
    } catch (error) {
      handleSessionError(error, { context: "start" });
    }
  }
  /**
   * Update session last active time
   */
  updateLastActive(): void {
    if (!isBrowser() || !this.session) return;

    try {
      const now = Date.now();
      this.session.lastActive = now;

      // Update memory cache
      this.storageCache[SESSION_LAST_ACTIVE_KEY] = now.toString();

      // Async sync to storage
      this.syncStorage();

      this.resetSessionTimeout();
    } catch (error) {
      handleSessionError(error, { context: "updateLastActive" });
    }
  }

  /**
   * Get session ID
   * @returns Session ID
   */
  getID(): string | null {
    if (!this.session) {
      this.start();
    }
    return this.session?.id || null;
  }

  /**
   * Get session start time
   * @returns Session start time
   */
  getStartTime(): number | null {
    if (!this.session) {
      this.start();
    }
    return this.session?.startTime || null;
  }

  /**
   * Get session duration
   * @returns Session duration
   */
  getDuration(): number {
    if (!this.session) {
      this.start();
    }
    return this.session ? Date.now() - this.session.startTime : 0;
  }

  /**
   * Check if it's a new session
   * @returns Whether it's a new session
   */
  isNew(): boolean {
    if (!this.session) {
      this.start();
    }
    return this.session?.isNew || false;
  }

  /**
   * Clear timeout
   */
  clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Increment page views count
   */
  incrementPageViews(): void {
    if (this.session) {
      this.session.pageViews++;
    }
  }

  /**
   * Increment events count
   */
  incrementEvents(): void {
    if (this.session) {
      this.session.events++;
    }
  }

  /**
   * Get session statistics
   * @returns Session statistics
   */
  getStats(): {
    pageViews: number;
    events: number;
    duration: number;
  } {
    if (!this.session) {
      this.start();
    }
    return {
      pageViews: this.session?.pageViews || 0,
      events: this.session?.events || 0,
      duration: this.session ? Date.now() - this.session.startTime : 0,
    };
  }

  /**
   * Get session context
   * @returns Session context
   */
  getContext(): EventProperties {
    if (!this.session) {
      this.start();
    }
    return {
      session_id: this.session?.id || "",
      session_start: this.session?.startTime || 0,
      session_duration: this.session ? Date.now() - this.session.startTime : 0,
      session_page_views: this.session?.pageViews || 0,
      session_events: this.session?.events || 0,
      session_is_new: this.session?.isNew || false,
    };
  }
  /**
   * Stop session
   */
  stop(): void {
    if (!isBrowser()) return;

    try {
      // Clear storage
      storageUtils.remove(SESSION_ID_KEY);
      storageUtils.remove(SESSION_START_KEY);
      storageUtils.remove(SESSION_LAST_ACTIVE_KEY);

      // Clear memory cache
      delete this.storageCache[SESSION_ID_KEY];
      delete this.storageCache[SESSION_START_KEY];
      delete this.storageCache[SESSION_LAST_ACTIVE_KEY];

      this.session = null;

      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    } catch (error) {
      handleSessionError(error, { context: "stop" });
    }
  }

  /**
   * Start session timeout
   */
  private startSessionTimeout(): void {
    this.resetSessionTimeout();
  }

  /**
   * Reset session timeout
   */
  private resetSessionTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.stop();
    }, SESSION_CONSTANTS.TIMEOUT);
  }

  /**
   * Sync storage cache
   */
  private syncStorage(): void {
    const now = Date.now();
    if (now - this.lastStorageSync < this.syncInterval) {
      return;
    }

    // Write memory cache data to storage
    Object.entries(this.storageCache).forEach(([key, value]) => {
      storageUtils.set(key, value);
    });

    this.lastStorageSync = now;
  }

  /**
   * Get or create session
   * @returns Session state
   */
  private getOrCreateSession(): SessionState {
    // First check memory cache
    let sessionId = this.storageCache[SESSION_ID_KEY];
    let startTimeStr = this.storageCache[SESSION_START_KEY];
    let lastActiveStr = this.storageCache[SESSION_LAST_ACTIVE_KEY];

    // If not in memory cache, read from storage
    if (!sessionId || !startTimeStr || !lastActiveStr) {
      sessionId = storageUtils.get(SESSION_ID_KEY) as string | null;
      startTimeStr = storageUtils.get(SESSION_START_KEY) as string | null;
      lastActiveStr = storageUtils.get(SESSION_LAST_ACTIVE_KEY) as
        | string
        | null;

      // Update memory cache
      if (sessionId) this.storageCache[SESSION_ID_KEY] = sessionId;
      if (startTimeStr) this.storageCache[SESSION_START_KEY] = startTimeStr;
      if (lastActiveStr)
        this.storageCache[SESSION_LAST_ACTIVE_KEY] = lastActiveStr;
    }

    const startTime = startTimeStr ? Number(startTimeStr) : null;
    const lastActive = lastActiveStr ? Number(lastActiveStr) : null;

    // Check if session exists and not timed out
    if (sessionId && startTime && lastActive) {
      const now = Date.now();
      if (now - lastActive < SESSION_CONSTANTS.TIMEOUT) {
        // Session valid, return existing session
        return {
          id: sessionId,
          startTime,
          lastActive,
          pageViews: 0,
          events: 0,
          isNew: false,
        };
      }
    }

    // Create new session
    const newSessionId = this.generateSessionId();
    const newStartTime = Date.now();

    // Update memory cache
    this.storageCache[SESSION_ID_KEY] = newSessionId;
    this.storageCache[SESSION_START_KEY] = newStartTime.toString();
    this.storageCache[SESSION_LAST_ACTIVE_KEY] = newStartTime.toString();

    // Sync to storage immediately
    this.syncStorage();

    return {
      id: newSessionId,
      startTime: newStartTime,
      lastActive: newStartTime,
      pageViews: 0,
      events: 0,
      isNew: true,
    };
  }

  /**
   * Generate session ID
   * @returns Session ID
   */
  private generateSessionId(): string {
    return (
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }
}

/**
 * Session manager instance
 */
const sessions = new Sessions();

/**
 * Session plugin
 */
export const sessionPlugin: IPlugin = {
  name: "session",
  version: "1.0.0",
  description: "Session management plugin for tracking user sessions",
  priority: 10,

  /**
   * Initialize plugin
   */
  init(_context: IPluginContext): void {
    sessions.start();
  },

  /**
   * Before event tracking callback
   */
  onTrack<T extends EventProperties>(payload: Payload<T>): Payload<T> {
    // Update session activity time and event count
    sessions.updateLastActive();
    sessions.incrementEvents();

    // If it's a page view event, increment page views count
    if (payload.event === "page_view") {
      sessions.incrementPageViews();
    }

    // Add session context
    const sessionContext = sessions.getContext();
    return {
      ...payload,
      properties: {
        ...payload.properties,
        ...sessionContext,
      } as T,
    };
  },

  /**
   * Plugin state
   */
  state: {
    sessions,
  },

  /**
   * Get plugin information
   */
  getInfo(): Record<string, any> {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      sessionId: sessions.getID(),
      sessionStartTime: sessions.getStartTime(),
      sessionDuration: sessions.getDuration(),
      sessionIsNew: sessions.isNew(),
      sessionPageViews: sessions.getStats().pageViews,
      sessionEvents: sessions.getStats().events,
    };
  },
};

/**
 * Export session manager instance for use elsewhere
 */
export { sessions };
