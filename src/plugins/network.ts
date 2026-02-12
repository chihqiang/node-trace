/**
 * 网络插件
 * 负责监控和跟踪网络请求，包括XMLHttpRequest和fetch请求
 */

import { track, state } from "../core";
import type { IPlugin, IPluginContext } from "../types";
import { isBrowser } from "../utils";

/**
 * 扩展XMLHttpRequest接口，添加自定义属性
 */
interface XMLHttpRequestWithCustomProps extends XMLHttpRequest {
  /**
   * 请求开始时间
   */
  _requestStartTime?: number;
  /**
   * 请求方法
   */
  _requestMethod?: string;
  /**
   * 请求URL
   */
  _requestUrl?: string | URL;
}

/**
 * 检查URL是否是SDK自身的上报接口
 * @param url 要检查的URL
 * @returns 是否是SDK自身的上报接口
 */
function isSdkEndpoint(url: string): boolean {
  try {
    const options = state.options;
    if (!options?.endpoint) return false;

    const sdkUrl = new URL(options.endpoint);
    const requestUrl = new URL(url, window.location.origin);

    // 比较协议、主机和路径
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
 * 补丁XMLHttpRequest，监控网络请求
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
        // 排除SDK自身的上报接口
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
        // 忽略错误，避免无限循环
      }
    });

    this.addEventListener("error", function () {
      try {
        const url = xhr._requestUrl?.toString() || "";
        // 排除SDK自身的上报接口
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
        // 忽略错误，避免无限循环
      }
    });

    this.addEventListener("abort", function () {
      try {
        const url = xhr._requestUrl?.toString() || "";
        // 排除SDK自身的上报接口
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
        // 忽略错误，避免无限循环
      }
    });

    return originalSend.call(this, body);
  };
}

/**
 * 补丁fetch，监控网络请求
 */
function patchFetch() {
  if (!isBrowser() || !window.fetch) return;

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const startTime = Date.now();
    const url = args[0] as string;
    const options = args[1] || {};
    const method = options.method || "GET";

    // 排除SDK自身的上报接口
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
 * 网络插件
 */
export const networkPlugin: IPlugin = {
  /**
   * 插件名称
   */
  name: "network",

  /**
   * 插件设置方法
   */
  setup(_context: IPluginContext) {
    if (!isBrowser()) return;

    // 补丁 XMLHttpRequest
    patchXMLHttpRequest();

    // 补丁 fetch
    patchFetch();
  },
};
