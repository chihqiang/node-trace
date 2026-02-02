import { isBrowser, now } from "../utils";
import { QUEUE_CONSTANTS } from "./constants";

/**
 * 网络类型
 */
export type NetworkType = "unknown" | "online" | "offline" | "slow";

/**
 * 有效网络类型
 */
export type EffectiveNetworkType = "2g" | "3g" | "4g" | "5g" | "unknown";

/**
 * 网络状态接口
 */
export interface NetworkState {
  type: NetworkType;
  lastCheckTime: number;
  effectiveType: EffectiveNetworkType;
  rtt: number;
  downlink: number;
}

/**
 * 网络状态管理器
 */
export class NetworkManager {
  private state: NetworkState;
  private checkInterval: number;

  constructor() {
    this.state = {
      type: "unknown",
      lastCheckTime: 0,
      effectiveType: "4g",
      rtt: 0,
      downlink: 0,
    };
    this.checkInterval = QUEUE_CONSTANTS.NETWORK_CHECK_INTERVAL;
  }

  /**
   * 检查是否需要更新网络状态
   */
  private shouldUpdate(): boolean {
    const nowTime = now();
    return nowTime - this.state.lastCheckTime >= this.checkInterval;
  }

  /**
   * 更新网络状态
   */
  update(): void {
    if (!isBrowser() || typeof navigator === "undefined") {
      return;
    }

    if (!this.shouldUpdate()) {
      return;
    }

    this.state.lastCheckTime = now();
    this.state.type = navigator.onLine ? "online" : "offline";

    if ("connection" in navigator) {
      const connection = navigator.connection as any;
      this.state.effectiveType = connection.effectiveType || "unknown";
      this.state.rtt = connection.rtt || 0;
      this.state.downlink = connection.downlink || 0;

      if (
        this.state.effectiveType === "2g" ||
        this.state.rtt > 1000 ||
        this.state.downlink < 1
      ) {
        this.state.type = "slow";
      }
    }
  }

  /**
   * 获取网络状态
   */
  getState(): NetworkState {
    this.update();
    return { ...this.state };
  }

  /**
   * 获取网络类型
   */
  getType(): NetworkType {
    this.update();
    return this.state.type;
  }

  /**
   * 检查是否在线
   */
  isOnline(): boolean {
    this.update();
    return this.state.type === "online";
  }

  /**
   * 检查是否离线
   */
  isOffline(): boolean {
    this.update();
    return this.state.type === "offline";
  }

  /**
   * 检查是否为慢速网络
   */
  isSlow(): boolean {
    this.update();
    return this.state.type === "slow";
  }
}

/**
 * 网络管理器实例
 */
export const networkManager = new NetworkManager();
