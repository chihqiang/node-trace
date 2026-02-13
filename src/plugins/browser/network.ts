import { isBrowser } from "../../utils";

/**
 * Network connection information interface
 */
export interface NetworkConnection {
  /** Connection type (e.g., 'wifi', 'cellular', etc.) */
  type?: string;
  /** Downlink speed in Mbps */
  downlink?: number;
  /** Effective connection type (e.g., 'slow-2g', '2g', '3g', '4g') */
  effectiveType?: string;
  /** Round-trip time in milliseconds */
  rtt?: number;
  /** Whether the user has requested a reduced data usage mode */
  saveData?: boolean;
}

/**
 * Get current network information
 * @returns Network information including online status, connection type, and speed metrics
 */
export function getNetworkInfo(): {
  is_online: boolean;
  connection_type: string;
  downlink: number | undefined;
  effective_type: string | undefined;
  rtt: number | undefined;
} {
  if (!isBrowser() || typeof navigator === "undefined") {
    return {
      is_online: true,
      connection_type: "unknown",
      downlink: undefined,
      effective_type: undefined,
      rtt: undefined,
    };
  }

  return {
    is_online: navigator.onLine,
    connection_type:
      (navigator as unknown as { connection?: NetworkConnection }).connection
        ?.type || "unknown",
    downlink: (navigator as unknown as { connection?: NetworkConnection })
      .connection?.downlink,
    effective_type: (navigator as unknown as { connection?: NetworkConnection })
      .connection?.effectiveType,
    rtt: (navigator as unknown as { connection?: NetworkConnection }).connection
      ?.rtt,
  };
}

/**
 * Browser utility functions
 */
export const browserUtils = {
  /**
   * Get current network state
   * @returns Network state with type, effective type, RTT, and downlink speed
   */
  getNetworkState: (): {
    type: "online" | "offline";
    effectiveType: "2g" | "3g" | "4g" | "5g" | "unknown";
    rtt: number;
    downlink: number;
  } => {
    if (!isBrowser() || typeof navigator === "undefined") {
      return {
        type: "offline",
        effectiveType: "unknown",
        rtt: 0,
        downlink: 0,
      };
    }

    const type = navigator.onLine ? "online" : "offline";
    let effectiveType: "2g" | "3g" | "4g" | "5g" | "unknown" = "unknown";
    let rtt = 0;
    let downlink = 0;

    if ("connection" in navigator) {
      const connection = (
        navigator as unknown as { connection?: NetworkConnection }
      ).connection;
      effectiveType =
        (connection?.effectiveType as "2g" | "3g" | "4g" | "5g" | "unknown") ||
        "unknown";
      rtt = connection?.rtt || 0;
      downlink = connection?.downlink || 0;
    }

    return {
      type,
      effectiveType,
      rtt,
      downlink,
    };
  },
};
