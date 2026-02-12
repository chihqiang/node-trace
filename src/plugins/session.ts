/**
 * 会话管理插件
 * 负责会话的创建、维护、超时处理和会话数据的收集
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
 * 会话ID存储键
 */
const SESSION_ID_KEY = "__analytics_session_id__";

/**
 * 会话开始时间存储键
 */
const SESSION_START_KEY = "__analytics_session_start__";

/**
 * 会话最后活动时间存储键
 */
const SESSION_LAST_ACTIVE_KEY = "__analytics_session_last_active__";

/**
 * 会话常量定义
 */
export const SESSION_CONSTANTS = {
  /**
   * 会话超时时间（30分钟）
   */
  TIMEOUT: 30 * 60 * 1000,
  /**
   * 存储同步间隔（毫秒）
   */
  SYNC_INTERVAL: 5000,
};

/**
 * 会话状态接口
 */
interface SessionState {
  /**
   * 会话ID
   */
  id: string;
  /**
   * 会话开始时间
   */
  startTime: number;
  /**
   * 会话最后活动时间
   */
  lastActive: number;
  /**
   * 页面浏览次数
   */
  pageViews: number;
  /**
   * 事件次数
   */
  events: number;
  /**
   * 是否为新会话
   */
  isNew: boolean;
}

/**
 * 会话管理器类
 */
class Sessions {
  /**
   * 会话状态
   */
  private session: SessionState | null = null;
  /**
   * 超时定时器ID
   */
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  /**
   * 内存缓存
   */
  private storageCache: Record<string, string | null> = {};
  /**
   * 上次存储同步时间
   */
  private lastStorageSync: number = 0;
  /**
   * 存储同步间隔（毫秒）
   */
  private syncInterval: number = SESSION_CONSTANTS.SYNC_INTERVAL;

  /**
   * 初始化会话
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
   * 更新会话最后活动时间
   */
  updateLastActive(): void {
    if (!isBrowser() || !this.session) return;

    try {
      const now = Date.now();
      this.session.lastActive = now;

      // 更新内存缓存
      this.storageCache[SESSION_LAST_ACTIVE_KEY] = now.toString();

      // 异步同步到存储
      this.syncStorage();

      this.resetSessionTimeout();
    } catch (error) {
      handleSessionError(error, { context: "updateLastActive" });
    }
  }

  /**
   * 获取会话ID
   * @returns {string | null} 会话ID
   */
  getID(): string | null {
    if (!this.session) {
      this.start();
    }
    return this.session?.id || null;
  }

  /**
   * 获取会话开始时间
   * @returns {number | null} 会话开始时间
   */
  getStartTime(): number | null {
    if (!this.session) {
      this.start();
    }
    return this.session?.startTime || null;
  }

  /**
   * 获取会话持续时间
   * @returns {number} 会话持续时间
   */
  getDuration(): number {
    if (!this.session) {
      this.start();
    }
    return this.session ? Date.now() - this.session.startTime : 0;
  }

  /**
   * 检查是否为新会话
   * @returns {boolean} 是否为新会话
   */
  isNew(): boolean {
    if (!this.session) {
      this.start();
    }
    return this.session?.isNew || false;
  }

  /**
   * 清理定时器
   */
  clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * 增加页面浏览次数
   */
  incrementPageViews(): void {
    if (this.session) {
      this.session.pageViews++;
    }
  }

  /**
   * 增加事件次数
   */
  incrementEvents(): void {
    if (this.session) {
      this.session.events++;
    }
  }

  /**
   * 获取会话统计信息
   * @returns {Object} 会话统计信息
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
   * 获取会话上下文
   * @returns {EventProperties} 会话上下文
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
   * 结束会话
   */
  stop(): void {
    if (!isBrowser()) return;

    try {
      // 清理存储
      storageUtils.remove(SESSION_ID_KEY);
      storageUtils.remove(SESSION_START_KEY);
      storageUtils.remove(SESSION_LAST_ACTIVE_KEY);

      // 清理内存缓存
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
   * 开始会话超时定时器
   */
  private startSessionTimeout(): void {
    this.resetSessionTimeout();
  }

  /**
   * 重置会话超时定时器
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
   * 同步存储缓存
   */
  private syncStorage(): void {
    const now = Date.now();
    if (now - this.lastStorageSync < this.syncInterval) {
      return;
    }

    // 将内存缓存中的数据写入存储
    Object.entries(this.storageCache).forEach(([key, value]) => {
      storageUtils.set(key, value);
    });

    this.lastStorageSync = now;
  }

  /**
   * 获取或创建会话
   * @returns {SessionState} 会话状态
   */
  private getOrCreateSession(): SessionState {
    // 首先检查内存缓存
    let sessionId = this.storageCache[SESSION_ID_KEY];
    let startTimeStr = this.storageCache[SESSION_START_KEY];
    let lastActiveStr = this.storageCache[SESSION_LAST_ACTIVE_KEY];

    // 如果内存缓存中没有，从存储中读取
    if (!sessionId || !startTimeStr || !lastActiveStr) {
      sessionId = storageUtils.get(SESSION_ID_KEY) as string | null;
      startTimeStr = storageUtils.get(SESSION_START_KEY) as string | null;
      lastActiveStr = storageUtils.get(SESSION_LAST_ACTIVE_KEY) as
        | string
        | null;

      // 更新内存缓存
      if (sessionId) this.storageCache[SESSION_ID_KEY] = sessionId;
      if (startTimeStr) this.storageCache[SESSION_START_KEY] = startTimeStr;
      if (lastActiveStr)
        this.storageCache[SESSION_LAST_ACTIVE_KEY] = lastActiveStr;
    }

    const startTime = startTimeStr ? Number(startTimeStr) : null;
    const lastActive = lastActiveStr ? Number(lastActiveStr) : null;

    // 检查会话是否存在且未超时
    if (sessionId && startTime && lastActive) {
      const now = Date.now();
      if (now - lastActive < SESSION_CONSTANTS.TIMEOUT) {
        // 会话有效，返回现有会话
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

    // 创建新会话
    const newSessionId = this.generateSessionId();
    const newStartTime = Date.now();

    // 更新内存缓存
    this.storageCache[SESSION_ID_KEY] = newSessionId;
    this.storageCache[SESSION_START_KEY] = newStartTime.toString();
    this.storageCache[SESSION_LAST_ACTIVE_KEY] = newStartTime.toString();

    // 立即同步到存储
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
   * 生成会话ID
   * @returns {string} 会话ID
   */
  private generateSessionId(): string {
    return (
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }
}

/**
 * 会话管理器实例
 */
const sessions = new Sessions();

/**
 * 会话插件
 */
export const sessionPlugin: IPlugin = {
  name: "session",
  version: "1.0.0",
  description: "Session management plugin for tracking user sessions",
  priority: 10,

  /**
   * 初始化插件
   */
  init(_context: IPluginContext): void {
    sessions.start();
  },

  /**
   * 事件跟踪前回调
   */
  onTrack<T extends EventProperties>(payload: Payload<T>): Payload<T> {
    // 更新会话活动时间和事件计数
    sessions.updateLastActive();
    sessions.incrementEvents();

    // 如果是页面浏览事件，增加页面浏览次数
    if (payload.event === "page_view") {
      sessions.incrementPageViews();
    }

    // 添加会话上下文
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
   * 插件状态
   */
  state: {
    sessions,
  },

  /**
   * 获取插件信息
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
 * 导出会话管理器实例，以便在其他地方使用
 */
export { sessions };
