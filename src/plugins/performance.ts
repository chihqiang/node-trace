/**
 * Performance plugin
 * Responsible for collecting and sending page performance data, including load time, time to first byte, DOM parsing time, etc.
 */

import { track } from "../core";
import type { IPlugin, IPluginContext } from "../types";
import { isBrowser } from "../utils";

/**
 * Performance paint entry interface
 */
interface PerformancePaintEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
}

/**
 * Send performance data
 */
function sendPerformanceData() {
  if (!isBrowser()) return;

  try {
    const performance = window.performance;
    if (!performance || !performance.getEntriesByType) return;

    // Get navigation performance data
    const navigationEntries = performance.getEntriesByType("navigation");
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as PerformanceNavigationTiming;

      track("page_performance", {
        // Page load time
        loadTime: navEntry.loadEventEnd - navEntry.fetchStart,
        // Time to first byte
        ttfb: navEntry.responseStart - navEntry.fetchStart,
        // DOM parsing time
        domContentLoaded:
          navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
        // Redirect time
        redirectTime: navEntry.redirectEnd - navEntry.redirectStart,
        // DNS query time
        dnsTime: navEntry.domainLookupEnd - navEntry.domainLookupStart,
        // TCP connection time
        tcpTime: navEntry.connectEnd - navEntry.connectStart,
        // SSL handshake time
        sslTime: navEntry.secureConnectionStart
          ? navEntry.connectEnd - navEntry.secureConnectionStart
          : 0,
        // First paint time (estimated)
        firstPaint:
          performance
            .getEntriesByType("paint")
            .find((e) => (e as PerformancePaintEntry).name === "first-paint")
            ?.startTime || 0,
        firstContentfulPaint:
          performance
            .getEntriesByType("paint")
            .find(
              (e) =>
                (e as PerformancePaintEntry).name === "first-contentful-paint",
            )?.startTime || 0,
      });
    }

    // Get resource loading performance data
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
    // Ignore errors to avoid infinite loops
  }
}

/**
 * Performance plugin
 */
export const performancePlugin: IPlugin = {
  /**
   * Plugin name
   */
  name: "performance",

  /**
   * Plugin setup method
   */
  setup(_context: IPluginContext) {
    if (!isBrowser()) return;

    // Wait for page load to complete
    if (document.readyState === "complete") {
      sendPerformanceData();
    } else {
      window.addEventListener("load", sendPerformanceData);
    }
  },
};
