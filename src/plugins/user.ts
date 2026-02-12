/**
 * 用户管理插件
 * 负责设备ID和用户ID的生成、存储和管理
 */

import { isBrowser } from "../utils";
import { handleBrowserError, handleStorageError } from "../error";
import { storageUtils } from "./browser";
import type { IPlugin, EventProperties, Payload } from "../types";

/**
 * 设备ID存储键
 */
const DEVICE_ID_KEY = "__analytics_device_id__";

/**
 * 用户ID存储键
 */
const USER_ID_KEY = "__analytics_user_id__";

/**
 * 存储非浏览器环境的设备 ID
 */
let nonBrowserDeviceId: string | null = null;

/**
 * 缓存浏览器设备ID
 */
let cachedBrowserDeviceId: string | null = null;

/**
 * 默认设备ID长度
 */
const DEFAULT_DEVICE_ID_LENGTH = 32;

/**
 * 扩展的 Navigator 接口
 */
interface ExtendedNavigator extends Navigator {
  deviceMemory?: number;
}

/**
 * 生成SHA-256哈希
 * @param input - 输入字符串
 * @returns SHA-256哈希值
 */
async function generateSHA256Hash(input: string): Promise<string> {
  if (isBrowser() && typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } else if (!isBrowser() && typeof require !== "undefined") {
    try {
      const crypto = require("crypto");
      return crypto.createHash("sha256").update(input).digest("hex");
    } catch {
      return improvedHash(input);
    }
  } else {
    return improvedHash(input);
  }
}

/**
 * 改进的哈希函数（使用 FNV-1a 算法）
 * @param input - 输入字符串
 * @returns 哈希值
 */
function improvedHash(input: string): string {
  const FNV_PRIME = 0x01000193;
  const FNV_OFFSET_BASIS = 0x811c9dc5;

  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }

  const hashStr = (hash >>> 0).toString(36);

  if (hashStr.length >= DEFAULT_DEVICE_ID_LENGTH) {
    return hashStr.substring(0, DEFAULT_DEVICE_ID_LENGTH);
  }

  const randomPart = Math.random().toString(36).slice(2, 10);
  const combined = `${hashStr}_${randomPart}`;
  return combined.substring(0, DEFAULT_DEVICE_ID_LENGTH);
}

/**
 * 收集浏览器指纹信息
 * @returns 浏览器指纹信息字符串
 */
function collectBrowserFingerprint(): string {
  if (!isBrowser()) {
    return "non-browser";
  }

  try {
    const extendedNavigator = navigator as ExtendedNavigator;
    const fingerprint = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: extendedNavigator.deviceMemory || 0,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      vendor: navigator.vendor,
      appVersion: navigator.appVersion,
      product: navigator.product,
      productSub: navigator.productSub,
    };

    return JSON.stringify(fingerprint);
  } catch (error) {
    handleBrowserError(error, { context: "fingerprint_collection" });
    return "fallback-fingerprint";
  }
}

/**
 * 同步版本的设备ID生成
 * @returns 设备ID
 */
function generateStableDeviceIdSync(): string {
  if (!isBrowser()) {
    if (!nonBrowserDeviceId) {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).slice(2, 10);
      nonBrowserDeviceId = `${timestamp}_${random}`;
    }
    return nonBrowserDeviceId;
  }

  if (cachedBrowserDeviceId) {
    return cachedBrowserDeviceId;
  }

  try {
    const fingerprint = collectBrowserFingerprint();
    const deviceId = improvedHash(fingerprint);
    cachedBrowserDeviceId = deviceId;
    return deviceId;
  } catch (error) {
    handleBrowserError(error, { context: "device_id_generation" });
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    const fallbackId = `${timestamp}_${random}`;
    cachedBrowserDeviceId = fallbackId;
    return fallbackId;
  }
}

/**
 * 异步版本的设备ID生成
 * @returns 设备ID
 */
async function generateDeviceIdAsync(): Promise<string> {
  if (!isBrowser()) {
    return generateStableDeviceIdSync();
  }

  if (cachedBrowserDeviceId) {
    return cachedBrowserDeviceId;
  }

  try {
    const fingerprint = collectBrowserFingerprint();
    const hash = await generateSHA256Hash(fingerprint);
    const deviceId = hash.substring(0, DEFAULT_DEVICE_ID_LENGTH);
    cachedBrowserDeviceId = deviceId;
    return deviceId;
  } catch (error) {
    handleBrowserError(error, { context: "device_id_generation_async" });
    return generateStableDeviceIdSync();
  }
}

/**
 * 设备ID生成函数（同步）
 * @returns 设备ID
 */
function generateStableDeviceId(): string {
  return generateStableDeviceIdSync();
}

/**
 * 异步版本的设备ID生成
 * @returns 设备ID
 */
export async function generateStableDeviceIdAsync(): Promise<string> {
  return generateDeviceIdAsync();
}

/**
 * 获取设备ID
 * @returns 设备ID
 */
export function getDeviceId(): string {
  if (!isBrowser()) {
    return generateStableDeviceId();
  }

  const existingId = storageUtils.get(DEVICE_ID_KEY) as string | null;
  if (existingId) {
    return existingId;
  }

  const newId = generateStableDeviceId();
  const success = storageUtils.set(DEVICE_ID_KEY, newId);
  if (!success) {
    handleStorageError(new Error("Failed to set device ID in localStorage"), {
      key: DEVICE_ID_KEY,
      operation: "set",
    });
  }
  return newId;
}

/**
 * 设置用户ID
 * @param id - 用户ID
 */
export function setID(id: string): void {
  if (!isBrowser()) {
    return;
  }

  const success = storageUtils.set(USER_ID_KEY, id);
  if (!success) {
    handleStorageError(new Error("Failed to set user ID in localStorage"), {
      key: USER_ID_KEY,
      operation: "set",
    });
  }
}

/**
 * 获取用户ID
 * @returns 用户ID
 */
export function getID(): string {
  if (!isBrowser()) {
    return getDeviceId();
  }

  const userId = storageUtils.get(USER_ID_KEY) as string | null;
  if (userId) {
    return userId;
  }
  return getDeviceId();
}

/**
 * 清除用户ID
 */
export function clearID(): void {
  if (!isBrowser()) {
    return;
  }

  const success = storageUtils.remove(USER_ID_KEY);
  if (!success) {
    handleStorageError(
      new Error("Failed to remove user ID from localStorage"),
      { key: USER_ID_KEY, operation: "remove" },
    );
  }
}

/**
 * 用户插件
 */
export const userPlugin: IPlugin = {
  name: "user",
  version: "1.0.0",
  description:
    "User management plugin for device ID and user ID generation and management",
  priority: 10,

  /**
   * 事件跟踪前回调
   */
  onTrack<T extends EventProperties>(payload: Payload<T>): Payload<T> {
    return {
      ...payload,
      device_id: getDeviceId(),
      user_id: getID(),
    };
  },

  /**
   * 获取插件信息
   */
  getInfo(): Record<string, unknown> {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      deviceId: getDeviceId(),
      userId: getID(),
      isBrowser: isBrowser(),
    };
  },
};
