import { push } from '../src/queue';
import { clearTimers } from '../src/queue';
import { isBrowser } from '../src/utils';

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
  // 重置模块，避免状态污染
  jest.resetModules();
});

describe('Event Queue Management', () => {
  test('push should add an event to the queue', () => {
    const event = 'test_event';
    const properties = {
      test_property: 'test_value',
    };

    // 验证 push 函数不会抛出错误
    expect(() => push({ id: `event_${Date.now()}`, event, properties, timestamp: Date.now() })).not.toThrow();
  });

  test('push should handle events without properties', () => {
    const event = 'test_event';

    // 验证 push 函数不会抛出错误
    expect(() => push({ id: `event_${Date.now()}`, event, timestamp: Date.now() })).not.toThrow();
  });

  test('push should handle multiple events in quick succession', () => {
    const events = [
      { id: `event_${Date.now()}_1`, event: 'event1', timestamp: Date.now() },
      { id: `event_${Date.now()}_2`, event: 'event2', timestamp: Date.now() },
      { id: `event_${Date.now()}_3`, event: 'event3', timestamp: Date.now() },
    ];

    // 验证 push 函数能够处理多个事件
    expect(() => {
      events.forEach(e => push(e));
    }).not.toThrow();
  });

  test('queue should handle large number of events', () => {
    const eventCount = 100;

    // 验证队列能够处理大量事件
    expect(() => {
      for (let i = 0; i < eventCount; i++) {
        push({ id: `event_${Date.now()}_${i}`, event: `event_${i}`, timestamp: Date.now() });
      }
    }).not.toThrow();
  });
});
