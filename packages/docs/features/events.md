# 事件系统

Layplux 基于 EventEmitter2 提供生命周期事件和跨组件通信。

## 生命周期事件

| 事件 | 触发时机 |
|------|----------|
| `skeleton:widget-added` | Widget 注册时 |
| `skeleton:widget-removed` | Widget 移除时 |
| `skeleton:focus-changed` | 焦点切换时 |
| `skeleton:state-changed` | 面板状态变更（尺寸/视图模式/激活） |
| `widget:{name}:activated` | Widget 激活时 |
| `widget:{name}:deactivated` | Widget 取消激活时 |
| `widget:{name}:focus` | 获取焦点时 |
| `widget:{name}:blur` | 失去焦点时 |
| `widget:{name}:view-mode-changed` | 视图模式变更时 |
| `panel:{name}:minimize` | 面板最小化时 |
| `panel:{name}:menu-click` | 菜单项点击时 |

## 订阅事件

```ts
// 全局订阅
skeleton.event.onGlobal('widget:*:focus', ({ widget }) => {
  console.log(`${widget.name} focused`)
})

// 通配符订阅
skeleton.event.onGlobal('panel:*:minimize', ({ widget }) => {
  console.log(`${widget.name} minimized`)
})

// 等待一次性事件
const { widget } = await skeleton.event.waitForGlobal('skeleton:widget-added')
```

## 跨组件通信

内容组件通过 `event` prop 收发事件：

```ts
// Widget A 发送
props.event.emitGlobal('data:exported', { csv: '...' })

// Widget B 接收
props.event.onGlobal('data:exported', (payload) => {
  // 处理数据
})
```

### 状态持久化

`skeleton:state-changed` 是专门为持久化设计的事件，结合 `initialState` 即可实现会话恢复：

```ts
// 恢复状态
const saved = JSON.parse(localStorage.getItem('layplux-state') || '{}')
const skeleton = useSkeleton({ initialState: saved })

// 持久化状态（尺寸变化会防抖 300ms）
skeleton.event.onGlobal('skeleton:state-changed', (state) => {
  localStorage.setItem('layplux-state', JSON.stringify(state))
})
```

事件载荷为 `SkeletonState` 类型，包含所有面板尺寸、视图模式和激活状态。

## 架构

基于 EventEmitter2，支持通配符（`*`、`**`）和命名空间（`:` 分隔）：

```ts
const globalEmitter = new EventEmitter2({
  wildcard: true,
  delimiter: ':',
  maxListeners: 200,
})
```
