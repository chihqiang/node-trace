import { getDeviceId, setID, getID, clearID } from '../src/plugins/user';

// 模拟 localStorage
const mockLocalStorage: Record<string, string> = {};

// 模拟 window 和 localStorage
beforeAll(() => {
  Object.defineProperty(global, 'window', {
    value: {},
    writable: true,
  });
  
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
  
  // 确保 localStorage 在全局范围内可用
  Object.defineProperty(global, 'localStorage', {
    value: window.localStorage,
    writable: true,
  });
});

afterEach(() => {
  jest.clearAllMocks();
  Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
});

describe('Device ID and User ID', () => {
  test('getDeviceId should return a string', () => {
    const deviceId = getDeviceId();
    expect(typeof deviceId).toBe('string');
    expect(deviceId.length).toBeGreaterThan(0);
  });

  test('getDeviceId should return the same ID when called multiple times', () => {
    const deviceId1 = getDeviceId();
    const deviceId2 = getDeviceId();
    expect(deviceId1).toBe(deviceId2);
  });

  test('setID should store user ID in localStorage', () => {
    const testId = 'test-user-id';
    setID(testId);
    
    expect(localStorage.setItem).toHaveBeenCalledWith('__analytics_user_id__', testId);
  });

  test('getID should return the stored user ID', () => {
    const testId = 'test-user-id';
    mockLocalStorage['__analytics_user_id__'] = testId;
    
    const userId = getID();
    expect(userId).toBe(testId);
  });

  test('getID should return device ID when no user ID is set', () => {
    const deviceId = getDeviceId();
    const userId = getID();
    expect(userId).toBe(deviceId);
  });

  test('clearID should remove user ID from localStorage', () => {
    const testId = 'test-user-id';
    mockLocalStorage['__analytics_user_id__'] = testId;
    
    clearID();
    
    expect(localStorage.removeItem).toHaveBeenCalledWith('__analytics_user_id__');
    
    const userId = getID();
    const deviceId = getDeviceId();
    expect(userId).toBe(deviceId);
  });
});
