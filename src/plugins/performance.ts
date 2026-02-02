/**
 * 性能插件
 * 负责收集和发送页面性能数据，包括加载时间、首字节时间、DOM解析时间等
 */

import { track } from "../core";
import type { IPlugin, IPluginContext } from "../types";
import { isBrowser } from "../utils";

/**
 * 发送性能数据
 */
function sendPerformanceData() {
  if (!isBrowser()) return;

  try {
    const performance = window.performance;
    if (!performance || !performance.getEntriesByType) return;

    // 获取导航性能数据
    const navigationEntries = performance.getEntriesByType("navigation");
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as PerformanceNavigationTiming;

      track("page_performance", {
        // 页面加载时间
        loadTime: navEntry.loadEventEnd - navEntry.fetchStart,
        // 首字节时间
        ttfb: navEntry.responseStart - navEntry.fetchStart,
        // 解析 DOM 时间
        domContentLoaded:
          navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
        // 重定向时间
        redirectTime: navEntry.redirectEnd - navEntry.redirectStart,
        // DNS 查询时间
        dnsTime: navEntry.domainLookupEnd - navEntry.domainLookupStart,
        // TCP 连接时间
        tcpTime: navEntry.connectEnd - navEntry.connectStart,
        // SSL 握手时间
        sslTime: (navEntry as any).secureConnectionStart
          ? navEntry.connectEnd - (navEntry as any).secureConnectionStart
          : 0,
        // 首屏时间（估算）
        firstPaint:
          (performance as any)
            .getEntriesByType("paint")
            .find((e: any) => e.name === "first-paint")?.startTime || 0,
        firstContentfulPaint:
          (performance as any)
            .getEntriesByType("paint")
            .find((e: any) => e.name === "first-contentful-paint")?.startTime ||
          0,
      });
    }

    // 获取资源加载性能数据
    const resourceEntries = performance.getEntriesByType("resource");
    if (resourceEntries.length > 0) {
      const resourceStats = {
        total: resourceEntries.length,
        scripts: 0,
        stylesheets: 0,
        images: 0,
        fonts: 0,
        other: 0,
        totalLoadTime: 0,
      };

      resourceEntries.forEach((entry) => {
        const resourceEntry = entry as PerformanceResourceTiming;
        resourceStats.totalLoadTime += resourceEntry.duration;

        if (resourceEntry.name.includes(".js")) {
          resourceStats.scripts++;
        } else if (resourceEntry.name.includes(".css")) {
          resourceStats.stylesheets++;
        } else if (/(jpg|jpeg|png|gif|webp|svg)$/i.test(resourceEntry.name)) {
          resourceStats.images++;
        } else if (/(woff|woff2|ttf|otf)$/i.test(resourceEntry.name)) {
          resourceStats.fonts++;
        } else {
          resourceStats.other++;
        }
      });

      track("resource_performance", resourceStats);
    }
  } catch {
    // 忽略错误，避免无限循环
  }
}

/**
 * 性能插件
 */
export const performancePlugin: IPlugin = {
  /**
   * 插件名称
   */
  name: "performance",

  /**
   * 插件设置方法
   */
  setup(context: IPluginContext) {
    if (!isBrowser()) return;

    // 等待页面加载完成
    if (document.readyState === "complete") {
      sendPerformanceData();
    } else {
      window.addEventListener("load", sendPerformanceData);
    }
  },
};
