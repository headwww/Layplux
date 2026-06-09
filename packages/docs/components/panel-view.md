# PanelView

PanelView 是每个 Panel Widget 的面板容器组件，提供标题栏、操作按钮和下拉菜单。

## 内容区域

每个 PanelView 包含：
- 标题栏（icon + title + panelTitleExtra）
- 操作按钮区域（panelActionsExtra + 下拉菜单 + 最小化按钮）
- 内容区（`<div id="anchor">` — Widget 内容通过 Teleport 注入）

## 下拉菜单

每个 PanelView 的下拉菜单默认包含：
- **视图模式**：停靠固定 / 停靠不固定 / 取消停靠
- **帮助**（可通过 `showHelp: false` 隐藏）

## PanelWidgetProps 扩展

通过 `props` 配置面板：

```ts
skeleton.add({
  type: 'panel',
  name: 'my-panel',
  content: h(MyContent),
  props: {
    title: '我的面板',
    icon: h(MyIcon),
    showHelp: false,
    onHelpClick: () => {},
    panelMenuItems: [
      { key: 'export', label: '导出', onClick: (key, widget) => {} },
    ],
    panelTitleExtra: h(ExtraContent),
    panelActionsExtra: h(ActionsContent),
  },
})
```
