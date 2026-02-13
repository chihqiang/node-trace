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
    try {
      await db.offlineEvents.bulkAdd(events);
    } catch {
      // Ignore storage errors
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
}


/**
 * Dexie storage instance
 */
export const DB = new DexieStorage();