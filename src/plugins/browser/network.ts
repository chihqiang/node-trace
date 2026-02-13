import { isBrowser } from "../../utils";

export interface NetworkConnection {
  type?: string;
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
}

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

export const browserUtils = {
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
