import { isBrowser } from "../../utils";
import { getDeviceId } from "../user";
import type { IPlugin, EventProperties, Payload } from "../../types";
import {
  getBasicBrowserInfo,
  getDetailedBrowserInfo,
  getDeviceInfo,
  detectBrowser,
  detectDevice,
} from "./detection";
import { getNetworkInfo, browserUtils as networkBrowserUtils } from "./network";
import { getPageInfo, getScrollInfo } from "./page";
import { getScreenInfo } from "./screen";
import { storageUtils } from "./storage";

export interface BrowserData {
  device_id: string;
  event: string;
  user_agent: string;
  device_width: number;
  device_height: number;
  is_online: boolean;
  connection_type?: string;
  downlink?: number;
  effective_type?: string;
  rtt?: number;
  app_code_name: string;
  app_name: string;
  language: string;
  platform: string;
  time_zone: string;
  browser_version?: string;
  browser_name?: string;
  browser_major_version?: string;
  engine_name?: string;
  engine_version?: string;
  device_pixel_ratio: number;
  is_mobile?: boolean;
  is_tablet?: boolean;
  is_desktop?: boolean;
  current_url: string;
  pathname: string;
  hostname: string;
  protocol: string;
  port?: string;
  search?: string;
  hash?: string;
  document_url: string;
  referrer_url: string;
  content_type: string;
  document_title: string;
  document_charset: string;
  document_ready_state?: string;
  screen_width: number;
  screen_height: number;
  screen_available_width: number;
  screen_available_height: number;
  screen_color_depth: number;
  scroll_x: number;
  scroll_y: number;
  country?: string;
  region?: string;
  city?: string;
  begin_time: number;
  [propName: string]: unknown;
}

export const browserUtils = {
  getBrowser: (): {
    name: string;
    version: string;
    platform: string;
  } => {
    if (!isBrowser() || typeof navigator === "undefined") {
      return {
        name: "unknown",
        version: "0",
        platform: "unknown",
      };
    }

    const result = detectBrowser(navigator.userAgent);
    return {
      name: result.name,
      version: result.version,
      platform: navigator.platform,
    };
  },

  getDeviceType: (): "mobile" | "tablet" | "desktop" | "unknown" => {
    if (!isBrowser() || typeof navigator === "undefined") {
      return "unknown";
    }

    const result = detectDevice(navigator.userAgent);
    return result.type;
  },

  getNetworkState: networkBrowserUtils.getNetworkState,
};

export function getBrowserData(): BrowserData {
  if (!isBrowser()) {
    return {
      device_id: getDeviceId(),
      event: "pageview",
      user_agent: "non-browser",
      device_width: 0,
      device_height: 0,
      is_online: true,
      connection_type: "unknown",
      app_code_name: "",
      app_name: "",
      language: "",
      platform: "",
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      browser_version: "",
      browser_name: "non-browser",
      browser_major_version: "0",
      engine_name: "unknown",
      engine_version: "0",
      device_pixel_ratio: 1,
      is_mobile: false,
      is_tablet: false,
      is_desktop: true,
      current_url: "",
      pathname: "",
      hostname: "",
      protocol: "",
      port: "",
      search: "",
      hash: "",
      document_url: "",
      referrer_url: "",
      content_type: "",
      document_title: "",
      document_charset: "",
      document_ready_state: "loading",
      screen_width: 0,
      screen_height: 0,
      screen_available_width: 0,
      screen_available_height: 0,
      screen_color_depth: 0,
      scroll_x: 0,
      scroll_y: 0,
      begin_time: Date.now(),
    };
  }

  try {
    const basicBrowserInfo = getBasicBrowserInfo();
    const detailedBrowserInfo = getDetailedBrowserInfo(
      basicBrowserInfo.user_agent,
    );
    const deviceInfo = getDeviceInfo(basicBrowserInfo.user_agent);
    const networkInfo = getNetworkInfo();
    const screenInfo = getScreenInfo();
    const pageInfo = getPageInfo();
    const scrollInfo = getScrollInfo();

    return {
      device_id: getDeviceId(),
      event: "pageview",
      ...basicBrowserInfo,
      ...deviceInfo,
      ...networkInfo,
      ...detailedBrowserInfo,
      ...screenInfo,
      ...pageInfo,
      ...scrollInfo,
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      begin_time: Date.now(),
    };
  } catch (error) {
    return {
      device_id: getDeviceId(),
      event: "pageview",
      user_agent: navigator?.userAgent || "unknown",
      device_width: window?.innerWidth || 0,
      device_height: window?.innerHeight || 0,
      is_online: navigator?.onLine || false,
      connection_type:
        (navigator as unknown as { connection?: { type?: string } })?.connection
          ?.type || "unknown",
      downlink: (navigator as unknown as { connection?: { downlink?: number } })
        ?.connection?.downlink,
      effective_type: (
        navigator as unknown as { connection?: { effectiveType?: string } }
      )?.connection?.effectiveType,
      rtt: (navigator as unknown as { connection?: { rtt?: number } })
        ?.connection?.rtt,
      app_code_name: navigator?.appCodeName || "",
      app_name: navigator?.appName || "",
      language: navigator?.language || "",
      platform: navigator?.platform || "",
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      browser_version: navigator?.appVersion,
      device_pixel_ratio: window?.devicePixelRatio || 1,
      is_mobile: false,
      is_tablet: false,
      is_desktop: true,
      current_url: window?.location?.href || "",
      pathname: window?.location?.pathname || "",
      hostname: window?.location?.hostname || "",
      protocol: window?.location?.protocol || "",
      port: window?.location?.port || "",
      search: window?.location?.search || "",
      hash: window?.location?.hash || "",
      document_url: document?.URL || "",
      referrer_url: document?.referrer || "",
      content_type: document?.contentType || "",
      document_title: document?.title || "",
      document_charset: document?.characterSet || document?.charset || "",
      document_ready_state: document?.readyState,
      screen_width: screen?.width || 0,
      screen_height: screen?.height || 0,
      screen_available_width: screen?.availWidth || 0,
      screen_available_height: screen?.availHeight || 0,
      screen_color_depth: screen?.colorDepth || 0,
      scroll_x: window?.pageXOffset || document?.documentElement?.scrollLeft || 0,
      scroll_y: window?.pageYOffset || document?.documentElement?.scrollTop || 0,
      begin_time: Date.now(),
    };
  }
}

export const browserPlugin: IPlugin = {
  name: "browser",
  version: "1.0.0",
  description: "Browser data collection plugin",
  priority: 20,

  onTrack<T extends EventProperties>(payload: Payload<T>): Payload<T> {
    const browserData = getBrowserData();
    return {
      ...payload,
      ...browserData,
    };
  },

  getInfo(): Record<string, unknown> {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
    };
  },
};

export { storageUtils };
export type { BrowserDetectionResult, DeviceDetectionResult, BrowserInfo, DeviceType } from "./detection";
export type { NetworkConnection } from "./network";
