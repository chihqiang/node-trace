/**
 * 页面浏览插件
 * 负责监控和跟踪页面浏览事件，包括初始加载和路由变化
 */

import { track } from "../core";
import { getBrowserData } from "./browser";
import type { IPlugin, IPluginContext } from "../types";
import { isBrowser } from "../utils";

/**
 * 发送页面浏览事件
 */
function sendPageView() {
  if (!isBrowser()) return;

  try {
    // 页面浏览事件会通过插件系统自动触发会话和行为更新
    const browserData = getBrowserData();
    track("page_view", {
      ...browserData,
      url: window.location.href,
      pathname: window.location.pathname,
      referrer: document.referrer,
      title: document.title,
    });
  } catch {
    // 忽略错误，避免无限循环
  }
}

/**
 * 监听路由变化
 */
function listenForRouteChanges() {
  if (!isBrowser()) return;

  // 监听 hash 变化
  window.addEventListener("hashchange", sendPageView);

  // 监听 history 变化
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

  // 监听前进/后退按钮
  window.addEventListener("popstate", sendPageView);
}

/**
 * 页面浏览插件
 */
export const pageviewPlugin: IPlugin = {
  /**
   * 插件名称
   */
  name: "pageview",

  /**
   * 插件依赖
   */
  dependencies: ["session", "behavior"],

  /**
   * 插件设置方法
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
