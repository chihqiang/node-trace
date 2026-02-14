/**
 * Import Dexie database library
 */
import Dexie, { Table } from "dexie";
/**
 * Import event payload type
 */
import { Payload } from "./types";

/**
 * NodeTrace database class
 * Extends Dexie for storing offline events
 */
class NodeTraceDB extends Dexie {
  /**
   * Offline events table
   */
  offlineEvents!: Table<Payload>;

  /**
   * Constructor
   */
  constructor() {
    super("nodeTraceDb");
    this.version(1).stores({
      offlineEvents: "id, event, timestamp",
    });
  }
}


/**
 * Database instance
 */
const db = new NodeTraceDB();

/**
 * Dexie storage class
 * Used for managing offline event storage operations
 */
export class DexieStorage {
  private writeBuffer: Payload[] = [];
  private writeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly WRITE_BUFFER_SIZE = 100;
  private readonly WRITE_BUFFER_TIMEOUT = 5000;

  /**
   * Get all offline events
   * @returns Offline events array
   */
  async all(): Promise<Payload[]> {
    try {
      return await db.offlineEvents.toArray();
    } catch {
      return [];
    }
  }

  /**
   * Add offline events
   * @param events - Events array to add
   */
  async add(events: Payload[]): Promise<void> {
    this.writeBuffer.push(...events);

    if (this.writeBuffer.length >= this.WRITE_BUFFER_SIZE) {
      await this.flushBuffer();
    } else {
      this.scheduleFlush();
    }
  }

  /**
   * Clear all offline events
   */
  async clear(): Promise<void> {
    try {
      await db.offlineEvents.clear();
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Delete offline events by ID
   * @param ids - Event IDs array to delete
   */
  async delete(ids: string[]): Promise<void> {
    try {
      if (ids.length > 0) {
        await db.offlineEvents.bulkDelete(ids);
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Flush write buffer to database
   */
  private async flushBuffer(): Promise<void> {
    if (this.writeBuffer.length === 0) return;

    const eventsToWrite = this.writeBuffer.splice(0);
    try {
      await db.offlineEvents.bulkAdd(eventsToWrite);
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Schedule buffer flush
   */
  private scheduleFlush(): void {
    if (this.writeTimer) return;
    this.writeTimer = setTimeout(() => {
      this.flushBuffer();
      this.writeTimer = null;
    }, this.WRITE_BUFFER_TIMEOUT);
  }

  /**
   * Force flush buffer immediately
   */
  async forceFlush(): Promise<void> {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    await this.flushBuffer();
  }
}


/**
 * Dexie storage instance
 */
export const DB = new DexieStorage();