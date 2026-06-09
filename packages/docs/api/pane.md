# IPane API

IPane 管理 Panel Widget 的视图模式。

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `viewMode` | `Ref<ViewMode>` | 当前视图模式 |

## ViewMode 枚举

```ts
type ViewMode = 'DockPinned' | 'DockUnpinned' | 'Undock'
```

| 模式 | 说明 |
|------|------|
| `DockPinned` | 停靠固定，始终可见 |
| `DockUnpinned` | 停靠不固定，失焦自动收起 |
| `Undock` | 取消停靠，浮动显示 |

## 方法

### setViewMode(mode)

切换视图模式。

```ts
widget.pane.setViewMode('Undock')
```

## 使用示例

```ts
skeleton.add({
  name: 'explorer',
  type: 'panel',
  area: 'leftTopArea',
  content: h(MyPanel),
  props: {
    panelMenuItems: [
      {
        key: 'undock',
        label: '取消停靠',
        onClick: (_, w) => w.pane.setViewMode('Undock'),
      },
    ],
  },
})
```
