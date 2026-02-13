/**
 * Utility functions module
 * Contains common utility functions for strings, numbers, objects, arrays, time, etc.
 */

/**
 * Constant definitions
 */
export const CONSTANTS = {
  /**
   * Default length for random string
   */
  RANDOM_STRING_DEFAULT_LENGTH: 8,
  /**
   * Default number of decimal places for number formatting
   */
  NUMBER_FORMAT_DEFAULT_DECIMALS: 2
}

/**
 * String utility functions
 */
export const stringUtils = {
  /**
   * Generate random string
   * @param length - String length
   * @returns Random string
   */
  random: (length: number = CONSTANTS.RANDOM_STRING_DEFAULT_LENGTH): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  /**
   * Generate unique ID
   * @returns Unique ID
   */
  uuid: (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  },

  /**
   * Generate event ID
   * @returns Event ID
   */
  generateEventId: (): string => {
    const timestamp = now()
    // Format as year-month-day-hour-minute-second-millisecond
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() +1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0')
    const formattedTime = `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`
    // Generate 8-character random string
    const randomPart = stringUtils.random(8)
    return `${formattedTime}${randomPart}`
  },

  /**
   * Truncate string
   * @param str - Original string
   * @param maxLength - Maximum length
   * @param suffix - Suffix
   * @returns Truncated string
   */
  truncate: (str: string, maxLength: number, suffix: string = '...'): string => {
    if (str.length <= maxLength) return str
    return str.substring(0, maxLength - suffix.length) + suffix
  }
}

/**
 * Number utility functions
 */
export const numberUtils = {
  /**
   * Clamp number to range
   * @param value - Original value
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Number within range
   */
  clamp: (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max)
  },

  /**
   * Generate random number
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random number
   */
  random: (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min +1)) + min
  },

  /**
   * Format number
   * @param num - Original number
   * @param decimals - Number of decimal places
   * @returns Formatted number string
   */
  format: (num: number, decimals: number = CONSTANTS.NUMBER_FORMAT_DEFAULT_DECIMALS): string => {
    return num.toFixed(decimals)
  }
}

/**
 * Object utility functions
 */
export const objectUtils = {
  /**
   * Deep merge objects
   * @template T
   * @param target - Target object
   * @param sources - Source objects
   * @returns Merged object
   */
  deepMerge: <T extends Record<string, any>>(target: T, ...sources: Record<string, any>[]): T => {
    if (!sources.length) return target
    
    // Recursive merge function
    const merge = (targetObj: Record<string, any>, sourceObj: Record<string, any>): Record<string, any> => {
      const result = { ...targetObj }
      
      for (const key in sourceObj) {
        if (Object.prototype.hasOwnProperty.call(sourceObj, key)) {
          const sourceValue = sourceObj[key]
          const targetValue = targetObj[key]
          
          if (sourceValue && typeof sourceValue === 'object' && targetValue && typeof targetValue === 'object') {
            // Recursively merge objects
            result[key] = merge(targetValue, sourceValue)
          } else {
            // Directly replace value
            result[key] = sourceValue
          }
        }
      }
      
      return result
    }
    
    // Merge all source objects
    let result = { ...target }
    for (const source of sources) {
      if (source) {
        result = merge(result, source) as typeof result
      }
    }
    
    return result as T
  },

  /**
   * Safely get object property
   * @template T
   * @param obj - Target object
   * @param path - Property path
   * @param defaultValue - Default value
   * @returns Retrieved value or default value
   */
  get: <T>(obj: unknown, path: string | string[], defaultValue: T): T => {
    const travel = (regexp: RegExp, obj: unknown, path: string | string[]): unknown => {
      if (obj === null || obj === undefined) {
        return defaultValue
      }
      const objRecord = obj as Record<string, unknown>
      const value = Array.isArray(path)
        ? path.reduce<unknown>((res, key) => (res !== null && res !== undefined ? (res as Record<string, unknown>)[key] : res), objRecord)
        : regexp.test(path)
        ? path.split(regexp).reduce<unknown>((res, key) => (res !== null && res !== undefined ? (res as Record<string, unknown>)[key] : res), objRecord)
        : objRecord[path]
      return value === undefined || value === null ? defaultValue : value
    }
    return travel(/[\[\]\.]+/, obj, path) as T
  },

  /**
   * Remove empty values from object
   * @param obj - Target object
   * @returns Object with empty values removed
   */
  removeEmpty: (obj: Record<string, any>): Record<string, any> => {
    const newObj: Record<string, any> = {}
    Object.keys(obj).forEach(key => {
      if (obj[key] !== null && obj[key] !== undefined) {
        newObj[key] = obj[key]
      }
    })
    return newObj
  }
}

/**
 * Array utility functions
 */
export const arrayUtils = {
  /**
   * Remove duplicates
   * @template T
   * @param arr - Original array
   * @returns Array with duplicates removed
   */
  unique: <T>(arr: T[]): T[] => {
    return [...new Set(arr)]
  },

  /**
   * Shuffle array randomly
   * @template T
   * @param arr - Original array
   * @returns Shuffled array
   */
  shuffle: <T>(arr: T[]): T[] => {
    const result = [...arr]
    for (let i = result.length -1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i +1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  },

  /**
   * Process array in batches
   * @template T
   * @param arr - Original array
   * @param size - Batch size
   * @returns Batched arrays
   */
  chunk: <T>(arr: T[], size: number): T[][] => {
    const result: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size))
    }
    return result
  }
}

/**
 * Time utility functions
 */
export const timeUtils = {
  /**
   * Format timestamp
   * @param timestamp - Timestamp
   * @param format - Format template
   * @returns Formatted time string
   */
  format: (timestamp: number, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  },

  /**
   * Calculate time difference
   * @param start - Start timestamp
   * @param end - End timestamp
   * @param unit - Time unit
   * @returns Time difference
   */
  diff: (start: number, end: number, unit: 'ms' | 's' | 'm' | 'h' | 'd' = 'ms'): number => {
    const diff = end - start
    switch (unit) {
      case 's':
        return diff / 1000
      case 'm':
        return diff / (1000 * 60)
      case 'h':
        return diff / (1000 * 60 * 60)
      case 'd':
        return diff / (1000 * 60 * 60 * 24)
      default:
        return diff
    }
  }
}

/**
 * Environment utility functions
 */

/**
 * Check if running in browser environment
 * @returns Whether running in browser environment
 */
export const isBrowser = () => typeof window !== "undefined"

/**
 * Get current timestamp
 * @returns Current timestamp
 */
export const now = () => Date.now()
