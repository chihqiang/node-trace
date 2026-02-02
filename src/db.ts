/**
 * 导入Dexie数据库库
 */
import Dexie, { Table } from "dexie";
/**
 * 导入事件负载类型
 */
import { Payload } from "./types";

/**
 * NodeTrace数据库类
 * 扩展自Dexie，用于存储离线事件
 */
class NodeTraceDB extends Dexie {
  /**
   * 离线事件表
   */
  offlineEvents!: Table<Payload>;

  /**
   * 构造函数
   */
  constructor() {
    super("nodeTraceDb");
    this.version(1).stores({
      offlineEvents: "id, event, timestamp",
    });
  }
}


/**
 * 数据库实例
 */
const db = new NodeTraceDB();

/**
 * Dexie存储类
 * 用于管理离线事件的存储操作
 */
export class DexieStorage {
  /**
   * 获取所有离线事件
   * @returns {Promise<Payload[]>} 离线事件数组
   */
  async all(): Promise<Payload[]> {
    try {
      return await db.offlineEvents.toArray();
    } catch {
      return [];
    }
  }

  /**
   * 添加离线事件
   * @param {Payload[]} events - 要添加的事件数组
   * @returns {Promise<void>}
   */
  async add(events: Payload[]): Promise<void> {
    try {
      await db.offlineEvents.bulkAdd(events);
    } catch {
      // 忽略存储错误
    }
  }

  /**
 * 清除所有离线事件
 * @returns {Promise<void>}
 */
async clear(): Promise<void> {
  try {
    await db.offlineEvents.clear();
  } catch {
    // 忽略存储错误
  }
}

/**
 * 根据ID删除离线事件
 * @param {string[]} ids - 要删除的事件ID数组
 * @returns {Promise<void>}
 */
async delete(ids: string[]): Promise<void> {
  try {
    if (ids.length > 0) {
      await db.offlineEvents.bulkDelete(ids);
    }
  } catch {
    // 忽略存储错误
  }
}
}


/**
 * Dexie存储实例
 */
export const DB = new DexieStorage();