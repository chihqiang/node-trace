import { getBrowserData, browserUtils, storageUtils } from '../src/plugins/browser';
import { isBrowser } from '../src/utils';

describe('Browser Data Collection', () => {
  test('getBrowserData should return an object with required properties', () => {
    const browserData = getBrowserData();
    
    // 验证返回对象包含所有必需的属性
    expect(browserData).toHaveProperty('device_id');
    expect(browserData).toHaveProperty('event');
    expect(browserData).toHaveProperty('user_agent');
    expect(browserData).toHaveProperty('device_width');
    expect(browserData).toHaveProperty('device_height');
    expect(browserData).toHaveProperty('is_online');
    expect(browserData).toHaveProperty('connection_type');
    expect(browserData).toHaveProperty('app_code_name');
    expect(browserData).toHaveProperty('app_name');
    expect(browserData).toHaveProperty('language');
    expect(browserData).toHaveProperty('platform');
    expect(browserData).toHaveProperty('time_zone');
    expect(browserData).toHaveProperty('browser_version');
    expect(browserData).toHaveProperty('browser_name');
    expect(browserData).toHaveProperty('browser_major_version');
    expect(browserData).toHaveProperty('engine_name');
    expect(browserData).toHaveProperty('engine_version');
    expect(browserData).toHaveProperty('device_pixel_ratio');
    expect(browserData).toHaveProperty('is_mobile');
    expect(browserData).toHaveProperty('is_tablet');
    expect(browserData).toHaveProperty('is_desktop');
    expect(browserData).toHaveProperty('current_url');
    expect(browserData).toHaveProperty('pathname');
    expect(browserData).toHaveProperty('hostname');
    expect(browserData).toHaveProperty('protocol');
    expect(browserData).toHaveProperty('port');
    expect(browserData).toHaveProperty('search');
    expect(browserData).toHaveProperty('hash');
    expect(browserData).toHaveProperty('document_url');
    expect(browserData).toHaveProperty('referrer_url');
    expect(browserData).toHaveProperty('content_type');
    expect(browserData).toHaveProperty('document_title');
    expect(browserData).toHaveProperty('document_charset');
    expect(browserData).toHaveProperty('document_ready_state');
    expect(browserData).toHaveProperty('screen_width');
    expect(browserData).toHaveProperty('screen_height');
    expect(browserData).toHaveProperty('screen_available_width');
    expect(browserData).toHaveProperty('screen_available_height');
    expect(browserData).toHaveProperty('screen_color_depth');
    expect(browserData).toHaveProperty('scroll_x');
    expect(browserData).toHaveProperty('scroll_y');
    expect(browserData).toHaveProperty('begin_time');
  });

  test('getBrowserData should return consistent device_id', () => {
    const browserData1 = getBrowserData();
    const browserData2 = getBrowserData();
    expect(browserData1.device_id).toBe(browserData2.device_id);
  });

  test('getBrowserData should return correct event type', () => {
    const browserData = getBrowserData();
    expect(browserData.event).toBe('pageview');
  });

  test('getBrowserData should return current timestamp for begin_time', () => {
    const browserData = getBrowserData();
    const now = Date.now();
    // 验证 begin_time 是一个数字，并且接近当前时间（误差在 1000ms 以内）
    expect(typeof browserData.begin_time).toBe('number');
    expect(browserData.begin_time).toBeGreaterThan(0);
    expect(Math.abs(browserData.begin_time - now)).toBeLessThan(1000);
  });

  test('getBrowserData should return correct time_zone', () => {
    const browserData = getBrowserData();
    // 验证 time_zone 是一个字符串
    expect(typeof browserData.time_zone).toBe('string');
    expect(browserData.time_zone.length).toBeGreaterThan(0);
  });

  if (isBrowser()) {
    test('getBrowserData should return correct browser information in browser environment', () => {
      const browserData = getBrowserData();
      // 在浏览器环境中，user_agent 应该不是 'non-browser'
      expect(browserData.user_agent).not.toBe('non-browser');
      // browser_name 应该不是 'non-browser'
      expect(browserData.browser_name).not.toBe('non-browser');
    });
  } else {
    test('getBrowserData should return default values in non-browser environment', () => {
      const browserData = getBrowserData();
      // 在非浏览器环境中，user_agent 应该是 'non-browser'
      expect(browserData.user_agent).toBe('non-browser');
      // browser_name 应该是 'non-browser'
      expect(browserData.browser_name).toBe('non-browser');
      // device_width 和 device_height 应该是 0
      expect(browserData.device_width).toBe(0);
      expect(browserData.device_height).toBe(0);
      // is_mobile 和 is_tablet 应该是 false
      expect(browserData.is_mobile).toBe(false);
      expect(browserData.is_tablet).toBe(false);
      // is_desktop 应该是 true
      expect(browserData.is_desktop).toBe(true);
    });
  }
});

describe('Browser Utils', () => {
  test('browserUtils.getBrowser should return browser information', () => {
    const browserInfo = browserUtils.getBrowser();
    expect(typeof browserInfo).toBe('object');
    expect(browserInfo).toHaveProperty('name');
    expect(browserInfo).toHaveProperty('version');
    expect(browserInfo).toHaveProperty('platform');
  });

  test('browserUtils.getDeviceType should return device type', () => {
    const deviceType = browserUtils.getDeviceType();
    expect(typeof deviceType).toBe('string');
    expect(['mobile', 'tablet', 'desktop', 'unknown']).toContain(deviceType);
  });

  test('browserUtils.getNetworkState should return network state', () => {
    const networkState = browserUtils.getNetworkState();
    expect(typeof networkState).toBe('object');
    expect(networkState).toHaveProperty('type');
    expect(networkState).toHaveProperty('effectiveType');
    expect(networkState).toHaveProperty('rtt');
    expect(networkState).toHaveProperty('downlink');
  });
});

describe('Storage Utils', () => {
  test('storageUtils.get should return null for non-existent key', () => {
    const result = storageUtils.get('non-existent-key');
    expect(result).toBeNull();
  });

  test('storageUtils.set should return boolean', () => {
    const result = storageUtils.set('test-key', 'test-value');
    expect(typeof result).toBe('boolean');
  });

  test('storageUtils.remove should return boolean', () => {
    const result = storageUtils.remove('test-key');
    expect(typeof result).toBe('boolean');
  });

  test('storageUtils.clear should return boolean', () => {
    const result = storageUtils.clear();
    expect(typeof result).toBe('boolean');
  });
});
