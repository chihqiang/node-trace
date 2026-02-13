import { isBrowser } from "../../utils";

export const storageUtils = {
  /**
   * Gets a value from localStorage
   * @param key - The storage key name
   * @param parser - Optional parser function to parse the stored string value
   * @returns The stored value, or null if not found or an error occurs
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
   * Sets a value in localStorage
   * @param key - The storage key name
   * @param value - The value to store, non-string values will be converted to JSON string
   * @returns true if operation succeeds, false if it fails
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
   * Removes a value from localStorage by key
   * @param key - The key name to remove
   * @returns true if operation succeeds, false if it fails
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
   * Clears all data from localStorage
   * @returns true if operation succeeds, false if it fails
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
