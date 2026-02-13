import { isBrowser } from "../../utils";

/**
 * Basic browser information interface.
 */
export interface BrowserInfo {
  /** Browser name */
  name: string;
  /** Major version number */
  major: string;
  /** Rendering engine name */
  engine: string;
  /** Rendering engine version */
  engineVersion: string;
}

/**
 * Device type information interface.
 */
export interface DeviceType {
  /** Whether the device is mobile */
  isMobile: boolean;
  /** Whether the device is a tablet */
  isTablet: boolean;
  /** Whether the device is desktop */
  isDesktop: boolean;
}

/**
 * Detailed browser detection result interface.
 */
export interface BrowserDetectionResult {
  /** Browser name */
  name: string;
  /** Full version string */
  version: string;
  /** Major version number */
  major: string;
  /** Rendering engine name */
  engine: string;
  /** Rendering engine version */
  engineVersion: string;
}

/**
 * Device detection result interface.
 */
export interface DeviceDetectionResult {
  /** Whether the device is mobile */
  isMobile: boolean;
  /** Whether the device is a tablet */
  isTablet: boolean;
  /** Whether the device is desktop */
  isDesktop: boolean;
  /** Device type category */
  type: "mobile" | "tablet" | "desktop" | "unknown";
}

/**
 * Detects browser information from user agent string.
 * @param userAgent - The user agent string to parse
 * @returns Browser detection result with name, version, and engine info
 */
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

/**
 * Detects device type from user agent string.
 * @param userAgent - The user agent string to parse
 * @returns Device detection result with type information
 */
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

/**
 * Parses basic browser information from user agent string.
 * @param userAgent - The user agent string to parse
 * @returns Simplified browser information
 */
export function parseBrowserInfo(userAgent: string): BrowserInfo {
  const result = detectBrowser(userAgent);
  return {
    name: result.name,
    major: result.major,
    engine: result.engine,
    engineVersion: result.engineVersion,
  };
}

/**
 * Parses device type from user agent string.
 * @param userAgent - The user agent string to parse
 * @returns Device type information
 */
export function parseDeviceType(userAgent: string): DeviceType {
  const result = detectDevice(userAgent);
  return {
    isMobile: result.isMobile,
    isTablet: result.isTablet,
    isDesktop: result.isDesktop,
  };
}

/**
 * Gets basic browser information from the navigator object.
 * @returns Basic browser information including app name, language, platform, etc.
 */
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

/**
 * Gets detailed browser information from user agent string.
 * @param userAgent - The user agent string to parse
 * @returns Detailed browser information with name, version, and engine details
 */
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

/**
 * Gets device information including type and screen dimensions.
 * @param userAgent - The user agent string to parse for device type
 * @returns Device information with type, dimensions, and pixel ratio
 */
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
