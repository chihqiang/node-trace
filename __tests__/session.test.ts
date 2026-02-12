// @jest-environment jsdom

import { sessions as sessionManager } from '../src/plugins/session'

// 模拟 localStorage
const mockLocalStorage: Record<string, string> = {};

beforeAll(() => {
  // 确保 window 对象存在
  if (typeof window === 'undefined') {
    global.window = {} as any;
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
});

afterEach(() => {
  jest.clearAllMocks();
  Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
  // 清理定时器，避免测试卡住
  if (sessionManager) {
    sessionManager.clearTimeout();
  }
  // 重置模块，避免状态污染
  jest.resetModules();
});

describe('Session Management', () => {
  test('sessionManager should initialize without errors', () => {
    expect(() => sessionManager.start()).not.toThrow();
  });

  test('getID should return a valid session ID', () => {
    const sessionId = sessionManager.getID();
    expect(typeof sessionId).toBe('string');
    expect(sessionId).not.toBeNull();
    expect(sessionId?.length).toBeGreaterThan(0);
  });

  test('getID should return consistent session ID across multiple calls', () => {
    const sessionId1 = sessionManager.getID();
    const sessionId2 = sessionManager.getID();
    expect(sessionId1).toBe(sessionId2);
  });

  test('getContext should return an object with session information', () => {
    const context = sessionManager.getContext();
    expect(typeof context).toBe('object');
    expect(context).toHaveProperty('session_id');
    expect(context).toHaveProperty('session_start');
    expect(context).toHaveProperty('session_duration');
    expect(context).toHaveProperty('session_page_views');
    expect(context).toHaveProperty('session_events');
    expect(context).toHaveProperty('session_is_new');
  });

  test('updateLastActive should update last active time', () => {
    const initialContext = sessionManager.getContext();
    
    jest.useFakeTimers();
    jest.advanceTimersByTime(1000);
    
    sessionManager.updateLastActive();
    
    const updatedContext = sessionManager.getContext();
    
    expect(typeof updatedContext.session_duration).toBe('number');
    expect(typeof initialContext.session_duration).toBe('number');
    expect(updatedContext.session_duration).toBeGreaterThan(Number(initialContext.session_duration));
    
    jest.useRealTimers();
  });

  test('stop should clear session', () => {
    const sessionIdBefore = sessionManager.getID();
    sessionManager.stop();
    jest.resetModules();
    const { sessions: newSessionManager } = require('../src/plugins/session');
    const sessionIdAfter = newSessionManager.getID();
    expect(sessionIdAfter).not.toBe(sessionIdBefore);
    newSessionManager.clearTimeout();
  });

  test('sessionManager should handle page views increment', () => {
    sessionManager.start();
    sessionManager.incrementPageViews();
    const stats = sessionManager.getStats();
    expect(stats.pageViews).toBe(1);
  });

  test('sessionManager should handle events increment', () => {
    sessionManager.start();
    sessionManager.incrementEvents();
    const stats = sessionManager.getStats();
    expect(stats.events).toBe(1);
  });

  test('sessionManager should return correct session stats', () => {
    sessionManager.start();
    sessionManager.incrementPageViews();
    sessionManager.incrementEvents();
    const stats = sessionManager.getStats();
    expect(typeof stats).toBe('object');
    expect(stats).toHaveProperty('pageViews');
    expect(stats).toHaveProperty('events');
    expect(stats).toHaveProperty('duration');
    expect(stats.pageViews).toBe(1);
    expect(stats.events).toBe(1);
    expect(stats.duration).toBeGreaterThanOrEqual(0);
  });
});
