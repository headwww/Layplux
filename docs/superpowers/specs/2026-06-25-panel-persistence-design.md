# 面板持久化管理设计

## 概述

Layplux 不再自行序列化/反序列化面板状态，而是通过 **事件产出状态** 和 **配置注入初始状态** 两个接口，将序列化工作交给使用者。这样 Layplux 不耦合任何存储方案（localStorage、IndexedDB、服务端等）。

## 设计目标

1. 尺寸、视图模式、激活状态变化时统一产出事件
2. 支持通过 `useSkeleton({ initialState })` 注入初始状态
3. 尺寸拖拽等高频变化做防抖处理
4. 初始状态中若包含已不存在的 widget key，自动忽略

## 状态结构

```ts
export interface SkeletonState {
  /** 左侧面板宽度 (px)，默认 340 */
  leftWidth: number;
  /** 右侧面板宽度 (px)，默认 340 */
  rightWidth: number;
  /** 底部面板高度 (px)，默认 300 */
  bottomHeight: number;
  /** 左侧内部上下分割比例 (0~1)，默认 0.5 */
  leftSplitRatio: number;
  /** 右侧内部上下分割比例 (0~1)，默认 0.5 */
  rightSplitRatio: number;
  /** 底部内部左右分割比例 (0~1)，默认 0.5 */
  bottomSplitRatio: number;
  /** 每个 panel widget 的视图模式，key 为 widget name */
  viewModes: Record<string, ViewMode>;
  /** 每个区域当前激活的 widget name，key 为 area name */
  activeIds: Record<string, string | null>;
}
```

## API

### useSkeleton 扩展

```ts
interface SkeletonOptions {
  initialState?: Partial<SkeletonState>;
}

function useSkeleton(options?: SkeletonOptions): ISkeleton
```

### ISkeleton 扩展

```ts
interface ISkeleton {
  // ...现有字段
  /** 获取当前完整状态快照 */
  getState(): SkeletonState;
}
```

### 事件

```
事件名: skeleton:state-changed
载荷: SkeletonState（完整当前状态快照）
```

**防抖规则：**
- 尺寸/分割比例变化：`skeleton:state-changed` 防抖 300ms
- 视图模式、激活状态变化：`skeleton:state-changed` 立即触发

内部使用不同变更类型共用同一个事件名。使用者只需监听一个事件，不需要区分高频/低频。

### 合并逻辑

`initialState` 中的字段按如下规则合并：

1. `initialState` 中存在的顶层字段 → 覆盖默认值
2. `initialState` 中不存在的顶层字段 → 使用内置默认值
3. `viewModes` 和 `activeIds` 中的 key 在注册的 widgets 中不存在时 → 忽略该 key
4. `viewModes` 中 widget 存在但 key 缺失 → 该 widget 使用 `DockPinned` 默认值
5. `activeIds` 中 area 存在但 key 缺失 → 该 area 使用 `null`（无激活面板）

## 使用方示例

```ts
// 从 localStorage 恢复上次状态
const saved = JSON.parse(localStorage.getItem('layplux-state') || '{}')
const skeleton = useSkeleton({ initialState: saved })

// 监听状态变更，自行序列化
skeleton.event.onGlobal('skeleton:state-changed', (state) => {
  localStorage.setItem('layplux-state', JSON.stringify(state))
})

// 正常注册面板...
skeleton.add({ name: 'explorer', area: 'leftTopArea', type: 'panel', ... })
```

## 数据流

```
initialState ──→ useSkeleton() ──→ 各管理器设置初始值
                                      │
                  用户交互（拖拽/点击/切换模式）
                                      │
                                      ▼
                   骨架检测变更 → 防抖（尺寸类 300ms）
                                      │
                                      ▼
                         emit('skeleton:state-changed', state)
                                      │
                                      ▼
                              使用者序列化到目标存储
```

## 实现任务

### 1. 新增 SkeletonState 类型

文件：`src/types/config.ts`（或新建 `src/types/state.ts`）

### 2. 尺寸数据迁移到 skeleton

当前 `leftWidth`、`rightWidth`、`bottomHeight`、`leftSplitRatio`、`rightSplitRatio`、`bottomSplitRatio` 是 `CenterArea` 组件内的本地 `ref`。将它们迁移到 `skeleton` 中管理：
- `skeleton.state.leftWidth` 等作为响应式 ref
- `CenterArea` 通过 props 读写这些值
- 拖拽回调改为 `skeleton.updateSize(key, value)`

### 3. skeleton 增加状态管理

文件：`src/managers/skeleton.ts`

- 新增 `options: SkeletonOptions` 参数
- 新增 `state` 内部 ref 集合
- 新增 `getState()` 方法
- 尺寸变化时触发防抖的 `skeleton:state-changed` 事件
- 视图模式/激活状态变化时立即触发 `skeleton:state-changed` 事件

### 4. pane 变更通知

文件：`src/managers/pane.ts`

- `setViewMode` 时通知 skeleton（通过回调或事件）

### 5. widget-container 变更通知

文件：`src/managers/widget-container.ts`

- `activate` / `deactivate` 时通知 skeleton

### 6. CenterArea 适配

文件：`src/layout/skeleton/center-area.tsx`

- 尺寸和分割比例从 `skeleton.state` 读取
- 拖拽回调改为调用 skeleton 的 setter

## 不纳入持久化的内容

- **主题/语言**：已在 skeleton 上有独立 API，变化频率低，使用方如需持久化可自行监听独立事件
- **焦点状态**：`focusedId` 是运行时概念，不应跨会话恢复
- **交互型 widget 状态**：工具栏/状态栏项没有面板级状态需要持久化

## 边界情况

1. **版本升级后 widget 被删除**：`initialState.viewModes` 中的 key 在当前注册的 widgets 中找不到 → 忽略，不影响其他状态恢复
2. **无 localStorage 环境**（SSR/服务端）：`useSkeleton({ initialState: {} })` 正常运行，所有值取默认
3. **快速连续拖拽**：防抖确保 `skeleton:state-changed` 在拖拽停止 300ms 后才触发，不会频繁写入存储
4. **同时打开多个 Layplux 实例**：每个实例维护独立的 skeleton，由使用方决定是否按实例 ID 隔离存储 key
