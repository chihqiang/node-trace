/**
 * 浏览器信息插件
 * 负责获取浏览器数据、设备信息和存储操作
 */

import { isBrowser } from "../utils";
import { getDeviceId } from "./user";
import type { IPlugin, EventProperties, Payload } from "../types";

/**
 * 浏览器信息接口
 */
interface BrowserInfo {
  /**
   * 浏览器名称
   */
  name: string;
  /**
   * 浏览器主版本
   */
  major: string;
  /**
   * 渲染引擎
   */
  engine: string;
  /**
   * 引擎版本
   */
  engineVersion: string;
}

/**
 * 设备类型接口
 */
interface DeviceType {
  /**
   * 是否为移动设备
   */
  isMobile: boolean;
  /**
   * 是否为平板设备
   */
  isTablet: boolean;
  /**
   * 是否为桌面设备
   */
  isDesktop: boolean;
}

/**
 * 浏览器检测结果接口
 */
interface BrowserDetectionResult {
  name: string;
  version: string;
  major: string;
  engine: string;
  engineVersion: string;
}

/**
 * 设备检测结果接口
 */
interface DeviceDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  type: "mobile" | "tablet" | "desktop" | "unknown";
}

/**
 * 网络连接接口
 */
interface NetworkConnection {
  type?: string;
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
}

/**
 * 浏览器数据接口
 */
export interface BrowserData {
  /**
   * 设备ID
   */
  device_id: string;
  /**
   * 事件名称
   */
  event: string;

  /**
   * 用户代理字符串
   */
  user_agent: string;
  /**
   * 设备宽度
   */
  device_width: number;
  /**
   * 设备高度
   */
  device_height: number;
  /**
   * 是否在线
   */
  is_online: boolean;
  /**
   * 连接类型
   */
  connection_type?: string;
  /**
   * 下行速度
   */
  downlink?: number;
  /**
   * 有效连接类型
   */
  effective_type?: string;
  /**
   * 往返时间
   */
  rtt?: number;

  /**
   * 应用代码名称
   */
  app_code_name: string;
  /**
   * 应用名称
   */
  app_name: string;
  /**
   * 语言
   */
  language: string;
  /**
   * 平台
   */
  platform: string;
  /**
   * 时区
   */
  time_zone: string;
  /**
   * 浏览器版本
   */
  browser_version?: string;
  /**
   * 浏览器名称
   */
  browser_name?: string;
  /**
   * 浏览器主版本
   */
  browser_major_version?: string;
  /**
   * 引擎名称
   */
  engine_name?: string;
  /**
   * 引擎版本
   */
  engine_version?: string;

  /**
   * 设备像素比
   */
  device_pixel_ratio: number;
  /**
   * 是否为移动设备
   */
  is_mobile?: boolean;
  /**
   * 是否为平板设备
   */
  is_tablet?: boolean;
  /**
   * 是否为桌面设备
   */
  is_desktop?: boolean;

  /**
   * 当前URL
   */
  current_url: string;
  /**
   * 路径名
   */
  pathname: string;
  /**
   * 主机名
   */
  hostname: string;
  /**
   * 协议
   */
  protocol: string;
  /**
   * 端口
   */
  port?: string;
  /**
   * 搜索参数
   */
  search?: string;
  /**
   * 哈希
   */
  hash?: string;

  /**
   * 文档URL
   */
  document_url: string;
  /**
   * 来源URL
   */
  referrer_url: string;
  /**
   * 内容类型
   */
  content_type: string;
  /**
   * 文档标题
   */
  document_title: string;
  /**
   * 文档字符集
   */
  document_charset: string;
  /**
   * 文档就绪状态
   */
  document_ready_state?: string;

  /**
   * 屏幕宽度
   */
  screen_width: number;
  /**
   * 屏幕高度
   */
  screen_height: number;
  /**
   * 可用屏幕宽度
   */
  screen_available_width: number;
  /**
   * 可用屏幕高度
   */
  screen_available_height: number;
  /**
   * 屏幕颜色深度
   */
  screen_color_depth: number;

  /**
   * 滚动X坐标
   */
  scroll_x: number;
  /**
   * 滚动Y坐标
   */
  scroll_y: number;

  /**
   * 国家
   */
  country?: string;
  /**
   * 地区
   */
  region?: string;
  /**
   * 城市
   */
  city?: string;

  /**
   * 开始时间
   */
  begin_time: number;
  /**
   * 其他属性
   */
  [propName: string]: unknown;
}

/**
 * 检测浏览器信息（公共函数）
 * @param {string} userAgent - 用户代理字符串
 * @returns {BrowserDetectionResult} 浏览器检测结果
 */
function detectBrowser(userAgent: string): BrowserDetectionResult {
  let name = "unknown";
  let version = "0";
  let major = "0";
  let engine = "Unknown";
  let engineVersion = "0";

  if (/Chrome/.test(userAgent)) {
    name = "Chrome";
    version = userAgent.match(/Chrome\/(\d+)/)?.[1] || "0";
    major = version;
    engine = "Blink";
  } else if (/Firefox/.test(userAgent)) {
    name = "Firefox";
    version = userAgent.match(/Firefox\/(\d+)/)?.[1] || "0";
    major = version;
    engine = "Gecko";
  } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    name = "Safari";
    version = userAgent.match(/Version\/(\d+)/)?.[1] || "0";
    major = version;
    engine = "WebKit";
  } else if (/Edge/.test(userAgent)) {
    name = "Edge";
    version = userAgent.match(/Edge\/(\d+)/)?.[1] || "0";
    major = version;
    engine = "Blink";
  } else if (/MSIE|Trident/.test(userAgent)) {
    name = "Internet Explorer";
    version = userAgent.match(/MSIE\s(\d+)|rv:(\d+)/)?.[1] || "0";
    major = version;
    engine = "Trident";
  }

  if (engine === "WebKit") {
    engineVersion = userAgent.match(/WebKit\/(\d+)/)?.[1] || "0";
  } else if (engine === "Gecko") {
    engineVersion = userAgent.match(/Gecko\/(\d+)/)?.[1] || "0";
  }

  return { name, version, major, engine, engineVersion };
}

/**
 * 检测设备类型（公共函数）
 * @param {string} userAgent - 用户代理字符串
 * @returns {DeviceDetectionResult} 设备检测结果
 */
function detectDevice(userAgent: string): DeviceDetectionResult {
  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/.test(userAgent) &&
    !/iPad/.test(userAgent);
  const isTablet =
    /iPad/.test(userAgent) ||
    (/Android/.test(userAgent) && !/Mobile/.test(userAgent));
  const isDesktop = !isMobile && !isTablet;

  let type: "mobile" | "tablet" | "desktop" | "unknown" = "unknown";
  if (isMobile) type = "mobile";
  else if (isTablet) type = "tablet";
  else if (isDesktop) type = "desktop";

  return { isMobile, isTablet, isDesktop, type };
}

/**
 * 解析浏览器信息（保留以兼容旧代码）
 * @param {string} userAgent - 用户代理字符串
 * @returns {BrowserInfo} 浏览器信息
 */
function parseBrowserInfo(userAgent: string): BrowserInfo {
  const result = detectBrowser(userAgent);
  return {
    name: result.name,
    major: result.major,
    engine: result.engine,
    engineVersion: result.engineVersion,
  };
}

/**
 * 解析设备类型（保留以兼容旧代码）
 * @param {string} userAgent - 用户代理字符串
 * @returns {DeviceType} 设备类型
 */
function parseDeviceType(userAgent: string): DeviceType {
  const result = detectDevice(userAgent);
  return {
    isMobile: result.isMobile,
    isTablet: result.isTablet,
    isDesktop: result.isDesktop,
  };
}

/**
 * 获取基本浏览器信息
 * @returns {Object} 基本浏览器信息
 */
function getBasicBrowserInfo(): {
  app_code_name: string;
  app_name: string;
  language: string;
  platform: string;
  browser_version: string | undefined;
  user_agent: string;
} {
  if (!isBrowser() || typeof navigator === "undefined") {
    return {
      app_code_name: "",
      app_name: "",
      language: "",
      platform: "",
      browser_version: "",
      user_agent: "non-browser",
    };
  }

  return {
    app_code_name: navigator.appCodeName,
    app_name: navigator.appName,
    language: navigator.language,
    platform: navigator.platform,
    browser_version: navigator.appVersion,
    user_agent: navigator.userAgent,
  };
}

/**
 * 获取浏览器详细信息
 * @param {string} userAgent - 用户代理字符串
 * @returns {Object} 浏览器详细信息
 */
function getDetailedBrowserInfo(userAgent: string): {
  browser_name: string;
  browser_major_version: string;
  engine_name: string;
  engine_version: string;
} {
  const browserInfo = parseBrowserInfo(userAgent);
  return {
    browser_name: browserInfo.name,
    browser_major_version: browserInfo.major,
    engine_name: browserInfo.engine,
    engine_version: browserInfo.engineVersion,
  };
}

/**
 * 获取设备信息
 * @param {string} userAgent - 用户代理字符串
 * @returns {Object} 设备信息
 */
function getDeviceInfo(userAgent: string): {
  is_mobile: boolean;
  is_tablet: boolean;
  is_desktop: boolean;
  device_width: number;
  device_height: number;
  device_pixel_ratio: number;
} {
  if (!isBrowser() || typeof window === "undefined") {
    return {
      is_mobile: false,
      is_tablet: false,
      is_desktop: true,
      device_width: 0,
      device_height: 0,
      device_pixel_ratio: 1,
    };
  }

  const deviceType = parseDeviceType(userAgent);
  return {
    is_mobile: deviceType.isMobile,
    is_tablet: deviceType.isTablet,
    is_desktop: deviceType.isDesktop,
    device_width: window.innerWidth,
    device_height: window.innerHeight,
    device_pixel_ratio: window.devicePixelRatio,
  };
}

/**
 * 获取网络状态信息
 * @returns {Object} 网络状态信息
 */
function getNetworkInfo(): {
  is_online: boolean;
  connection_type: string;
  downlink: number | undefined;
  effective_type: string | undefined;
  rtt: number | undefined;
} {
  if (!isBrowser() || typeof navigator === "undefined") {
    return {
      is_online: true,
      connection_type: "unknown",
      downlink: undefined,
      effective_type: undefined,
      rtt: undefined,
    };
  }

  return {
    is_online: navigator.onLine,
    connection_type:
      (navigator as unknown as { connection?: NetworkConnection }).connection
        ?.type || "unknown",
    downlink: (navigator as unknown as { connection?: NetworkConnection })
      .connection?.downlink,
    effective_type: (navigator as unknown as { connection?: NetworkConnection })
      .connection?.effectiveType,
    rtt: (navigator as unknown as { connection?: NetworkConnection }).connection
      ?.rtt,
  };
}

/**
 * 获取屏幕信息
 * @returns {Object} 屏幕信息
 */
function getScreenInfo(): {
  screen_width: number;
  screen_height: number;
  screen_available_width: number;
  screen_available_height: number;
  screen_color_depth: number;
} {
  if (!isBrowser() || typeof screen === "undefined") {
    return {
      screen_width: 0,
      screen_height: 0,
      screen_available_width: 0,
      screen_available_height: 0,
      screen_color_depth: 0,
    };
  }

  return {
    screen_width: screen.width,
    screen_height: screen.height,
    screen_available_width: screen.availWidth,
    screen_available_height: screen.availHeight,
    screen_color_depth: screen.colorDepth,
  };
}

/**
 * 获取页面信息
 * @returns {Object} 页面信息
 */
function getPageInfo(): {
  current_url: string;
  pathname: string;
  hostname: string;
  protocol: string;
  port: string;
  search: string;
  hash: string;
  document_url: string;
  referrer_url: string;
  content_type: string;
  document_title: string;
  document_charset: string;
  document_ready_state: string;
} {
  if (
    !isBrowser() ||
    typeof window === "undefined" ||
    typeof document === "undefined"
  ) {
    return {
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
    };
  }

  return {
    current_url: window.location.href,
    pathname: window.location.pathname,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    port: window.location.port,
    search: window.location.search,
    hash: window.location.hash,
    document_url: document.URL,
    referrer_url: document.referrer,
    content_type: document.contentType || "",
    document_title: document.title,
    document_charset: document.characterSet || document.charset || "",
    document_ready_state: document.readyState,
  };
}

/**
 * 获取滚动位置信息
 * @returns {Object} 滚动位置信息
 */
function getScrollInfo(): {
  scroll_x: number;
  scroll_y: number;
} {
  if (
    !isBrowser() ||
    typeof window === "undefined" ||
    typeof document === "undefined"
  ) {
    return {
      scroll_x: 0,
      scroll_y: 0,
    };
  }

  return {
    scroll_x: window.pageXOffset || document.documentElement.scrollLeft || 0,
    scroll_y: window.pageYOffset || document.documentElement.scrollTop || 0,
  };
}

/**
 * 浏览器工具函数
 */
export const browserUtils = {
  /**
   * 检测浏览器类型
   * @returns {Object} 浏览器信息
   * @returns {string} name - 浏览器名称
   * @returns {string} version - 浏览器版本
   * @returns {string} platform - 平台
   */
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

  /**
   * 检测设备类型
   * @returns {('mobile'|'tablet'|'desktop'|'unknown')} 设备类型
   */
  getDeviceType: (): "mobile" | "tablet" | "desktop" | "unknown" => {
    if (!isBrowser() || typeof navigator === "undefined") {
      return "unknown";
    }

    const result = detectDevice(navigator.userAgent);
    return result.type;
  },

  /**
   * 检测网络状态
   * @returns {Object} 网络状态
   * @returns {('online'|'offline')} type - 网络类型
   * @returns {('2g'|'3g'|'4g'|'5g'|'unknown')} effectiveType - 有效网络类型
   * @returns {number} rtt - 往返时间
   * @returns {number} downlink - 下行速度
   */
  getNetworkState: (): {
    type: "online" | "offline";
    effectiveType: "2g" | "3g" | "4g" | "5g" | "unknown";
    rtt: number;
    downlink: number;
  } => {
    if (!isBrowser() || typeof navigator === "undefined") {
      return {
        type: "offline",
        effectiveType: "unknown",
        rtt: 0,
        downlink: 0,
      };
    }

    const type = navigator.onLine ? "online" : "offline";
    let effectiveType: "2g" | "3g" | "4g" | "5g" | "unknown" = "unknown";
    let rtt = 0;
    let downlink = 0;

    if ("connection" in navigator) {
      const connection = (
        navigator as unknown as { connection?: NetworkConnection }
      ).connection;
      effectiveType =
        (connection?.effectiveType as "2g" | "3g" | "4g" | "5g" | "unknown") ||
        "unknown";
      rtt = connection?.rtt || 0;
      downlink = connection?.downlink || 0;
    }

    return {
      type,
      effectiveType,
      rtt,
      downlink,
    };
  },
};

/**
 * 存储工具函数
 */
export const storageUtils = {
  /**
   * 安全获取本地存储
   * @param {string} key - 存储键
   * @param {Function} [parser] - 解析函数
   * @returns {unknown} 存储值
   */
  get: (key: string, parser?: (value: string) => unknown): unknown => {
    if (!isBrowser() || typeof localStorage === "undefined") {
      return null;
    }
    try {
      const value = localStorage.getItem(key);
      if (value === null) return null;
      return parser ? parser(value) : value;
    } catch {
      return null;
    }
  },

  /**
   * 安全设置本地存储
   * @param {string} key - 存储键
   * @param {unknown} value - 存储值
   * @returns {boolean} 是否设置成功
   */
  set: (key: string, value: unknown): boolean => {
    if (!isBrowser() || typeof localStorage === "undefined") {
      return false;
    }
    try {
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 安全移除本地存储
   * @param {string} key - 存储键
   * @returns {boolean} 是否移除成功
   */
  remove: (key: string): boolean => {
    if (!isBrowser() || typeof localStorage === "undefined") {
      return false;
    }
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 安全清空本地存储
   * @returns {boolean} 是否清空成功
   */
  clear: (): boolean => {
    if (!isBrowser() || typeof localStorage === "undefined") {
      return false;
    }
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * 获取浏览器数据
 * @returns {BrowserData} 浏览器数据
 */
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
    // 如果获取某些信息失败，返回基本数据
    return {
      device_id: getDeviceId(),
      event: "pageview",
      user_agent: navigator?.userAgent || "unknown",
      device_width: window?.innerWidth || 0,
      device_height: window?.innerHeight || 0,
      is_online: navigator?.onLine || false,
      connection_type:
        (navigator as unknown as { connection?: NetworkConnection })?.connection
          ?.type || "unknown",
      downlink: (navigator as unknown as { connection?: NetworkConnection })
        ?.connection?.downlink,
      effective_type: (
        navigator as unknown as { connection?: NetworkConnection }
      )?.connection?.effectiveType,
      rtt: (navigator as unknown as { connection?: NetworkConnection })
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
      document_ready_state: document?.readyState || "loading",
      screen_width: screen?.width || 0,
      screen_height: screen?.height || 0,
      screen_available_width: screen?.availWidth || 0,
      screen_available_height: screen?.availHeight || 0,
      screen_color_depth: screen?.colorDepth || 0,
      scroll_x:
        window?.pageXOffset || document?.documentElement?.scrollLeft || 0,
      scroll_y:
        window?.pageYOffset || document?.documentElement?.scrollTop || 0,
      begin_time: Date.now(),
    };
  }
}

/**
 * 浏览器插件
 */
export const browserPlugin: IPlugin = {
  name: "browser",
  version: "1.0.0",
  description:
    "Browser information plugin for collecting browser data and device information",
  priority: 30,

  /**
   * 事件跟踪前回调
   */
  onTrack<T extends EventProperties>(payload: Payload<T>): Payload<T> {
    // 添加浏览器数据到事件属性
    try {
      const browserData = getBrowserData();
      // 只添加部分关键的浏览器信息，避免事件过大
      const browserContext = {
        browser_name: browserData.browser_name,
        browser_version: browserData.browser_version,
        device_type: browserData.is_mobile
          ? "mobile"
          : browserData.is_tablet
            ? "tablet"
            : "desktop",
        platform: browserData.platform,
        user_agent: browserData.user_agent,
        screen_width: browserData.screen_width,
        screen_height: browserData.screen_height,
        is_online: browserData.is_online,
        connection_type: browserData.connection_type,
        current_url: browserData.current_url,
        referrer_url: browserData.referrer_url,
      };

      return {
        ...payload,
        properties: {
          ...payload.properties,
          ...browserContext,
        } as unknown as T,
      };
    } catch (error) {
      // 如果获取浏览器数据失败，返回原始payload
      return payload;
    }
  },

  /**
   * 获取插件信息
   */
  getInfo(): Record<string, any> {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      browserData: getBrowserData(),
      browserUtils: browserUtils.getBrowser(),
      deviceType: browserUtils.getDeviceType(),
      networkState: browserUtils.getNetworkState(),
    };
  },
};
