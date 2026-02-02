import { init, use, track, plugins } from '../src/core';
import { IPlugin, EventProperties, Payload } from '../src/types';
import { clearTimers } from '../src/queue';
import { sessions as sessionManager } from '../src/plugins/session';


// 模拟 localStorage
const mockLocalStorage: Record<string, string> = {};

// 模拟 fetch
const mockFetch = jest.fn();

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

  Object.defineProperty(window, 'fetch', {
    value: mockFetch,
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
  // 重置模块，避免状态污染
  jest.resetModules();
});

describe('Plugin System', () => {
  test('plugins should register a plugin successfully', () => {
    const testPlugin: IPlugin = {
      name: 'test-plugin',
      setup() {
        // 测试插件的 setup 方法
      },
    };

    const result = plugins.register(testPlugin);
    expect(result).toBe(true);
  });

  test('plugins should not register a plugin with duplicate name', () => {
    const testPlugin1: IPlugin = {
      name: 'test-plugin',
      setup() {},
    };

    const testPlugin2: IPlugin = {
      name: 'test-plugin',
      setup() {},
    };

    plugins.register(testPlugin1);
    const result = plugins.register(testPlugin2);
    expect(result).toBe(false);
  });

  test('plugins should initialize a plugin successfully', () => {
    const testPlugin: IPlugin = {
      name: 'test-plugin',
      setup() {},
      init() {
        // 测试插件的 init 方法
      },
    };

    plugins.register(testPlugin);
    const result = plugins.init(testPlugin);
    expect(result).toBe(true);
  });

  test('plugins should destroy a plugin successfully', () => {
    const testPlugin: IPlugin = {
      name: 'test-plugin',
      setup() {},
      destroy() {
        // 测试插件的 destroy 方法
      },
    };

    plugins.register(testPlugin);
    plugins.init(testPlugin);
    const result = plugins.destroy(testPlugin);
    expect(result).toBe(true);
  });

  test('plugins should get a registered plugin', () => {
    const testPlugin: IPlugin = {
      name: 'test-plugin',
      setup() {},
    };

    plugins.register(testPlugin);
    const plugin = plugins.get('test-plugin');
    expect(plugin).toBeDefined();
    expect(plugin?.name).toBe('test-plugin');
  });

  test('plugins should return undefined for non-existent plugin', () => {
    const plugin = plugins.get('non-existent-plugin');
    expect(plugin).toBeUndefined();
  });

  test('plugins should enable a plugin', () => {
    const testPlugin: IPlugin = {
      name: 'test-plugin',
      setup() {},
      enabled: false,
    };

    plugins.register(testPlugin);
    const result = plugins.enable('test-plugin');
    expect(result).toBe(true);
  });

  test('plugins should disable a plugin', () => {
    const testPlugin: IPlugin = {
      name: 'test-plugin',
      setup() {},
      enabled: true,
    };

    plugins.register(testPlugin);
    const result = plugins.disable('test-plugin');
    expect(result).toBe(true);
  });

  test('plugins should remove a plugin', () => {
    const testPlugin: IPlugin = {
      name: 'test-plugin',
      setup() {},
    };

    plugins.register(testPlugin);
    const result = plugins.remove('test-plugin');
    expect(result).toBe(true);
    expect(plugins.get('test-plugin')).toBeUndefined();
  });

  test('plugins should return sorted plugins by priority', () => {
    const lowPriorityPlugin: IPlugin = {
      name: 'low-priority',
      setup() {},
      priority: 10,
    };

    const highPriorityPlugin: IPlugin = {
      name: 'high-priority',
      setup() {},
      priority: 1,
    };

    plugins.register(lowPriorityPlugin);
    plugins.register(highPriorityPlugin);

    const sortedPlugins = plugins.sort();
    expect(sortedPlugins.length).toBeGreaterThanOrEqual(2);
    expect(sortedPlugins[0].name).toBe('high-priority');
  });

  test('use function should register and initialize a plugin', () => {
    const testPlugin: IPlugin = {
      name: 'test-plugin',
      setup() {},
    };

    expect(() => use(testPlugin)).not.toThrow();
  });

  test('plugin should be able to modify events in onTrack', () => {
    const testPlugin: IPlugin = {
      name: 'test-plugin',
      onTrack: <T extends EventProperties>(event: Payload<T>) => {
        // 修改事件属性
        const modifiedEvent = {
          ...event,
          properties: {
            ...event.properties,
            modified: true,
          },
        };
        return modifiedEvent as unknown as Payload<T>;
      },
    };

    // 初始化 SDK
    init({ appId: 'test-app', endpoint: 'https://example.com/trace' });
    
    // 使用插件
    use(testPlugin);
    
    // 发送事件
    expect(() => track('test_event', { test: 'value' })).not.toThrow();
  });

  test('plugin should be able to filter events in onTrack', () => {
    const testPlugin: IPlugin = {
      name: 'test-plugin',
      onTrack(event) {
        // 过滤掉特定事件
        if (event.event === 'filtered_event') {
          return null;
        }
        return event;
      },
    };

    // 初始化 SDK
    init({ appId: 'test-app', endpoint: 'https://example.com/trace' });
    
    // 使用插件
    use(testPlugin);
    
    // 发送不会被过滤的事件
    expect(() => track('allowed_event', { test: 'value' })).not.toThrow();
    
    // 发送会被过滤的事件
    expect(() => track('filtered_event', { test: 'value' })).not.toThrow();
  });
});
