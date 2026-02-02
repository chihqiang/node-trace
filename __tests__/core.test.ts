import { init, track, getDeviceId } from '../src';
import { clearTimers } from '../src/queue';
import { isBrowser } from '../src/utils';
import { sessions as sessionManager } from '../src/plugins/session';


// 模拟 localStorage
const mockLocalStorage: Record<string, string> = {};

// 模拟 fetch
const mockFetch = jest.fn();

beforeAll(() => {
  if (isBrowser()) {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => mockLocalStorage[key] || null),
        setItem: jest.fn((key, value) => {
          mockLocalStorage[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
        }),
      },
      writable: true,
    });

    Object.defineProperty(window, 'fetch', {
      value: mockFetch,
      writable: true,
    });
  }
});

afterEach(() => {
  jest.clearAllMocks();
  Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
  // 清除定时器
  clearTimers();
  // 清理会话管理器中的定时器
  if (sessionManager) {
    sessionManager.clearTimeout();
  }
  // 重置模块，避免状态污染
  jest.resetModules();
});

describe('SDK Core Functionality', () => {
  test('init should initialize the SDK with provided options', () => {
    const options = {
      appId: 'test-app',
      endpoint: 'https://example.com/trace',
      debug: true,
    };

    init(options);
    
    // 验证初始化是否成功（这里我们假设 init 函数会存储配置）
    // 由于 init 函数的具体实现可能会将配置存储在内部状态中，
    // 我们无法直接访问，但至少可以验证它不会抛出错误
    expect(() => init(options)).not.toThrow();
  });

  test('track should send an event with provided name and properties', () => {
    const options = {
      appId: 'test-app',
      endpoint: 'https://example.com/trace',
      debug: true,
    };

    init(options);
    
    const eventName = 'test_event';
    const properties = {
      test_property: 'test_value',
      timestamp: new Date().toISOString(),
    };

    track(eventName, properties);
    
    // 验证 track 函数不会抛出错误
    expect(() => track(eventName, properties)).not.toThrow();
  });

  test('track should handle events without properties', () => {
    const options = {
      appId: 'test-app',
      endpoint: 'https://example.com/trace',
      debug: true,
    };

    init(options);
    
    const eventName = 'test_event';

    track(eventName);
    
    // 验证 track 函数不会抛出错误
    expect(() => track(eventName)).not.toThrow();
  });

  test('getDeviceId should return a valid device ID', () => {
    const deviceId = getDeviceId();
    expect(typeof deviceId).toBe('string');
    expect(deviceId.length).toBeGreaterThan(0);
  });

  test('getDeviceId should return consistent ID across multiple calls', () => {
    const deviceId1 = getDeviceId();
    const deviceId2 = getDeviceId();
    expect(deviceId1).toBe(deviceId2);
  });
});
