/**
 * 工具函数模块
 * 包含字符串、数字、对象、数组、时间等常用工具函数
 */

/**
 * 常量定义
 */
export const CONSTANTS = {
  /**
   * 随机字符串默认长度
   */
  RANDOM_STRING_DEFAULT_LENGTH: 8,
  /**
   * 数字格式化默认小数位数
   */
  NUMBER_FORMAT_DEFAULT_DECIMALS: 2
}

/**
 * 字符串工具函数
 */
export const stringUtils = {
  /**
   * 生成随机字符串
   * @param {number} [length=8] - 字符串长度
   * @returns {string} 随机字符串
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
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  uuid: (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  },

  /**
   * 生成事件ID
   * @returns {string} 事件ID
   */
  generateEventId: (): string => {
    const timestamp = now()
    // 格式化为年月日时分毫秒
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0')
    const formattedTime = `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`
    // 生成8位随机字符串
    const randomPart = stringUtils.random(8)
    return `${formattedTime}${randomPart}`
  },

  /**
   * 截断字符串
   * @param {string} str - 原始字符串
   * @param {number} maxLength - 最大长度
   * @param {string} [suffix=...] - 后缀
   * @returns {string} 截断后的字符串
   */
  truncate: (str: string, maxLength: number, suffix: string = '...'): string => {
    if (str.length <= maxLength) return str
    return str.substring(0, maxLength - suffix.length) + suffix
  }
}

/**
 * 数字工具函数
 */
export const numberUtils = {
  /**
   * 限制数字范围
   * @param {number} value - 原始值
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 限制范围内的数字
   */
  clamp: (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max)
  },

  /**
   * 生成随机数字
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 随机数字
   */
  random: (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  },

  /**
   * 格式化数字
   * @param {number} num - 原始数字
   * @param {number} [decimals=2] - 小数位数
   * @returns {string} 格式化后的数字字符串
   */
  format: (num: number, decimals: number = CONSTANTS.NUMBER_FORMAT_DEFAULT_DECIMALS): string => {
    return num.toFixed(decimals)
  }
}

/**
 * 对象工具函数
 */
export const objectUtils = {
  /**
   * 深度合并对象
   * @template T
   * @param {T} target - 目标对象
   * @param {...Record<string, any>} sources - 源对象
   * @returns {T} 合并后的对象
   */
  deepMerge: <T extends Record<string, any>>(target: T, ...sources: Record<string, any>[]): T => {
    if (!sources.length) return target
    
    // 递归合并函数
    const merge = (targetObj: Record<string, any>, sourceObj: Record<string, any>): Record<string, any> => {
      const result = { ...targetObj }
      
      for (const key in sourceObj) {
        if (Object.prototype.hasOwnProperty.call(sourceObj, key)) {
          const sourceValue = sourceObj[key]
          const targetValue = targetObj[key]
          
          if (sourceValue && typeof sourceValue === 'object' && targetValue && typeof targetValue === 'object') {
            // 递归合并对象
            result[key] = merge(targetValue, sourceValue)
          } else {
            // 直接替换值
            result[key] = sourceValue
          }
        }
      }
      
      return result
    }
    
    // 合并所有源对象
    let result = { ...target }
    for (const source of sources) {
      if (source) {
        result = merge(result, source) as typeof result
      }
    }
    
    return result as T
  },

  /**
   * 安全获取对象属性
   * @template T
   * @param {unknown} obj - 目标对象
   * @param {string|string[]} path - 属性路径
   * @param {T} defaultValue - 默认值
   * @returns {T} 获取到的值或默认值
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
   * 移除对象中的空值
   * @param {Record<string, any>} obj - 目标对象
   * @returns {Record<string, any>} 移除空值后的对象
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
 * 数组工具函数
 */
export const arrayUtils = {
  /**
   * 去重
   * @template T
   * @param {T[]} arr - 原始数组
   * @returns {T[]} 去重后的数组
   */
  unique: <T>(arr: T[]): T[] => {
    return [...new Set(arr)]
  },

  /**
   * 随机打乱数组
   * @template T
   * @param {T[]} arr - 原始数组
   * @returns {T[]} 打乱后的数组
   */
  shuffle: <T>(arr: T[]): T[] => {
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  },

  /**
   * 分批处理数组
   * @template T
   * @param {T[]} arr - 原始数组
   * @param {number} size - 每批大小
   * @returns {T[][]} 分批后的数组
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
 * 时间工具函数
 */
export const timeUtils = {
  /**
   * 格式化时间戳
   * @param {number} timestamp - 时间戳
   * @param {string} [format=YYYY-MM-DD HH:mm:ss] - 格式化模板
   * @returns {string} 格式化后的时间字符串
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
   * 计算时间差
   * @param {number} start - 开始时间戳
   * @param {number} end - 结束时间戳
   * @param {('ms'|'s'|'m'|'h'|'d')} [unit=ms] - 时间单位
   * @returns {number} 时间差
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
 * 环境工具函数
 */

/**
 * 检查是否在浏览器环境中
 * @returns {boolean} 是否在浏览器环境中
 */
export const isBrowser = () => typeof window !== "undefined"

/**
 * 获取当前时间戳
 * @returns {number} 当前时间戳
 */
export const now = () => Date.now()
