# Node-Trace

高性能跨端事件追踪与 RUM（真实用户监控）SDK，支持自动埋点、错误监控与离线重试。

## 功能特性

### 🚀 核心功能

- **事件追踪**：支持自定义事件追踪，可携带丰富的事件属性
- **设备标识**：自动生成并持久化设备 ID，确保用户行为可追踪
- **浏览器数据**：自动收集浏览器环境信息，包括设备、屏幕、网络等
- **错误监控**：自动捕获 JavaScript 错误和 Promise 未处理异常
- **离线重试**：网络离线时缓存事件，恢复后自动重试发送
- **采样率控制**：支持事件采样，减少数据量
- **黑白名单**：支持事件黑白名单，精确控制需要追踪的事件
- **会话管理**：自动管理用户会话，包括会话 ID 生成、超时处理和上下文收集
- **行为追踪**：记录用户行为路径，包括页面浏览、点击和滚动事件
- **队列管理**：批量发送事件，优化网络请求，支持手动刷新和离线恢复
- **插件系统**：可扩展的插件架构，支持自定义插件和生命周期钩子

### ⚡ 性能优化

- **初始化状态检查**：避免重复初始化会话和行为管理器
- **插件排序缓存**：避免每次 `track` 调用时重复排序插件
- **计算结果缓存**：缓存队列压力和动态队列大小计算结果
- **网络状态缓存**：避免频繁检查网络状态
- **内存缓存**：减少存储操作次数，提高响应速度
- **节流机制**：优化行为路径存储，避免频繁写入
- **深合并优化**：减少内存使用，提高对象合并效率

### 📦 技术特性

- **跨端兼容**：支持浏览器和 Node.js 环境
- **TypeScript**：完全使用 TypeScript 开发，类型安全
- **轻量小巧**：打包后体积小，性能影响微乎其微
- **ES 模块**：支持 ES 模块、CommonJS 和 IIFE 多种格式
- **可扩展**：插件化架构，易于扩展功能

## 快速开始

## 安装

```bash
pnpm add https://github.com/chihqiang/node-trace.git
```

### 基本使用

#### ES 模块

```javascript
import { init, track } from '@chihqiang/node-trace';

// 初始化
init({
  appId: 'your-app-id',
  endpoint: 'https://your-api-endpoint.com/track',
  debug: true // 开发环境启用调试
});

// 发送事件（user_id 会由 userPlugin 自动添加）
track('user_login', {
  login_method: 'email',
  timestamp: new Date().toISOString()
});
```

#### CommonJS

```javascript
const { init, track } = require('@chihqiang/node-trace');

// 初始化
init({
  appId: 'your-app-id',
  endpoint: 'https://your-api-endpoint.com/track'
});

// 发送事件
track('page_view', {
  page_url: window.location.href,
  referrer: document.referrer
});
```

#### IIFE (浏览器直接使用)

```javascript
// 全局变量为 nodeTrace
nodeTrace.init({
  appId: 'your-app-id',
  endpoint: 'https://your-api-endpoint.com/track'
});

nodeTrace.track('button_click', {
  button_id: 'submit-btn',
  page: 'login'
});
```

### 高级使用

#### 设备 ID

```javascript
import { getDeviceId } from '@chihqiang/node-trace';

// 获取设备 ID
const deviceId = getDeviceId();
console.log('Device ID:', deviceId);

// 发送事件（device_id 会由 userPlugin 自动添加）
track('user_activity', {
  action: 'browse'
});
```

#### 浏览器数据

```javascript
import { getBrowserData } from '@chihqiang/node-trace';

// 获取浏览器数据
const browserData = getBrowserData();
console.log('Browser Data:', browserData);

// 发送页面浏览事件
track('page_view', browserData);
```

#### 会话管理

```javascript
import { sessions } from '@chihqiang/node-trace';

// 获取会话 ID
const sessionId = sessions.getID();
console.log('Session ID:', sessionId);

// 获取会话上下文
const sessionContext = sessions.getContext();
console.log('Session Context:', sessionContext);

// 手动结束会话
sessions.stop();
```

#### 行为追踪

```javascript
import { behaviors } from '@chihqiang/node-trace';

// 发送行为事件
behaviors.track('user_click', {
  element_id: 'submit-btn',
  action: 'click',
  timestamp: new Date().toISOString()
});

// 获取行为上下文
const behaviorContext = behaviors.getContext();
console.log('Behavior Context:', behaviorContext);

// 清除行为路径
behaviors.clear();
```

#### 使用插件

```javascript
import { init, use } from '@chihqiang/node-trace';
import { 
  errorPlugin, 
  performancePlugin, 
  pageviewPlugin, 
  behaviorPlugin, 
  networkPlugin,
  sessionPlugin,
  browserPlugin,
  userPlugin 
} from '@chihqiang/node-trace/dist/plugins';

// 初始化
init({
  appId: 'your-app-id',
  endpoint: 'https://your-api-endpoint.com/track'
});

// 使用插件
use(errorPlugin);         // 错误监控插件
use(performancePlugin);   // 性能监控插件
use(pageviewPlugin);      // 页面浏览插件
use(behaviorPlugin);      // 行为追踪插件
use(networkPlugin);       // 网络请求插件
use(sessionPlugin);       // 会话管理插件
use(browserPlugin);       // 浏览器信息插件
use(userPlugin);          // 用户管理插件
```

## API 文档

### init(options)

初始化 SDK

**参数**

- `options` (Object): 配置选项
  - `appId` (String): 应用 ID
  - `appKey` (String, 可选): 应用密钥
  - `endpoint` (String): 事件上报接口
  - `debug` (Boolean, 可选): 是否开启调试模式
  - `sampleRate` (Number, 可选): 采样率，0-1 之间
  - `blacklist` (Array<String>, 可选): 事件黑名单
  - `whitelist` (Array<String>, 可选): 事件白名单
  - `batchSize` (Number, 可选): 批量发送的事件数量
  - `batchInterval` (Number, 可选): 批量发送的时间间隔（毫秒）
  - `offlineEnabled` (Boolean, 可选): 是否启用离线缓存
  - `maxQueueSize` (Number, 可选): 最大队列大小
  - `retryCount` (Number, 可选): 重试次数
  - `retryInterval` (Number, 可选): 重试间隔（毫秒）
  - `headers` (Object, 可选): 自定义请求头
  - `timeout` (Number, 可选): 请求超时时间（毫秒）
  - `beforeSend` (Function, 可选): 事件发送前的回调函数

### track(event, properties)

发送事件

**参数**

- `event` (String): 事件名称
- `properties` (Object, 可选): 事件属性

### use(plugin)

使用插件

**参数**

- `plugin` (Object): 插件对象，需实现 `IPlugin` 接口

### flush()

手动触发事件队列刷新

### getDeviceId()

获取设备 ID

### getBrowserData()

获取浏览器环境数据

### 会话管理 API

会话管理功能通过 `sessions` 实例提供。

#### 获取会话 ID

```javascript
import { sessions } from '@chihqiang/node-trace';

const sessionId = sessions.getID();
console.log('Session ID:', sessionId);
```

#### 获取会话上下文

```javascript
const sessionContext = sessions.getContext();
console.log('Session Context:', sessionContext);
```

#### 更新会话活动状态

```javascript
sessions.updateLastActive();
```

#### 结束会话

```javascript
sessions.stop();
```

#### 获取会话统计

```javascript
const stats = sessions.getStats();
console.log('Session Stats:', stats);
```

### 行为追踪 API

行为追踪功能通过 `behaviors` 实例提供。

#### 发送行为事件

```javascript
import { behaviors } from '@chihqiang/node-trace';

behaviors.track('user_click', {
  element_id: 'submit-btn',
  action: 'click',
  timestamp: new Date().toISOString()
});
```

#### 发送页面浏览事件

```javascript
behaviors.trackView({
  path: window.location.pathname,
  referrer: document.referrer,
  timestamp: new Date().toISOString()
});
```

#### 获取行为上下文

```javascript
const behaviorContext = behaviors.getContext();
console.log('Behavior Context:', behaviorContext);
```

#### 清除行为路径

```javascript
behaviors.clear();
```

#### 获取行为路径

```javascript
const behaviorPath = behaviors.getPath();
console.log('Behavior Path:', behaviorPath);
```

#### 获取最近的行为

```javascript
const recentBehaviors = behaviors.getRecent(10);
console.log('Recent Behaviors:', recentBehaviors);
```

#### 获取行为统计

```javascript
const behaviorStats = behaviors.getBehaviorStats();
console.log('Behavior Stats:', behaviorStats);
```

### 队列管理 API

#### restoreOfflineEvents()

恢复离线事件

```javascript
import { restoreOfflineEvents } from '@chihqiang/node-trace';

// 恢复离线缓存的事件
restoreOfflineEvents();
```

#### clearTimers()

清除所有计时器

```javascript
import { clearTimers } from '@chihqiang/node-trace';

// 清除所有未处理的计时器
clearTimers();
```

##### 插件系统

#### 插件上下文

Node-Trace 提供了强大的插件上下文系统，允许插件通过上下文访问其他插件的功能，而不需要使用全局变量。

**插件上下文接口**

```typescript
interface IPluginContext {
  getPlugins(): any;
  getPlugin(name: string): IPlugin | null;
  getAllPlugins(): IPlugin[];
  callPluginMethod(pluginName: string, methodName: string, ...args: any[]): any;
}
```

**使用插件上下文**

```javascript
import type { IPlugin, IPluginContext } from '@chihqiang/node-trace';

const myPlugin: IPlugin = {
  name: 'my-plugin',
  dependencies: ['session', 'behavior'], // 声明依赖的插件
  
  // 插件初始化，接收上下文参数
  setup(context: IPluginContext) {
    console.log('My plugin setup');
    
    // 获取其他插件实例
    const sessionPlugin = context.getPlugin('session');
    const behaviorPlugin = context.getPlugin('behavior');
    
    const sessions = sessionPlugin?.state?.sessions;
    const behaviors = behaviorPlugin?.state?.behaviors;
    
    const sessionId = sessions?.getID();
    console.log('Session ID:', sessionId);
    
    const behaviorContext = behaviors?.getContext();
    console.log('Behavior Context:', behaviorContext);
  },
  
  // 事件追踪前处理
  onTrack(payload) {
    // 可以修改 payload 或返回 null 阻止事件发送
    payload.properties = {
      ...payload.properties,
      custom_property: 'custom_value'
    };
    return payload;
  },
  
  // 批量发送前处理
  beforeSend(events) {
    // 可以修改事件数组
    return events;
  }
};

// 使用插件
use(myPlugin);
```

### 内置插件

#### errorPlugin

- **功能**：自动捕获 JavaScript 错误和 Promise 未处理异常
- **事件**：
  - `js_error`：JavaScript 错误
  - `promise_error`：Promise 未处理异常



#### performancePlugin

- **功能**：自动收集页面加载性能数据和资源加载性能数据
- **事件**：
  - `page_performance`：页面加载性能数据
  - `resource_performance`：资源加载性能数据
- **数据**：
  - 页面加载时间、首字节时间、解析 DOM 时间
  - 重定向时间、DNS 查询时间、TCP 连接时间、SSL 握手时间
  - 首屏时间、首次内容绘制时间
  - 资源加载统计（脚本、样式表、图片、字体等）

#### pageviewPlugin

- **功能**：自动发送页面浏览事件，支持路由变化监听
- **事件**：
  - `page_view`：页面浏览事件
- **特性**：
  - 支持 hash 模式路由变化
  - 支持 history 模式路由变化
  - 自动收集页面 URL、路径、标题、来源等信息

#### behaviorPlugin

- **功能**：自动跟踪用户行为，如点击和滚动
- **事件**：
  - `click`：用户点击事件
  - `scroll`：用户滚动事件
- **数据**：
  - 点击事件：元素信息、坐标、URL
  - 滚动事件：滚动位置、滚动百分比、URL

#### networkPlugin

- **功能**：自动跟踪 XMLHttpRequest 和 fetch 请求的性能和错误
- **事件**：
  - `network_request`：网络请求事件
- **数据**：
  - 请求方法、URL、状态码、状态文本
  - 请求耗时、请求类型（xhr 或 fetch）
  - 请求是否成功
- **支持**：
  - XMLHttpRequest
  - fetch API

#### sessionPlugin

- **功能**：自动管理用户会话，包括会话 ID 生成、超时处理和上下文收集
- **事件**：
  - `session_start`：会话开始事件
  - `session_end`：会话结束事件
- **数据**：
  - 会话 ID、会话持续时间
  - 会话中的事件数量、页面浏览次数
  - 会话来源 URL、着陆页 URL
- **特性**：
  - 自动生成和管理会话 ID
  - 会话超时检测（默认 30 分钟）
  - 会话上下文收集和更新
  - 支持手动结束会话
- **访问方式**：
  ```javascript
  import { sessions } from '@chihqiang/node-trace';
  // 现在可以调用 sessions 的所有方法
  const sessionId = sessions?.getID();
  const sessionContext = sessions?.getContext();
  sessions?.stop();
  ```

#### behaviorPlugin

- **功能**：自动跟踪用户行为，如点击和滚动
- **事件**：
  - `click`：用户点击事件
  - `scroll`：用户滚动事件
- **数据**：
  - 点击事件：元素信息、坐标、URL
  - 滚动事件：滚动位置、滚动百分比、URL
- **特性**：
  - 自动记录用户行为路径
  - 支持行为上下文收集
  - 支持行为统计和分析
- **访问方式**：
  ```javascript
  import { behaviors } from '@chihqiang/node-trace';
  behaviors?.track('custom_event', { key: 'value' });
  const behaviorContext = behaviors?.getContext();
  behaviors?.clear();
  ```

#### browserPlugin

- **功能**：自动收集浏览器环境信息，包括设备、屏幕、网络等
- **事件**：无（通过 onTrack 钩子为所有事件添加浏览器上下文）
- **数据**：
  - 浏览器信息：名称、版本、引擎
  - 设备信息：设备类型（移动/平板/桌面）、像素比
  - 屏幕信息：宽度、高度、可用尺寸、颜色深度
  - 网络信息：连接类型、下行速度、往返时间
  - URL 信息：当前 URL、路径、来源 URL
  - 文档信息：标题、字符集、准备状态
- **特性**：
  - 自动为所有事件添加浏览器上下文
  - 支持设备类型检测
  - 支持网络状态监控

#### userPlugin

- **功能**：自动管理设备 ID 和用户 ID，确保用户行为可追踪
- **事件**：无（通过 onTrack 钩子为所有事件添加用户上下文）
- **数据**：
  - 设备 ID：自动生成并持久化的设备唯一标识
  - 用户 ID：可自定义的用户标识，未设置时使用设备 ID
- **特性**：
  - 自动生成稳定的设备 ID
  - 支持自定义用户 ID
  - 支持异步生成设备 ID（使用 FingerprintJS）
  - 支持清除用户 ID
- **API**：
  - `getDeviceId()`：获取设备 ID
  - `setID(id)`：设置用户 ID
  - `getID()`：获取用户 ID
  - `clearID()`：清除用户 ID
  - `generateStableDeviceIdAsync()`：异步生成稳定的设备 ID

### 自定义插件

```javascript
import type { IPlugin } from '@chihqiang/node-trace';

const myPlugin: IPlugin = {
  name: 'my-plugin',
  
  // 插件初始化
  setup() {
    console.log('My plugin setup');
  },
  
  // 事件追踪前处理
  onTrack(payload) {
    // 可以修改 payload 或返回 null 阻止事件发送
    payload.properties = {
      ...payload.properties,
      custom_property: 'custom_value'
    };
    return payload;
  },
  
  // 批量发送前处理
  beforeSend(events) {
    // 可以修改事件数组
    return events;
  }
};

// 使用插件
use(myPlugin);
```

## 浏览器支持

- Chrome/Edge (最新 2 个版本)
- Firefox (最新 2 个版本)
- Safari (最新 2 个版本)
- iOS Safari (最新 2 个版本)
- Android Chrome (最新 2 个版本)

## 错误处理

### 内置错误处理

Node-Trace 内置了完善的错误处理机制，确保在各种异常情况下能够稳定运行：

- **存储错误**：当 localStorage 不可用或达到存储限制时，会降级为内存存储
- **网络错误**：当网络请求失败时，会根据配置进行重试或缓存到离线存储
- **插件错误**：当插件执行失败时，会捕获错误并继续执行其他插件
- **会话错误**：当会话管理遇到问题时，会自动创建新会话
- **行为追踪错误**：当行为追踪失败时，会忽略错误并继续运行

### 自定义错误处理

```javascript
import { init } from '@chihqiang/node-trace';

// 初始化时配置错误处理
init({
  appId: 'your-app-id',
  endpoint: 'https://your-api-endpoint.com/track',
  beforeSend: (payload) => {
    // 在发送前检查数据，避免敏感信息
    if (payload.properties && payload.properties.password) {
      delete payload.properties.password;
    }
    return payload;
  }
});
```

## 安全考虑

### 数据安全

- **敏感信息**：避免在事件属性中包含密码、令牌等敏感信息
- **数据最小化**：只发送必要的事件和属性，减少数据传输量
- **HTTPS**：使用 HTTPS 协议传输数据，确保数据传输安全

### 存储安全

- **localStorage 限制**：遵循浏览器的 localStorage 存储限制（通常为 5MB）
- **数据清理**：定期清理过期的存储数据，避免存储溢出
- **隐私保护**：尊重用户隐私，遵循相关数据保护法规

## 最佳实践

### 事件命名规范

- 使用小写字母和下划线命名事件（例如：`user_login`、`page_view`）
- 事件名称应简洁明了，能够清晰表达事件的含义
- 避免使用过长的事件名称，建议不超过 50 个字符

### 属性命名规范

- 使用小写字母和下划线命名属性（例如：`user_id`、`login_method`）
- 属性值应保持一致的类型，避免同一属性有时为字符串有时为数字
- 对于时间戳，建议使用 ISO 8601 格式的字符串（例如：`2023-12-25T10:30:00Z`）

### 性能优化建议

- **批量发送**：使用默认的批量发送机制，避免频繁的网络请求
- **合理设置采样率**：根据业务需求设置合适的采样率，减少数据量
- **使用插件**：根据需要使用内置插件，避免重复实现功能
- **避免在关键路径**：不要在用户交互的关键路径上执行耗时的追踪操作

### 调试技巧

- **启用调试模式**：在开发环境中启用 `debug: true` 选项，查看详细日志
- **使用浏览器控制台**：查看控制台输出的调试信息
- **检查网络请求**：使用浏览器的开发者工具查看发送的网络请求
- **验证事件格式**：确保发送的事件格式符合 API 要求

## 常见问题

### Q: 事件没有发送成功怎么办？

A: 检查以下几点：
1. 确保 `init` 函数被正确调用，并且配置了有效的 `endpoint`
2. 检查网络连接是否正常
3. 查看浏览器控制台是否有错误信息
4. 启用调试模式，查看详细的发送日志

### Q: 如何减少发送的数据量？

A: 可以通过以下方式减少数据量：
1. 设置合适的 `sampleRate` 采样率
2. 使用 `blacklist` 排除不需要的事件
3. 只发送必要的事件属性
4. 合理设置 `batchSize` 和 `batchInterval`

### Q: 如何处理用户隐私？

A: 处理用户隐私时应注意：
1. 遵循相关数据保护法规（如 GDPR、CCPA 等）
2. 获得用户的明确 consent
3. 不发送敏感个人信息
4. 提供数据删除机制

### Q: 如何在单页应用中使用？

A: 在单页应用中使用时：
1. 使用 `pageviewPlugin` 自动跟踪路由变化
2. 或者在路由变化时手动调用 `track('page_view', {...})`
3. 确保在应用初始化时调用 `init` 函数

## 构建与开发

### 安装依赖

```bash
pnpm install
```

### 构建

```bash
pnpm run build
```

### 测试

```bash
# 运行测试
pnpm test

# 启动本地服务器
python3 -m http.server 3000

# 访问测试页面
open http://localhost:3000/index.html
```

## 设备 ID

### 获取设备 ID

```javascript
import { getDeviceId } from '@chihqiang/node-trace';

const deviceId = getDeviceId();
console.log('Device ID:', deviceId);
```

## 用户 ID

### 设置用户 ID

```javascript
import { setID } from '@chihqiang/node-trace';

setID('custom_user_123');
```

### 获取用户 ID

```javascript
import { getID } from '@chihqiang/node-trace';

// 如果没有设置用户 ID，会返回设备唯一标识
const userId = getID();
console.log('User ID:', userId);
```

### 清除用户 ID

```javascript
import { clearID } from '@chihqiang/node-trace';

clearID();
```

## 数据结构

### 事件 payload

```typescript
interface Payload {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  [key: string]: any;  // 扩展参数，插件可以添加额外的字段（如 device_id、user_id 等）
}
```

### 浏览器数据

```typescript
interface BrowserData {
  // 设备信息
  device_id: string;             // 设备 ID
  event: string;                 // 事件名称
  
  // 基本信息
  user_agent: string;            // 用户代理字符串
  device_width: number;          // 窗口宽度
  device_height: number;         // 窗口高度
  is_online: boolean;            // 是否在线
  
  // 网络信息
  connection_type?: string;      // 连接类型
  downlink?: number;             // 网络下行速度（Mbps）
  effective_type?: string;       // 网络连接类型（2g, 3g, 4g）
  rtt?: number;                  // 网络往返时间（毫秒）
  
  // 浏览器信息
  app_code_name: string;         // 应用代码名称
  app_name: string;              // 应用名称
  language: string;              // 浏览器语言
  platform: string;              // 平台
  time_zone: string;             // 时区
  browser_version?: string;      // 浏览器版本
  browser_name?: string;         // 浏览器名称
  browser_major_version?: string; // 浏览器主版本号
  engine_name?: string;          // 浏览器引擎名称
  engine_version?: string;       // 浏览器引擎版本
  
  // 设备信息
  device_pixel_ratio: number;    // 设备像素比
  is_mobile?: boolean;           // 是否为移动设备
  is_tablet?: boolean;           // 是否为平板设备
  is_desktop?: boolean;          // 是否为桌面设备
  
  // URL 信息
  current_url: string;           // 当前 URL
  pathname: string;              // 路径
  hostname: string;              // 主机名
  protocol: string;              // 协议
  port?: string;                 // 端口号
  search?: string;               // 查询字符串
  hash?: string;                 // URL 哈希部分
  
  // 文档信息
  document_url: string;          // 文档 URL
  referrer_url: string;          // 引用 URL
  content_type: string;          // 内容类型
  document_title: string;        // 文档标题
  document_charset: string;      // 文档字符集
  document_ready_state?: string; // 文档准备状态
  
  // 屏幕信息
  screen_width: number;          // 屏幕宽度
  screen_height: number;         // 屏幕高度
  screen_available_width: number; // 屏幕可用宽度
  screen_available_height: number; // 屏幕可用高度
  screen_color_depth: number;    // 屏幕颜色深度
  
  // 滚动信息
  scroll_x: number;              // 水平滚动位置
  scroll_y: number;              // 垂直滚动位置
  
  // 地理位置（预留）
  country?: string;              // 国家
  region?: string;               // 地区
  city?: string;                 // 城市
  
  // 时间信息
  begin_time: number;            // 开始时间戳
  
  // 其他属性
  [propName: string]: unknown;   // 其他自定义属性
}
```

## 参考文档

- **服务端设计方案**: [server.md](server.md) - 详细的服务端架构和功能设计方案

## 许可证

Apache-2.0 License

## 贡献

欢迎提交 Issue 和 Pull Request！
