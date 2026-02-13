import type { Payload, EventProperties } from "../types";

/**
 * LRU cache implementation (specifically for string keys)
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
 * Generate event unique key
 * @param event - Event object
 * @returns Event unique key
 */
export function generateEventKey<T extends EventProperties>(
  event: Payload<T>,
): string {
  return `${event.id}_${event.event}_${event.timestamp}`;
}

/**
 * Event deduplication manager
 */
export class EventDedupe {
  private cache: LRUCache<boolean>;

  constructor(maxSize: number = 10000) {
    this.cache = new LRUCache<boolean>(maxSize);
  }

  /**
   * Check if event already exists
   */
  exists<T extends EventProperties>(event: Payload<T>): boolean {
    const key = generateEventKey(event);
    return this.cache.has(key);
  }

  /**
   * Add event to deduplication cache
   */
  add<T extends EventProperties>(event: Payload<T>): void {
    const key = generateEventKey(event);
    this.cache.set(key, true);
  }

  /**
   * Remove event from deduplication cache
   */
  remove<T extends EventProperties>(event: Payload<T>): void {
    const key = generateEventKey(event);
    this.cache.delete(key);
  }

  /**
   * Batch remove events
   */
  removeBatch<T extends EventProperties>(events: Payload<T>[]): void {
    events.forEach((event) => this.remove(event));
  }

  /**
   * Clear deduplication cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size();
  }
}
