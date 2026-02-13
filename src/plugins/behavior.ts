/**
 * Behavior management plugin
 * Responsible for tracking user behavior, page views, and behavior analysis
 */

import { isBrowser } from "../utils";
import { storageUtils } from "./browser";
import { handleBehaviorError } from "../error";
import type {
  EventProperties,
  IPlugin,
  IPluginContext,
  Payload,
} from "../types";

/**
 * Behavior path storage key
 */
const BEHAVIOR_PATH_KEY = "__analytics_behavior_path__";

/**
 * Behavior constants definition
 */
export const BEHAVIOR_CONSTANTS = {
  /**
   * Maximum behavior path length
   */
  MAX_STEPS: 50,
  /**
   * Save interval (milliseconds)
   */
  SAVE_INTERVAL: 2000,
  /**
   * Default recent behaviors limit
   */
  DEFAULT_RECENT_BEHAVIORS_LIMIT: 10,
  /**
   * Behavior context recent behaviors limit
   */
  CONTEXT_RECENT_BEHAVIORS_LIMIT: 5,
  /**
   * Analysis result limit
   */
  ANALYSIS_RESULT_LIMIT: 5,
  /**
   * Session timeout (milliseconds)
   */
  SESSION_TIMEOUT: 30 * 60 * 1000,
};

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
class Behaviors {
  /**
   * Behavior path
   * @private
   */
  private behaviorPath: BehaviorStep[] = [];

  /**
   * Save timeout ID
   * @private
   */
  private saveTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Last save time
   * @private
   */
  private lastSaveTime: number = 0;

  /**
   * Save interval (milliseconds)
   * @private
   */
  private saveInterval: number = BEHAVIOR_CONSTANTS.SAVE_INTERVAL;

  /**
   * Initialize behavior manager
   */
  init(): void {
    if (!isBrowser()) return;

    try {
      this.behaviorPath = this.loadBehaviorPath();
    } catch (error) {
      handleBehaviorError(error, { context: "init" });
      this.behaviorPath = [];
    }
  }

  /**
   * Load behavior path
   * @private
   * @returns Behavior path
   */
  private loadBehaviorPath(): BehaviorStep[] {
    const pathStr = storageUtils.get(BEHAVIOR_PATH_KEY) as string | null;
    if (!pathStr) return [];
    try {
      const path = JSON.parse(pathStr) as unknown;
      return Array.isArray(path) ? path : [];
    } catch {
      return [];
    }
  }

  /**
   * Save behavior path
   * @private
   */
  private saveBehaviorPath(): void {
    if (!isBrowser()) return;

    // Clear previous timeout
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
      this.saveTimeoutId = null;
    }

    // Use throttling mechanism to avoid frequent writes
    const now = Date.now();
    if (now - this.lastSaveTime < this.saveInterval) {
      // Set timeout for delayed save
      this.saveTimeoutId = setTimeout(() => {
        this.saveBehaviorPathToStorage();
      }, this.saveInterval);
      return;
    }

    // Save immediately
    this.saveBehaviorPathToStorage();
  }

  /**
   * Actually save behavior path to storage
   * @private
   */
  private saveBehaviorPathToStorage(): void {
    try {
      // Limit behavior path length
      if (this.behaviorPath.length > BEHAVIOR_CONSTANTS.MAX_STEPS) {
        this.behaviorPath = this.behaviorPath.slice(
          -BEHAVIOR_CONSTANTS.MAX_STEPS,
        );
      }
      storageUtils.set(BEHAVIOR_PATH_KEY, JSON.stringify(this.behaviorPath));
      this.lastSaveTime = Date.now();
    } catch (error) {
      handleBehaviorError(error, { context: "saveBehaviorPathToStorage" });
    }
  }

  /**
   * Track behavior
   * @param event - Event name
   * @param properties - Event properties
   */
  track(event: string, properties: EventProperties = {}): void {
    if (!isBrowser()) return;

    try {
      const step: BehaviorStep = {
        event,
        timestamp: Date.now(),
        properties,
        path: window.location.pathname,
        referrer: document.referrer,
      };

      this.behaviorPath.push(step);
      this.saveBehaviorPath();
    } catch (error) {
      handleBehaviorError(error, { context: "track", event });
    }
  }

  /**
   * Track page view
   * @param properties - Page properties
   */
  trackView(properties: EventProperties = {}): void {
    if (!isBrowser()) return;

    try {
      const step: BehaviorStep = {
        event: "pageview",
        timestamp: Date.now(),
        properties,
        path: window.location.pathname,
        referrer: document.referrer,
      };

      this.behaviorPath.push(step);
      this.saveBehaviorPath();
    } catch (error) {
      handleBehaviorError(error, { context: "trackView" });
    }
  }

  /**
   * Get behavior path
   * @returns Behavior path
   */
  getPath(): BehaviorStep[] {
    return [...this.behaviorPath];
  }

  /**
   * Get recent behaviors
   * @param limit - Limit count
   * @returns Recent behaviors
   */
  getRecent(
    limit: number = BEHAVIOR_CONSTANTS.DEFAULT_RECENT_BEHAVIORS_LIMIT,
  ): BehaviorStep[] {
    return this.behaviorPath.slice(-limit);
  }

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
  } {
    const totalSteps = this.behaviorPath.length;
    const uniqueEvents = new Set(this.behaviorPath.map((step) => step.event))
      .size;

    let averageTimeBetweenSteps = 0;
    if (totalSteps > 1) {
      let totalTime = 0;
      for (let i = 1; i < totalSteps; i++) {
        totalTime +=
          this.behaviorPath[i].timestamp - this.behaviorPath[i - 1].timestamp;
      }
      averageTimeBetweenSteps = totalTime / (totalSteps - 1);
    }

    return {
      totalSteps,
      uniqueEvents,
      averageTimeBetweenSteps,
    };
  }

  /**
   * Get behavior path context
   * @returns Behavior context
   */
  getContext(): EventProperties {
    const recentBehaviors = this.getRecent(
      BEHAVIOR_CONSTANTS.CONTEXT_RECENT_BEHAVIORS_LIMIT,
    );
    const behaviorStats = this.getStats();

    return {
      behavior_steps: recentBehaviors.length,
      behavior_unique_events: behaviorStats.uniqueEvents,
      behavior_avg_time_between_steps: Math.round(
        behaviorStats.averageTimeBetweenSteps,
      ),
      last_event: recentBehaviors[recentBehaviors.length - 1]?.event || "",
      last_event_time:
        recentBehaviors[recentBehaviors.length - 1]?.timestamp || 0,
    };
  }

  /**
   * Clear behavior path
   */
  clear(): void {
    if (!isBrowser()) return;

    try {
      this.clearTimeouts();

      this.behaviorPath = [];
      storageUtils.remove(BEHAVIOR_PATH_KEY);
      this.lastSaveTime = 0;
    } catch (error) {
      handleBehaviorError(error, { context: "clear" });
    }
  }

  /**
   * Clear timeouts
   */
  clearTimeouts(): void {
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
      this.saveTimeoutId = null;
    }
  }

  /**
   * Analyze behavior path
   * @returns Behavior analysis result
   * @returns mostFrequentEvents - Most frequent events
   * @returns commonPaths - Common paths
   * @returns averageSessionDuration - Average session duration
   */
  analyze(): {
    mostFrequentEvents: Array<{ event: string; count: number }>;
    commonPaths: Array<{ path: string; count: number }>;
    averageSessionDuration: number;
  } {
    const eventCounts: Record<string, number> = {};
    for (const step of this.behaviorPath) {
      eventCounts[step.event] = (eventCounts[step.event] || 0) + 1;
    }

    const mostFrequentEvents = Object.entries(eventCounts)
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, BEHAVIOR_CONSTANTS.ANALYSIS_RESULT_LIMIT);

    const pathCounts: Record<string, number> = {};
    for (const step of this.behaviorPath) {
      pathCounts[step.path] = (pathCounts[step.path] || 0) + 1;
    }

    const commonPaths = Object.entries(pathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, BEHAVIOR_CONSTANTS.ANALYSIS_RESULT_LIMIT);

    const sessions = this.extractSessions();
    const averageSessionDuration =
      sessions.length > 0
        ? sessions.reduce((total, session) => total + session.duration, 0) /
          sessions.length
        : 0;

    return {
      mostFrequentEvents,
      commonPaths,
      averageSessionDuration,
    };
  }

  /**
   * Extract sessions
   * @private
   * @returns Session list
   */
  private extractSessions(): Array<{
    startTime: number;
    endTime: number;
    duration: number;
    steps: BehaviorStep[];
  }> {
    const sessions: Array<{
      startTime: number;
      endTime: number;
      duration: number;
      steps: BehaviorStep[];
    }> = [];
    if (this.behaviorPath.length === 0) return sessions;

    let currentSession: BehaviorStep[] = [this.behaviorPath[0]];
    let startTime = this.behaviorPath[0].timestamp;

    for (let i = 1; i < this.behaviorPath.length; i++) {
      const step = this.behaviorPath[i];
      const timeDiff =
        step.timestamp - currentSession[currentSession.length - 1].timestamp;

      // Session timeout check
      if (timeDiff > BEHAVIOR_CONSTANTS.SESSION_TIMEOUT) {
        // End current session
        const endTime = currentSession[currentSession.length - 1].timestamp;
        sessions.push({
          startTime,
          endTime,
          duration: endTime - startTime,
          steps: [...currentSession],
        });

        // Start new session
        currentSession = [step];
        startTime = step.timestamp;
      } else {
        currentSession.push(step);
      }
    }

    // Add last session
    if (currentSession.length > 0) {
      const endTime = currentSession[currentSession.length - 1].timestamp;
      sessions.push({
        startTime,
        endTime,
        duration: endTime - startTime,
        steps: [...currentSession],
      });
    }

    return sessions;
  }
}

/**
 * Behavior manager instance
 */
const behaviors = new Behaviors();

/**
 * Behavior plugin
 */
export const behaviorPlugin: IPlugin = {
  name: "behavior",
  version: "1.0.0",
  description:
    "Behavior tracking plugin for tracking user behavior and page views",
  priority: 20,
  dependencies: ["session"],

  setup(context: IPluginContext): void {
    const sessionPlugin = context.getPlugin("session");
    if (!sessionPlugin) {
      console.warn(
        "[Node-Trace] behavior plugin requires session plugin to be registered",
      );
      return;
    }
  },

  init(_context: IPluginContext): void {
    behaviors.init();
  },

  /**
   * Before event tracking callback
   */
  onTrack<T extends EventProperties>(payload: Payload<T>): Payload<T> {
    behaviors.track(payload.event, payload.properties || {});

    if (payload.event === "page_view") {
      behaviors.trackView(payload.properties || {});
    }

    const behaviorContext = behaviors.getContext();
    return {
      ...payload,
      properties: {
        ...payload.properties,
        ...behaviorContext,
      } as T,
    };
  },

  state: {
    behaviors,
  },

  getInfo(): Record<string, any> {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      behaviorStats: behaviors.getStats(),
      recentBehaviors: behaviors.getRecent(5),
    };
  },
};

/**
 * Export behavior manager instance for use elsewhere
 */
export { behaviors };
