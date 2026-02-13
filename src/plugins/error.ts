/**
 * Error plugin
 * Responsible for listening to and capturing JavaScript errors and unhandled Promise rejections
 */

import { track } from "../core";
import type { IPlugin, IPluginContext } from "../types";
import { isBrowser } from "../utils";

/**
 * Error plugin
 */
export const errorPlugin: IPlugin = {
  /**
   * Plugin name
   */
  name: "error",

  /**
   * Plugin setup method
   */
  setup(_context: IPluginContext) {
    if (!isBrowser()) return;

    // Listen for JavaScript errors
    window.addEventListener("error", (e) => {
      try {
        track("js_error", {
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
        });
      } catch {
        // Ignore errors to avoid infinite loops
      }
    });

    // Listen for unhandled Promise rejections
    window.addEventListener("unhandledrejection", (e) => {
      try {
        track("promise_error", {
          reason: String(e.reason),
          message: e.reason?.message || String(e.reason),
        });
      } catch {
        // Ignore errors to avoid infinite loops
      }
    });
  },
};
