/**
 * 用户管理插件
 * 负责设备ID和用户ID的生成、存储和管理
 */

import { isBrowser } from "../utils";
import { handleBrowserError, handleStorageError } from "../error";
import { storageUtils } from "./browser";
import type { IPlugin, EventProperties, Payload } from "../types";

/**
 * 扩展的 Navigator 接口
 */
interface ExtendedNavigator extends Navigator {
  deviceMemory?: number;
}

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
 * 默认设备ID长度
 */
const DEFAULT_DEVICE_ID_LENGTH = 32;

/**
 * 生成SHA-256哈希
 * @param {string} input - 输入字符串
 * @returns {Promise<string>} SHA-256哈希值
 */
async function generateSHA256Hash(input: string): Promise<string> {
  if (isBrowser() && typeof crypto !== "undefined" && crypto.subtle) {
    // 浏览器环境使用Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } else if (!isBrowser() && typeof require !== "undefined") {
    // Node.js环境使用crypto模块
    try {
      const crypto = require("crypto");
      return crypto.createHash("sha256").update(input).digest("hex");
    } catch {
      // 如果crypto模块不可用，使用回退方案
      return simpleHash(input);
    }
  } else {
    // 其他环境使用简单哈希作为回退
    return simpleHash(input);
  }
}

/**
 * 简单哈希函数作为回退（改进版，生成更长的哈希值）
 * @param {string} input - 输入字符串
 * @returns {string} 哈希值
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  // 生成更长的哈希值
  const baseHash = Math.abs(hash).toString(36);

  // 如果哈希值太短，添加额外的随机部分
  if (baseHash.length < DEFAULT_DEVICE_ID_LENGTH) {
    const randomPart = Math.random().toString(36).slice(2, 10);
    return `${baseHash}_${randomPart}`;
  }

  // 确保哈希值至少有32个字符
  return baseHash.substring(0, DEFAULT_DEVICE_ID_LENGTH);
}

/**
 * 同步版本的设备ID生成
 * @returns {string} 设备ID
 */
function generateStableDeviceIdSync(): string {
  if (!isBrowser()) {
    // 非浏览器环境，使用固定的 ID
    if (!nonBrowserDeviceId) {
      // 首次调用时生成一个固定的 ID
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).slice(2, 10);
      nonBrowserDeviceId = `${timestamp}_${random}`;
    }
    return nonBrowserDeviceId;
  }

  try {
    // 收集浏览器特征信息
    const navigatorInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      // 增加更多特征信息，提高唯一性
      vendor: navigator.vendor,
      appVersion: navigator.appVersion,
      product: navigator.product,
      productSub: navigator.productSub,
      // 增加时间戳的哈希，确保即使特征相同也能生成不同的ID
      timestampHash: Math.floor(Date.now() / (24 * 60 * 60 * 1000)).toString(), // 每天一个新的哈希
    };

    // 将特征信息转换为字符串
    const infoString = JSON.stringify(navigatorInfo);

    // 使用简单哈希作为同步回退
    return simpleHash(infoString);
  } catch (error) {
    // 如果获取浏览器信息失败，使用回退方案
    handleBrowserError(error, { context: "device_id_generation" });
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `${timestamp}_${random}`;
  }
}

/**
 * 异步版本的设备ID生成
 * @returns {Promise<string>} 设备ID
 */
async function generateDeviceIdAsync(): Promise<string> {
  if (!isBrowser()) {
    return generateStableDeviceIdSync();
  }

  try {
    // 收集浏览器特征信息
    const navigatorInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      // 增加更多特征信息，提高唯一性
      vendor: navigator.vendor,
      appVersion: navigator.appVersion,
      product: navigator.product,
      productSub: navigator.productSub,
    };

    // 将特征信息转换为字符串
    const infoString = JSON.stringify(navigatorInfo);

    // 使用SHA-256生成哈希
    const hash = await generateSHA256Hash(infoString);
    // 取前32位作为设备ID，确保长度合理
    return hash.substring(0, 32);
  } catch {
    // 如果获取浏览器信息失败，使用同步回退方案
    return generateStableDeviceIdSync();
  }
}

/**
 * 设备ID生成函数
 * @returns {string} 设备ID
 */
function generateStableDeviceId(): string {
  // 优先使用同步版本，确保函数返回类型一致
  return generateStableDeviceIdSync();
}

/**
 * 异步版本的设备ID生成
 * @returns {Promise<string>} 设备ID
 */
export async function generateStableDeviceIdAsync(): Promise<string> {
  return generateDeviceIdAsync();
}

/**
 * 获取设备ID
 * @returns {string} 设备ID
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
 * @param {string} id - 用户ID
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
 * @returns {string} 用户ID
 */
export function getID(): string {
  if (!isBrowser()) {
    return getDeviceId();
  }

  const userId = storageUtils.get(USER_ID_KEY) as string | null;
  if (userId) {
    return userId;
  }
  // 如果没有设置 ID，使用设备唯一标识作为 ID
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
    // 添加用户上下文到 Payload 顶层
    return {
      ...payload,
      device_id: getDeviceId(),
      user_id: getID(),
    };
  },

  /**
   * 获取插件信息
   */
  getInfo(): Record<string, any> {
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
