# 事件系统集成设计

> 将 event-bus 整合进 Skeleton/Widget/Panel 生命周期，提供跨组件通信基础设施。

## 目标

- Skeleton、Widget、Panel 三个层级的关键生命周期节点发射事件
- 外部应用和其他 widget 可通过全局事件总线订阅
- 内容组件可通过 `renderBody` 注入的 `event` prop 收发事件

## 架构

```
createPluginEventBus('skeleton')
       │
       ▼
ISkeleton.event (PluginEventBus)
       │
       ├── emitGlobal('skeleton:*')         骨架级发射
       ├── emitGlobal('widget:{name}:*')    通过 Widget 层发射
       ├── emitGlobal('panel:{name}:*')     通过 PanelView 发射
       │
       ├── onGlobal(...)                     外部订阅入口
       └── waitForGlobal(...)                异步等待
```

命名规范：`层级:主体:事件`，如 `widget:explorer:focus`。

## 改动文件

### 1. managers/skeleton.ts

- `ISkeleton` 接口新增 `event: PluginEventBus`
- `useSkeleton()` 中调用 `createPluginEventBus('skeleton')`
- 在关键操作点发射事件

| 事件 | 时机 | payload |
|---|---|---|
| `skeleton:widget-added` | `createWidget()` 后 | `{ widget: IWidget }` |
| `skeleton:widget-removed` | widget 移除 | `{ name: string }` |
| `skeleton:focus-changed` | `focus()`/`blur()` | `{ focusedId: string \| null }` |

### 2. managers/widget.ts

- `useWidget()` 的 skeleton 参数扩展为 `Pick<ISkeleton, 'focusedId' | 'focus' | 'blur' | 'focusTracker' | 'event'>`
- `IWidget` 新增 `event: PluginEventBus`
- 在 `focusable` 回调中发射焦点事件
- `watch(pane.viewMode)` 发射视图模式变更事件
- `renderBody()` 注入 `event` prop 到内容组件

| 事件 | 时机 | payload |
|---|---|---|
| `widget:{name}:activated` | container.activate | `{ widget: IWidget }` |
| `widget:{name}:deactivated` | container.deactivate | `{ widget: IWidget }` |
| `widget:{name}:focus` | focusable.onActive | `{ widget: IWidget }` |
| `widget:{name}:blur` | focusable.onBlur | `{ widget: IWidget }` |
| `widget:{name}:view-mode-changed` | pane.viewMode 变化 | `{ widget: IWidget, mode: ViewMode }` |

### 3. components/panel-view/index.tsx

- 最小化按钮点击时发射 `panel:{name}:minimize`
- `handleClick` 中每次菜单项点击发射 `panel:{name}:menu-click`

| 事件 | 时机 | payload |
|---|---|---|
| `panel:{name}:minimize` | 最小化按钮 | `{ widget: IWidget }` |
| `panel:{name}:menu-click` | 菜单项点击 | `{ widget: IWidget, key: string }` |

## 内容组件使用方式

`renderBody()` 通过 `createContent` 注入 `event` prop：

```ts
function renderBody() {
  const { content, contentProps } = config;
  return createContent(content, { ...contentProps, config, event: widget.event });
}
```

内容组件中：

```ts
const MyContent = defineComponent({
  props: {
    event: Object as PropType<PluginEventBus>,
  },
  setup(props) {
    props.event.emitGlobal('custom:action', { data });
    props.event.onGlobal('widget:explorer:focus', ({ widget }) => {});
    return () => <div>...</div>;
  },
});
```

## 事件清单汇总

```
skeleton:widget-added
skeleton:widget-removed
skeleton:focus-changed

widget:{name}:activated
widget:{name}:deactivated
widget:{name}:focus
widget:{name}:blur
widget:{name}:view-mode-changed

panel:{name}:minimize
panel:{name}:menu-click
```

## 不在此范围

- 插件系统（PluginManager 等）
- 通配符订阅的性能监控/限制
- 事件日志/调试工具
