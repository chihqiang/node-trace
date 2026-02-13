/**
 * Network plugin
 * Responsible for monitoring and tracking network requests, including XMLHttpRequest and fetch requests
 */

import { track, state } from "../core";
import type { IPlugin, IPluginContext } from "../types";
import { isBrowser } from "../utils";

/**
 * Extended XMLHttpRequest interface with custom properties
 */
interface XMLHttpRequestWithCustomProps extends XMLHttpRequest {
  /**
   * Request start time
   */
  _requestStartTime?: number;
  /**
   * Request method
   */
  _requestMethod?: string;
  /**
   * Request URL
   */
  _requestUrl?: string | URL;
}

/**
 * Check if URL is SDK's own reporting endpoint
 * @param url URL to check
 * @returns Whether it's SDK's own reporting endpoint
 */
function isSdkEndpoint(url: string): boolean {
  try {
    const options = state.options;
    if (!options?.endpoint) return false;

    const sdkUrl = new URL(options.endpoint);
    const requestUrl = new URL(url, window.location.origin);

    // Compare protocol, host, and path
    return (
      sdkUrl.protocol === requestUrl.protocol &&
      sdkUrl.host === requestUrl.host &&
      sdkUrl.pathname === requestUrl.pathname
    );
  } catch {
    return false;
  }
}

/**
 * Patch XMLHttpRequest to monitor network requests
 */
function patchXMLHttpRequest() {
  if (!isBrowser() || !window.XMLHttpRequest) return;

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null,
  ) {
    const xhr = this as XMLHttpRequestWithCustomProps;
    xhr._requestStartTime = Date.now();
    xhr._requestMethod = method;
    xhr._requestUrl = url;
    return originalOpen.call(
      this,
      method,
      url,
      async !== false,
      username,
      password,
    );
  };

  XMLHttpRequest.prototype.send = function (
    body?: Document | XMLHttpRequestBodyInit | null,
  ) {
    const xhr = this as XMLHttpRequestWithCustomProps;

    this.addEventListener("load", function () {
      try {
        const url = xhr._requestUrl?.toString() || "";
        // Exclude SDK's own reporting endpoint
        if (isSdkEndpoint(url)) return;

        const duration = Date.now() - (xhr._requestStartTime || Date.now());
        track("network_request", {
          method: xhr._requestMethod || "GET",
          url,
          status: xhr.status,
          statusText: xhr.statusText,
          duration,
          type: "xhr",
          success: xhr.status >= 200 && xhr.status < 300,
        });
      } catch {
        // Ignore errors to avoid infinite loops
      }
    });

    this.addEventListener("error", function () {
      try {
        const url = xhr._requestUrl?.toString() || "";
        // Exclude SDK's own reporting endpoint
        if (isSdkEndpoint(url)) return;

        const duration = Date.now() - (xhr._requestStartTime || Date.now());
        track("network_request", {
          method: xhr._requestMethod || "GET",
          url,
          status: 0,
          statusText: "Error",
          duration,
          type: "xhr",
          success: false,
        });
      } catch {
        // Ignore errors to avoid infinite loops
      }
    });

    this.addEventListener("abort", function () {
      try {
        const url = xhr._requestUrl?.toString() || "";
        // Exclude SDK's own reporting endpoint
        if (isSdkEndpoint(url)) return;

        const duration = Date.now() - (xhr._requestStartTime || Date.now());
        track("network_request", {
          method: xhr._requestMethod || "GET",
          url,
          status: 0,
          statusText: "Aborted",
          duration,
          type: "xhr",
          success: false,
        });
      } catch {
        // Ignore errors to avoid infinite loops
      }
    });

    return originalSend.call(this, body);
  };
}

/**
 * Patch fetch to monitor network requests
 */
function patchFetch() {
  if (!isBrowser() || !window.fetch) return;

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const startTime = Date.now();
    const url = args[0] as string;
    const options = args[1] || {};
    const method = options.method || "GET";

    // Exclude SDK's own reporting endpoint
    if (isSdkEndpoint(url)) {
      return originalFetch.apply(this, args);
    }

    try {
      const response = await originalFetch.apply(this, args);
      const duration = Date.now() - startTime;

      track("network_request", {
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        duration,
        type: "fetch",
        success: response.ok,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      track("network_request", {
        method,
        url,
        status: 0,
        statusText: error instanceof Error ? error.message : "Error",
        duration,
        type: "fetch",
        success: false,
      });

      throw error;
    }
  };
}

/**
 * Network plugin
 */
export const networkPlugin: IPlugin = {
  /**
   * Plugin name
   */
  name: "network",

  /**
   * Plugin setup method
   */
  setup(_context: IPluginContext) {
    if (!isBrowser()) return;

    // Patch XMLHttpRequest
    patchXMLHttpRequest();

    // Patch fetch
    patchFetch();
  },
};
