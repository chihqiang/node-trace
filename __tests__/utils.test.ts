import { stringUtils, numberUtils, objectUtils, arrayUtils, timeUtils, isBrowser, now } from '../src/utils';

describe('Utility Functions', () => {
  describe('String Utils', () => {
    test('random should generate a random string of specified length', () => {
      const length = 10;
      const result = stringUtils.random(length);
      expect(typeof result).toBe('string');
      expect(result.length).toBe(length);
    });

    test('random should generate a string with default length if not specified', () => {
      const result = stringUtils.random();
      expect(typeof result).toBe('string');
      expect(result.length).toBe(8); // 默认长度为8
    });

    test('uuid should generate a valid UUID', () => {
      const result = stringUtils.uuid();
      expect(typeof result).toBe('string');
      expect(result.length).toBe(36); // UUID 格式长度为36
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('truncate should truncate a string to specified length', () => {
      const str = 'This is a long string that needs to be truncated';
      const maxLength = 20;
      const result = stringUtils.truncate(str, maxLength);
      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThanOrEqual(maxLength);
      expect(result).toContain('...');
    });

    test('truncate should return the original string if it is shorter than maxLength', () => {
      const str = 'Short string';
      const maxLength = 20;
      const result = stringUtils.truncate(str, maxLength);
      expect(result).toBe(str);
    });
  });

  describe('Number Utils', () => {
    test('clamp should limit a number within specified range', () => {
      expect(numberUtils.clamp(5, 1, 10)).toBe(5);
      expect(numberUtils.clamp(0, 1, 10)).toBe(1);
      expect(numberUtils.clamp(15, 1, 10)).toBe(10);
    });

    test('random should generate a random number within specified range', () => {
      const min = 1;
      const max = 10;
      const result = numberUtils.random(min, max);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    });

    test('format should format a number with specified decimal places', () => {
      const num = 123.456;
      const decimals = 2;
      const result = numberUtils.format(num, decimals);
      expect(typeof result).toBe('string');
      expect(result).toBe('123.46');
    });

    test('format should use default decimal places if not specified', () => {
      const num = 123.456;
      const result = numberUtils.format(num);
      expect(typeof result).toBe('string');
      expect(result).toBe('123.46'); // 默认保留2位小数
    });
  });

  describe('Object Utils', () => {
    test('deepMerge should merge objects deeply', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      const result = objectUtils.deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });

    test('get should safely get a property from an object', () => {
      const obj = { a: { b: { c: 1 } } };
      const result = objectUtils.get(obj, 'a.b.c', 0);
      expect(result).toBe(1);
    });

    test('get should return default value if property does not exist', () => {
      const obj = { a: 1 };
      const defaultValue = 'default';
      const result = objectUtils.get(obj, 'b.c', defaultValue);
      expect(result).toBe(defaultValue);
    });

    test('removeEmpty should remove null and undefined values from an object', () => {
      const obj = { a: 1, b: null, c: undefined, d: 2 };
      const result = objectUtils.removeEmpty(obj);
      expect(result).toEqual({ a: 1, d: 2 });
    });
  });

  describe('Array Utils', () => {
    test('unique should remove duplicates from an array', () => {
      const arr = [1, 2, 2, 3, 3, 3];
      const result = arrayUtils.unique(arr);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([1, 2, 3]);
    });

    test('shuffle should shuffle an array randomly', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = arrayUtils.shuffle(arr);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(arr.length);
      // 验证所有元素都在结果中
      expect(result).toEqual(expect.arrayContaining(arr));
    });

    test('chunk should split an array into chunks of specified size', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7];
      const size = 3;
      const result = arrayUtils.chunk(arr, size);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3); // 7 / 3 = 2余1，所以有3个chunk
      expect(result[0]).toEqual([1, 2, 3]);
      expect(result[1]).toEqual([4, 5, 6]);
      expect(result[2]).toEqual([7]);
    });
  });

  describe('Time Utils', () => {
    test('format should format a timestamp into specified format', () => {
      const timestamp = new Date('2023-01-01T12:00:00').getTime();
      const format = 'YYYY-MM-DD HH:mm:ss';
      const result = timeUtils.format(timestamp, format);
      expect(typeof result).toBe('string');
      expect(result).toBe('2023-01-01 12:00:00');
    });

    test('format should use default format if not specified', () => {
      const timestamp = new Date('2023-01-01T12:00:00').getTime();
      const result = timeUtils.format(timestamp);
      expect(typeof result).toBe('string');
      expect(result).toBe('2023-01-01 12:00:00'); // 默认格式
    });

    test('diff should calculate the difference between two timestamps', () => {
      const start = Date.now();
      const end = start + 1000; // 1秒后
      const result = timeUtils.diff(start, end, 's');
      expect(typeof result).toBe('number');
      expect(result).toBe(1);
    });

    test('diff should use default unit (ms) if not specified', () => {
      const start = Date.now();
      const end = start + 1000; // 1秒后
      const result = timeUtils.diff(start, end);
      expect(typeof result).toBe('number');
      expect(result).toBe(1000);
    });
  });

  describe('Environment Utils', () => {
    test('isBrowser should return boolean', () => {
      const result = isBrowser();
      expect(typeof result).toBe('boolean');
    });

    test('now should return current timestamp', () => {
      const result = now();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });
  });
});
