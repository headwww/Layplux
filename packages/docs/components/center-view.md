# CenterView

中心区域轻量容器组件，无标题栏、tabs、下拉菜单等 chrome，只渲染 Widget 内容。

## 与 PanelView 对比

| 特性 | PanelView | CenterView |
|------|-----------|------------|
| 标题栏 | ✅ | ❌ |
| 视图模式切换 | ✅ (Dock/Undock) | ❌ |
| 下拉菜单 | ✅ | ❌ |
| 最小化按钮 | ✅ | ❌ |
| Teleport 保活 | ✅ | ✅ |
| 使用场景 | 左右底部面板 | 中心区域（编辑器/Canvas/预览） |

## Props

| 属性 | 类型 | 说明 |
|------|------|------|
| `widget` | `IWidget` | 要渲染的 Widget 实例 |
| `anchor` | `string` | Teleport 目标选择器，如 `#center-area` |

## 工作原理

CenterView 只做一件事：将 `widget.renderContent()` Teleport 到 `anchor` 指定的锚点。

```tsx
setup(props) {
  return () => {
    if (!props.widget) return null
    return (
      <Teleport defer to={props.anchor}>
        {props.widget.renderContent()}
      </Teleport>
    )
  }
}
```

## 注册方式

中心区域使用注册式，与左右面板机制一致：

```ts
// 注册多个中心区域 Widget
skeleton.add({
  name: 'center-router',
  type: 'panel',
  area: 'centerArea',
  content: h(RouterView),
})

skeleton.add({
  name: 'center-editor',
  type: 'panel',
  area: 'centerArea',
  content: h(MyEditor),
})

// 激活路由视图
skeleton.centerArea.container.activate('center-router')

// 切换到编辑器（旧 Widget 进 offscreen 保活，不销毁）
skeleton.centerArea.container.activate('center-editor')
```

## Teleport 锚点

CenterArea 骨架中预置两个锚点：

- `#center-area`：可见区域，激活的 Widget Teleport 到这里
- `#center-offscreen`：离屏保活容器（`display:none`），未激活的 Widget 保活于此

切换时仅改变 Teleport 目标，VNode 不销毁，编辑器状态完整保留。
