import { isBrowser } from "../../utils";

export const storageUtils = {
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
