import { isBrowser } from "../utils";
import { QUEUE_CONSTANTS } from "./constants";
import { networkManager, type NetworkType } from "./network";

/**
 * 发送策略类型
 */
export type SendStrategy = "beacon" | "fetch" | "xhr";

/**
 * 发送结果
 */
export interface SendResult {
  success: boolean;
  strategy: SendStrategy;
  time: number;
}

/**
 * 发送选项
 */
export interface SendOptions {
  endpoint: string;
  data: any;
  timeout?: number;
  headers?: Record<string, string>;
  debug?: boolean;
}

/**
 * 发送策略选择器
 */
export class SendStrategySelector {
  /**
   * 选择发送策略
   * @param body - 已序列化的数据
   * @param bodySize - 数据大小
   * @returns 发送策略
   */
  select(body: string, bodySize: number): SendStrategy {
    const networkType = networkManager.getType();

    if (networkType === "offline") {
      return "beacon";
    } else if (networkType === "slow") {
      return "fetch";
    }

    if (bodySize > QUEUE_CONSTANTS.BEACON_SIZE_LIMIT) {
      return "fetch";
    } else if (bodySize < QUEUE_CONSTANTS.SMALL_DATA_THRESHOLD) {
      return "beacon";
    }

    return "fetch";
  }
}

/**
 * 使用 Beacon API 发送数据
 */
async function sendWithBeacon(
  endpoint: string,
  body: string,
  debug?: boolean,
): Promise<boolean> {
  if (!isBrowser() || typeof navigator.sendBeacon === "undefined") {
    return false;
  }

  try {
    const success = navigator.sendBeacon(endpoint, body);
    if (debug) {
      console.log("[Node-Trace] Sent with beacon:", success);
    }
    return success;
  } catch (error) {
    if (debug) {
      console.log("[Node-Trace] Beacon failed:", error);
    }
    return false;
  }
}

/**
 * 使用 Fetch API 发送数据
 */
async function sendWithFetch(
  endpoint: string,
  body: string,
  headers: Record<string, string>,
  timeout: number,
  debug?: boolean,
): Promise<boolean> {
  if (!isBrowser() || typeof fetch === "undefined") {
    return false;
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      keepalive: true,
      signal: timeout ? AbortSignal.timeout(timeout) : undefined,
    });

    if (debug) {
      console.log("[Node-Trace] Sent with fetch:", res.ok);
    }
    return res.ok;
  } catch (error) {
    if (debug) {
      console.log("[Node-Trace] Fetch failed:", error);
    }
    return false;
  }
}

/**
 * 使用 XMLHttpRequest 发送数据（作为最终回退）
 */
async function sendWithXHR(
  endpoint: string,
  data: any,
  timeout: number,
  debug?: boolean,
): Promise<boolean> {
  if (!isBrowser() || typeof XMLHttpRequest === "undefined") {
    return false;
  }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const body = JSON.stringify(data);

    xhr.open("POST", endpoint, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    if (timeout > 0) {
      xhr.timeout = timeout;
    }

    xhr.onload = function () {
      const success = xhr.status >= 200 && xhr.status < 300;
      if (debug) {
        console.log("[Node-Trace] Sent with XHR:", success);
      }
      resolve(success);
    };

    xhr.onerror = function () {
      if (debug) {
        console.log("[Node-Trace] XHR failed");
      }
      resolve(false);
    };

    xhr.ontimeout = function () {
      if (debug) {
        console.log("[Node-Trace] XHR timeout");
      }
      resolve(false);
    };

    xhr.send(body);
  });
}

/**
 * 发送器
 */
export class Sender {
  private strategySelector: SendStrategySelector;

  constructor() {
    this.strategySelector = new SendStrategySelector();
  }

  /**
   * 发送数据
   * @param options - 发送选项
   * @returns 发送结果
   */
  async send(options: SendOptions): Promise<SendResult> {
    if (!isBrowser()) {
      return {
        success: false,
        strategy: "fetch",
        time: 0,
      };
    }

    const startTime = Date.now();
    const {
      endpoint,
      data,
      timeout = QUEUE_CONSTANTS.DEFAULT_TIMEOUT,
      headers = {},
      debug,
    } = options;

    const body = JSON.stringify(data);
    const bodySize = body.length;

    const strategy = this.strategySelector.select(body, bodySize);

    let success = false;

    if (strategy === "beacon") {
      success = await sendWithBeacon(endpoint, body, debug);
      if (!success) {
        success = await sendWithFetch(endpoint, body, headers, timeout, debug);
      }
    }

    if (strategy === "fetch" || !success) {
      success = await sendWithFetch(endpoint, body, headers, timeout, debug);
      if (!success) {
        success = await sendWithXHR(endpoint, data, timeout, debug);
      }
    }

    const time = Date.now() - startTime;

    return {
      success,
      strategy,
      time,
    };
  }
}

/**
 * 发送器实例
 */
export const sender = new Sender();
