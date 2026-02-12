/**
 * 错误插件
 * 负责监听和捕获JavaScript错误和未处理的Promise拒绝
 */

import { track } from "../core";
import type { IPlugin, IPluginContext } from "../types";
import { isBrowser } from "../utils";

/**
 * 错误插件
 */
export const errorPlugin: IPlugin = {
  /**
   * 插件名称
   */
  name: "error",

  /**
   * 插件设置方法
   */
  setup(_context: IPluginContext) {
    if (!isBrowser()) return;

    // 监听JavaScript错误
    window.addEventListener("error", (e) => {
      try {
        track("js_error", {
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
        });
      } catch {
        // 忽略错误，避免无限循环
      }
    });

    // 监听未处理的Promise拒绝
    window.addEventListener("unhandledrejection", (e) => {
      try {
        track("promise_error", {
          reason: String(e.reason),
          message: e.reason?.message || String(e.reason),
        });
      } catch {
        // 忽略错误，避免无限循环
      }
    });
  },
};
