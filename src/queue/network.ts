import { isBrowser, now } from "../utils";
import { QUEUE_CONSTANTS } from "./constants";

/**
 * Network type
 */
export type NetworkType = "unknown" | "online" | "offline" | "slow";

/**
 * Effective network type
 */
export type EffectiveNetworkType = "2g" | "3g" | "4g" | "5g" | "unknown";

/**
 * Network state interface
 */
export interface NetworkState {
  type: NetworkType;
  lastCheckTime: number;
  effectiveType: EffectiveNetworkType;
  rtt: number;
  downlink: number;
}

/**
 * Network state manager
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
   * Check if network state needs update
   */
  private shouldUpdate(): boolean {
    const nowTime = now();
    return nowTime - this.state.lastCheckTime >= this.checkInterval;
  }

  /**
   * Update network state
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
   * Get network state
   */
  getState(): NetworkState {
    this.update();
    return { ...this.state };
  }

  /**
   * Get network type
   */
  getType(): NetworkType {
    this.update();
    return this.state.type;
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    this.update();
    return this.state.type === "online";
  }

  /**
   * Check if offline
   */
  isOffline(): boolean {
    this.update();
    return this.state.type === "offline";
  }

  /**
   * Check if slow network
   */
  isSlow(): boolean {
    this.update();
    return this.state.type === "slow";
  }
}

/**
 * Network manager instance
 */
export const networkManager = new NetworkManager();
