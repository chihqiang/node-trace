/**
 * 行为管理插件
 * 负责跟踪用户行为、页面浏览和行为分析
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
 * 行为路径存储键
 */
const BEHAVIOR_PATH_KEY = "__analytics_behavior_path__";

/**
 * 行为常量定义
 */
export const BEHAVIOR_CONSTANTS = {
  /**
   * 最大行为路径长度
   */
  MAX_STEPS: 50,
  /**
   * 保存间隔（毫秒）
   */
  SAVE_INTERVAL: 2000,
  /**
   * 默认最近行为数量
   */
  DEFAULT_RECENT_BEHAVIORS_LIMIT: 10,
  /**
   * 行为上下文最近行为数量
   */
  CONTEXT_RECENT_BEHAVIORS_LIMIT: 5,
  /**
   * 分析结果限制数量
   */
  ANALYSIS_RESULT_LIMIT: 5,
  /**
   * 会话超时时间（毫秒）
   */
  SESSION_TIMEOUT: 30 * 60 * 1000,
};

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
class Behaviors {
  /**
   * 行为路径
   * @private
   */
  private behaviorPath: BehaviorStep[] = [];

  /**
   * 保存定时器ID
   * @private
   */
  private saveTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * 最后保存时间
   * @private
   */
  private lastSaveTime: number = 0;

  /**
   * 保存间隔（毫秒）
   * @private
   */
  private saveInterval: number = BEHAVIOR_CONSTANTS.SAVE_INTERVAL;

  /**
   * 初始化行为管理器
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
   * 加载行为路径
   * @private
   * @returns {BehaviorStep[]} 行为路径
   */
  private loadBehaviorPath(): BehaviorStep[] {
    const pathStr = storageUtils.get(BEHAVIOR_PATH_KEY);
    if (!pathStr) return [];
    try {
      const path = JSON.parse(pathStr);
      return Array.isArray(path) ? path : [];
    } catch {
      return [];
    }
  }

  /**
   * 保存行为路径
   * @private
   */
  private saveBehaviorPath(): void {
    if (!isBrowser()) return;

    // 清除之前的定时器
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
      this.saveTimeoutId = null;
    }

    // 使用节流机制，避免频繁写入
    const now = Date.now();
    if (now - this.lastSaveTime < this.saveInterval) {
      // 设置定时器，延迟保存
      this.saveTimeoutId = setTimeout(() => {
        this.saveBehaviorPathToStorage();
      }, this.saveInterval);
      return;
    }

    // 立即保存
    this.saveBehaviorPathToStorage();
  }

  /**
   * 实际保存行为路径到存储
   * @private
   */
  private saveBehaviorPathToStorage(): void {
    try {
      // 限制行为路径长度
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
   * 记录行为
   * @param {string} event - 事件名称
   * @param {EventProperties} [properties={}] - 事件属性
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
   * 记录页面浏览
   * @param {EventProperties} [properties={}] - 页面属性
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
   * 获取行为路径
   * @returns {BehaviorStep[]} 行为路径
   */
  getPath(): BehaviorStep[] {
    return [...this.behaviorPath];
  }

  /**
   * 获取最近的行为
   * @param {number} [limit=10] - 限制数量
   * @returns {BehaviorStep[]} 最近的行为
   */
  getRecent(
    limit: number = BEHAVIOR_CONSTANTS.DEFAULT_RECENT_BEHAVIORS_LIMIT,
  ): BehaviorStep[] {
    return this.behaviorPath.slice(-limit);
  }

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
   * 获取行为路径上下文
   * @returns {EventProperties} 行为上下文
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
   * 清空行为路径
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
   * 清除定时器
   */
  clearTimeouts(): void {
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
      this.saveTimeoutId = null;
    }
  }

  /**
   * 分析行为路径
   * @returns {Object} 行为分析结果
   * @returns {Array} mostFrequentEvents - 最频繁的事件
   * @returns {Array} commonPaths - 常见路径
   * @returns {number} averageSessionDuration - 平均会话持续时间
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
   * 提取会话
   * @private
   * @returns {Array} 会话列表
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

      // 会话超时检查
      if (timeDiff > BEHAVIOR_CONSTANTS.SESSION_TIMEOUT) {
        // 结束当前会话
        const endTime = currentSession[currentSession.length - 1].timestamp;
        sessions.push({
          startTime,
          endTime,
          duration: endTime - startTime,
          steps: [...currentSession],
        });

        // 开始新会话
        currentSession = [step];
        startTime = step.timestamp;
      } else {
        currentSession.push(step);
      }
    }

    // 添加最后一个会话
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
 * 行为管理器实例
 */
const behaviors = new Behaviors();

/**
 * 行为插件
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

  init(context: IPluginContext): void {
    behaviors.init();
  },

  /**
   * 事件跟踪前回调
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
 * 导出行为管理器实例，以便在其他地方使用
 */
export { behaviors };
