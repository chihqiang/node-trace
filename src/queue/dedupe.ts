import type { Payload, EventProperties } from "../types";

/**
 * LRU缓存实现（专门用于字符串键）
 */
export class LRUCache<V> {
  private cache: Map<string, V>;
  private maxSize: number;

  constructor(maxSize: number = 10000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  set(key: string, value: V): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  get(key: string): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
}

/**
 * 生成事件唯一键
 * @param event - 事件对象
 * @returns 事件唯一键
 */
export function generateEventKey<T extends EventProperties>(
  event: Payload<T>,
): string {
  return `${event.id}_${event.event}_${event.timestamp}`;
}

/**
 * 事件去重管理器
 */
export class EventDedupe {
  private cache: LRUCache<boolean>;

  constructor(maxSize: number = 10000) {
    this.cache = new LRUCache<boolean>(maxSize);
  }

  /**
   * 检查事件是否已存在
   */
  exists<T extends EventProperties>(event: Payload<T>): boolean {
    const key = generateEventKey(event);
    return this.cache.has(key);
  }

  /**
   * 添加事件到去重缓存
   */
  add<T extends EventProperties>(event: Payload<T>): void {
    const key = generateEventKey(event);
    this.cache.set(key, true);
  }

  /**
   * 从去重缓存中移除事件
   */
  remove<T extends EventProperties>(event: Payload<T>): void {
    const key = generateEventKey(event);
    this.cache.delete(key);
  }

  /**
   * 批量移除事件
   */
  removeBatch<T extends EventProperties>(events: Payload<T>[]): void {
    events.forEach((event) => this.remove(event));
  }

  /**
   * 清空去重缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size();
  }
}
