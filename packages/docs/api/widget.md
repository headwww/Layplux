# IWidget API

IWidget 是 Widget 实例的接口，由 `useWidget(config)` 工厂函数创建。

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 唯一标识符 |
| `name` | `string` | Widget 名称 |
| `type` | `'panel' \| 'interaction'` | Widget 类型 |
| `config` | `SkeletonConfig` | 原始配置对象 |
| `active` | `Ref<boolean>` | 是否在当前容器激活 |
| `focused` | `Ref<boolean>` | 是否聚焦 |
| `pane` | `IPane` | 面板状态（仅 Panel） |
| `focusable` | `Focusable` | 焦点管理 |
| `event` | `PluginEventBus` | 事件总线实例 |
| `container` | `IWidgetContainer` | 所属容器 |

## 配置类型

### PanelWidgetConfig

```ts
interface PanelWidgetConfig {
  type: 'panel'
  name: string
  area?: SkeletonConfigArea
  props?: PanelWidgetProps
  content?: string | Component | VNode
  index?: number
}

interface PanelWidgetProps {
  icon?: string | Component | VNode
  title?: string | Component | VNode
  showHelp?: boolean
  onHelpClick?: () => void
  panelMenuItems?: MenuItemConfig[]
  panelTitleExtra?: string | Component | VNode
  panelActionsExtra?: string | Component | VNode
}
```

### InteractionWidgetConfig

```ts
interface InteractionWidgetConfig {
  type: 'interaction'
  name: string
  area?: SkeletonConfigArea
  props?: { align?: 'left' | 'center' | 'right' }
  content?: string | Component | VNode
}
```
