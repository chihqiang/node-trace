import { isBrowser } from "../utils";
import { QUEUE_CONSTANTS } from "./constants";
import { networkManager } from "./network";

/**
 * Send strategy type
 */
export type SendStrategy = "beacon" | "fetch" | "xhr";

/**
 * Send result
 */
export interface SendResult {
  success: boolean;
  strategy: SendStrategy;
  time: number;
}

/**
 * Send options
 */
export interface SendOptions {
  endpoint: string;
  data: any;
  timeout?: number;
  headers?: Record<string, string>;
  debug?: boolean;
}

/**
 * Send strategy selector
 */
export class SendStrategySelector {
  /**
   * Select send strategy
   * @param _body - Serialized data (reserved for future extension)
   * @param bodySize - Data size
   * @returns Send strategy
   */
  select(_body: string, bodySize: number): SendStrategy {
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
 * Send data using Beacon API
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
 * Send data using Fetch API
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
 * Send data using XMLHttpRequest (as final fallback)
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
 * Sender
 */
export class Sender {
  private strategySelector: SendStrategySelector;

  constructor() {
    this.strategySelector = new SendStrategySelector();
  }

  /**
   * Send data
   * @param options - Send options
   * @returns Send result
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
 * Sender instance
 */
export const sender = new Sender();
