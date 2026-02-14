# Node-Trace

高性能跨端事件追踪与 RUM（真实用户监控）SDK，支持自动埋点、错误监控与离线重试。

## 特性

- **跨端支持**: 同时支持浏览器和 Node.js 环境
- **自动埋点**: 自动收集用户行为、页面浏览、性能指标、网络请求等数据
- **插件系统**: 灵活的插件架构，支持依赖管理和优先级控制
- **智能队列**: 支持事件去重、优先级队列、批量发送、动态调整
- **离线缓存**: 支持离线事件缓存，网络恢复后自动重试
- **错误监控**: 完善的错误处理和统计系统
- **设备识别**: 基于浏览器指纹的稳定设备ID生成
- **会话管理**: 自动会话创建、维护和超时处理
- **TypeScript**: 完整的类型定义，提供优秀的开发体验

## 安装

```bash
npm install @chihqiang/node-trace
# 或
pnpm install @chihqiang/node-trace
# 或
yarn add @chihqiang/node-trace
```

## 快速开始

### 基础使用

```typescript
import { init, track, use, plugins } from '@chihqiang/node-trace'

// 初始化 SDK
init({
  appId: 'your-app-id',
  appKey: 'your-app-key',
  endpoint: 'https://your-analytics-api.com/collect',
  debug: true,
  sampleRate: 1,
  batchSize: 20,
  batchInterval: 1000,
  offlineEnabled: true,
  maxQueueSize: 1000,
  retryCount: 3,
  retryInterval: 1000,
})

// 注册内置插件
use(plugins.user)
use(plugins.browser)
use(plugins.session)
use(plugins.behavior)
use(plugins.performance)
use(plugins.pageview)
use(plugins.network)
use(plugins.error)

// 追踪自定义事件
track('button_click', {
  button_name: 'submit',
  page: '/checkout',
  category: 'user_action'
})
```

### 浏览器环境使用

```html
<script src="https://cdn.jsdelivr.net/npm/@chihqiang/node-trace/dist/index.global.js"></script>
<script>
  NodeTrace.init({
    appId: 'your-app-id',
    endpoint: 'https://your-analytics-api.com/collect'
  })
  
  NodeTrace.use(NodeTrace.plugins.user)
  NodeTrace.use(NodeTrace.plugins.browser)
  
  NodeTrace.track('page_view', {
    title: document.title
  })
</script>
```

## API 文档

### 初始化

```typescript
init(options: Options): void
```

配置选项：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| appId | string | - | 应用 ID（必填） |
| appKey | string | '' | 应用密钥 |
| endpoint | string | - | 数据上报接口地址（必填） |
| debug | boolean | false | 是否开启调试模式 |
| sampleRate | number | 1 | 采样率（0-1） |
| blacklist | string[] | [] | 事件黑名单 |
| whitelist | string[] | - | 事件白名单 |
| batchSize | number | 20 | 批量发送大小 |
| batchInterval | number | 1000 | 批量发送间隔（毫秒） |
| offlineEnabled | boolean | false | 是否启用离线缓存 |
| maxQueueSize | number | 1000 | 最大队列大小 |
| retryCount | number | 3 | 重试次数 |
| retryInterval | number | 1000 | 重试间隔（毫秒） |
| headers | Record<string, string> | {} | 请求头 |
| timeout | number | 30000 | 请求超时时间（毫秒） |
| beforeSend | function | - | 发送前回调 |

### 事件追踪

```typescript
track<T extends EventProperties>(event: string, properties?: T): void
```

追踪自定义事件：

```typescript
track('purchase', {
  product_id: '12345',
  price: 99.99,
  currency: 'USD'
})
```

### 插件管理

```typescript
use(plugin: IPlugin): void
```

注册插件：

```typescript
use(plugins.user)
use(plugins.browser)
```

### 用户管理

```typescript
// 获取设备 ID
getDeviceId(): string

// 设置用户 ID
setID(id: string): void

// 获取用户 ID
getID(): string

// 清除用户 ID
clearID(): void

// 异步生成稳定的设备 ID
generateStableDeviceIdAsync(): Promise<string>
```

### 浏览器数据

```typescript
// 获取浏览器数据
getBrowserData(): BrowserData

// 浏览器工具方法
browserUtils.getBrowser()
browserUtils.getDeviceType()
browserUtils.getNetworkState()
```

### 队列管理

```typescript
// 手动刷新队列
flush(): Promise<void>

// 清除所有定时器
clearTimers(): void
```

### 会话管理

```typescript
// 获取会话管理器
sessions.getID(): string
sessions.getStartTime(): number
sessions.getDuration(): number
sessions.isNew(): boolean
sessions.getStats(): { pageViews: number; events: number; duration: number }
```

### 行为追踪

```typescript
// 获取行为管理器
behaviors.getPath(): BehaviorStep[]
behaviors.getRecent(limit?: number): BehaviorStep[]
behaviors.getStats(): { totalSteps: number; uniqueEvents: number; averageTimeBetweenSteps: number }
behaviors.getContext(): EventProperties
behaviors.analyze(): { mostFrequentEvents: Array<{ event: string; count: number }>; commonPaths: Array<{ path: string; count: number }>; averageSessionDuration: number }
```

## 内置插件

### User Plugin

用户管理插件，负责设备 ID 和用户 ID 的生成、存储和管理。

```typescript
use(plugins.user)
```

**功能**:
- 基于浏览器指纹生成稳定的设备 ID
- 用户 ID 的设置和获取
- 自动为所有事件添加设备 ID 和用户 ID

### Browser Plugin

浏览器数据收集插件，自动收集浏览器环境信息。

```typescript
use(plugins.browser)
```

**功能**:
- 设备信息（屏幕分辨率、像素比等）
- 浏览器信息（类型、版本、引擎等）
- 网络信息（连接类型、速度等）
- 页面信息（URL、标题、引用来源等）
- 自动为所有事件添加浏览器数据

### Session Plugin

会话管理插件，负责会话创建、维护和超时处理。

```typescript
use(plugins.session)
```

**功能**:
- 自动创建和维护会话
- 30 分钟无活动自动超时
- 记录会话统计数据（页面浏览数、事件数、持续时间）
- 自动为所有事件添加会话信息

### Behavior Plugin

行为追踪插件，负责追踪用户行为和页面浏览。

```typescript
use(plugins.behavior)
```

**功能**:
- 记录用户行为路径
- 行为统计分析
- 最近行为追踪
- 自动为所有事件添加行为上下文

### Performance Plugin

性能监控插件，负责收集页面性能数据。

```typescript
use(plugins.performance)
```

**功能**:
- 页面加载时间
- 首字节时间（TTFB）
- DOM 解析时间
- 首次绘制时间（FP）
- 首次内容绘制时间（FCP）
- 资源加载统计

### Pageview Plugin

页面浏览插件，负责监控和追踪页面浏览事件。

```typescript
use(plugins.pageview)
```

**功能**:
- 自动追踪页面浏览事件
- 监听路由变化（hashchange、popstate、pushState、replaceState）
- 依赖 session 和 behavior 插件

### Network Plugin

网络监控插件，负责监控和追踪网络请求。

```typescript
use(plugins.network)
```

**功能**:
- 自动监控 XMLHttpRequest 请求
- 自动监控 fetch 请求
- 记录请求方法、URL、状态、耗时等
- 自动排除 SDK 自己的上报请求

### Error Plugin

错误监控插件，负责捕获和处理错误。

```typescript
use(plugins.error)
```

**功能**:
- 捕获 JavaScript 错误
- 捕获 Promise 错误
- 捕获资源加载错误
- 完善的错误分类和统计

## 自定义插件

```typescript
import { use } from '@chihqiang/node-trace'
import type { IPlugin, IPluginContext, Payload, EventProperties } from '@chihqiang/node-trace'

const customPlugin: IPlugin = {
  name: 'custom',
  version: '1.0.0',
  description: '自定义插件',
  priority: 10,
  dependencies: ['user'],
  
  setup(context: IPluginContext) {
    console.log('插件初始化')
  },
  
  onTrack<T extends EventProperties>(payload: Payload<T>): Payload<T> {
    console.log('事件追踪前', payload)
    return payload
  },
  
  onTracked<T extends EventProperties>(payload: Payload<T>): void {
    console.log('事件追踪后', payload)
  },
  
  beforeSend<T extends EventProperties>(events: Payload<T>[]): Payload<T>[] {
    console.log('发送前', events.length)
    return events
  },
  
  afterSend<T extends EventProperties>(events: Payload<T>[], success: boolean): void {
    console.log('发送后', success)
  }
}

use(customPlugin)
```

## 高级特性

### 智能队列管理

- **事件去重**: 自动过滤重复事件
- **优先级队列**: 根据事件类型设置优先级
- **动态调整**: 根据队列压力动态调整批量大小和发送间隔
- **离线缓存**: 网络断开时自动缓存事件
- **自动重试**: 发送失败时自动重试，支持指数退避

### 插件生命周期

插件支持完整的生命周期钩子：

- `beforeInit`: 初始化前
- `setup`: 设置
- `init`: 初始化
- `activate`: 激活
- `afterInit`: 初始化后
- `onTrack`: 事件追踪前
- `onTracked`: 事件追踪后
- `beforeSend`: 发送前
- `afterSend`: 发送后
- `deactivate`: 停用
- `destroy`: 销毁
- `beforeDestroy`: 销毁前
- `afterDestroy`: 销毁后

### 错误处理

SDK 提供完善的错误处理机制：

```typescript
import {
  captureError,
  handleNetworkError,
  handleStorageError,
  handleBrowserError,
  handlePluginError
} from '@chihqiang/node-trace'

// 捕获错误
captureError('network', '请求失败', error, { url: 'xxx' }, 'error')

// 处理特定类型错误
handleNetworkError(error, { context: 'upload' })
handleStorageError(error, { key: 'user_id' })
handleBrowserError(error, { context: 'fingerprint' })
handlePluginError(error, { plugin: 'custom' })
```

## License

[Apache-2.0](https://github.com/chihqiang/node-trace/blob/main/LICENSE)

## 作者

zhiqiang

## 链接

- [GitHub](https://github.com/chihqiang/node-trace)
- [Issues](https://github.com/chihqiang/node-trace/issues)
