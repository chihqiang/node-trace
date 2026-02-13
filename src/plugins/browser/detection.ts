import { isBrowser } from "../../utils";

export interface BrowserInfo {
  name: string;
  major: string;
  engine: string;
  engineVersion: string;
}

export interface DeviceType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface BrowserDetectionResult {
  name: string;
  version: string;
  major: string;
  engine: string;
  engineVersion: string;
}

export interface DeviceDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  type: "mobile" | "tablet" | "desktop" | "unknown";
}

export function detectBrowser(userAgent: string): BrowserDetectionResult {
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

export function detectDevice(userAgent: string): DeviceDetectionResult {
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

export function parseBrowserInfo(userAgent: string): BrowserInfo {
  const result = detectBrowser(userAgent);
  return {
    name: result.name,
    major: result.major,
    engine: result.engine,
    engineVersion: result.engineVersion,
  };
}

export function parseDeviceType(userAgent: string): DeviceType {
  const result = detectDevice(userAgent);
  return {
    isMobile: result.isMobile,
    isTablet: result.isTablet,
    isDesktop: result.isDesktop,
  };
}

export function getBasicBrowserInfo(): {
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

export function getDetailedBrowserInfo(userAgent: string): {
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

export function getDeviceInfo(userAgent: string): {
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
