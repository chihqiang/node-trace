// @jest-environment jsdom

// 模拟 utils 模块
jest.mock('../src/utils', () => ({
  ...jest.requireActual('../src/utils'),
  isBrowser: jest.fn(() => true),
}));

// 然后导入其他模块
import { behaviors as behaviorManager } from '../src/plugins/behavior'
import { sessions as sessionManager } from '../src/plugins/session'
import { clearTimers } from '../src/queue'

// 模拟 localStorage
const mockLocalStorage: Record<string, string> = {};

// 模拟 window 和相关 API
beforeAll(() => {
  // 确保 window 对象存在
  if (typeof window === 'undefined') {
    global.window = {} as any;
    global.document = {} as any;
  }

  // 模拟 localStorage
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

  // 模拟 location
  Object.defineProperty(window, 'location', {
    value: {
      pathname: '/test',
      href: 'https://example.com/test',
    },
    writable: true,
  });

  // 模拟 referrer
  Object.defineProperty(document, 'referrer', {
    value: 'https://google.com',
    writable: true,
  });
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
  // 清理行为管理器中的定时器
  behaviorManager.clearTimeouts();
  // 重置模块，避免状态污染
  jest.resetModules();
});

describe('Behavior Tracking', () => {
  test('behaviorManager should initialize without errors', () => {
    expect(() => behaviorManager.init()).not.toThrow();
  });

  test('track should record a behavior event', () => {
    const event = 'test_event';
    const properties = {
      test_property: 'test_value',
    };

    expect(() => behaviorManager.track(event, properties)).not.toThrow();
  });

  test('track should handle events without properties', () => {
    const event = 'test_event';

    expect(() => behaviorManager.track(event)).not.toThrow();
  });

  test('trackView should record a page view event', () => {
    const properties = {
      page_title: 'Test Page',
    };

    expect(() => behaviorManager.trackView(properties)).not.toThrow();
  });

  test('trackView should handle page views without properties', () => {
    expect(() => behaviorManager.trackView()).not.toThrow();
  });

  test('getContext should return an object with behavior information', () => {
    const context = behaviorManager.getContext();
    expect(typeof context).toBe('object');
    expect(context).toHaveProperty('behavior_steps');
    expect(context).toHaveProperty('behavior_unique_events');
    expect(context).toHaveProperty('behavior_avg_time_between_steps');
    expect(context).toHaveProperty('last_event');
    expect(context).toHaveProperty('last_event_time');
  });

  test('clear should clear behavior path', () => {
    behaviorManager.track('event1');
    behaviorManager.track('event2');
    
    behaviorManager.clear();
    
    const steps = behaviorManager.getPath();
    expect(steps.length).toBe(0);
  });

  test('behaviorManager should return recent behaviors', () => {
    for (let i = 0; i < 5; i++) {
      behaviorManager.track(`event_${i}`);
    }
    
    const recentBehaviors = behaviorManager.getRecent(3);
    expect(recentBehaviors.length).toBeLessThanOrEqual(3);
  });

  test('behaviorManager should return behavior stats', () => {
    behaviorManager.track('event1');
    behaviorManager.track('event2');
    
    const pathLengthBefore = behaviorManager.getPath().length;
    console.log('Path length before trackView:', pathLengthBefore);
    
    behaviorManager.trackView();
    
    const pathLengthAfter = behaviorManager.getPath().length;
    console.log('Path length after trackView:', pathLengthAfter);
    
    const behaviorPath = behaviorManager.getPath();
    console.log('Behavior path:', behaviorPath);
    
    const stats = behaviorManager.getStats();
    console.log('Behavior stats:', stats);
    
    expect(typeof stats).toBe('object');
    expect(stats).toHaveProperty('totalSteps');
    expect(stats).toHaveProperty('uniqueEvents');
    expect(stats).toHaveProperty('averageTimeBetweenSteps');
    expect(stats.totalSteps).toBeGreaterThanOrEqual(3);
  });
});
