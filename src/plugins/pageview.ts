/**
 * Page view plugin
 * Responsible for monitoring and tracking page view events, including initial load and route changes
 */

import { track } from "../core";
import { getBrowserData } from "./browser";
import type { IPlugin, IPluginContext } from "../types";
import { isBrowser } from "../utils";

/**
 * Send page view event
 */
function sendPageView() {
  if (!isBrowser()) return;

  try {
    // Page view event will automatically trigger session and behavior updates through plugin system
    const browserData = getBrowserData();
    track("page_view", {
      ...browserData,
      url: window.location.href,
      pathname: window.location.pathname,
      referrer: document.referrer,
      title: document.title,
    });
  } catch {
    // Ignore errors to avoid infinite loops
  }
}

/**
 * Listen for route changes
 */
function listenForRouteChanges() {
  if (!isBrowser()) return;

  // Listen for hash changes
  window.addEventListener("hashchange", sendPageView);

  // Listen for history changes
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    sendPageView();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    sendPageView();
  };

  // Listen for forward/back buttons
  window.addEventListener("popstate", sendPageView);
}

/**
 * Page view plugin
 */
export const pageviewPlugin: IPlugin = {
  /**
   * Plugin name
   */
  name: "pageview",

  /**
   * Plugin dependencies
   */
  dependencies: ["session", "behavior"],

  /**
   * Plugin setup method
   */
  setup(context: IPluginContext) {
    if (!isBrowser()) return;

    const sessionPlugin = context.getPlugin("session");
    const behaviorPlugin = context.getPlugin("behavior");

    if (!sessionPlugin) {
      console.warn(
        "[Node-Trace] pageview plugin requires session plugin to be registered",
      );
      return;
    }

    if (!behaviorPlugin) {
      console.warn(
        "[Node-Trace] pageview plugin requires behavior plugin to be registered",
      );
      return;
    }

    sendPageView();
    listenForRouteChanges();
  },
};
