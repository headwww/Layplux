# Tooltip & Popup

## Tooltip

鼠标悬停显示提示文字。

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string \| VNode` | - | 提示内容 |
| `trigger` | `'hover' \| 'click'` | `'hover'` | 触发方式 |
| `placement` | `Placement` | `'top'` | 弹出位置 |
| `getContainer` | `() => HTMLElement` | `() => document.body` | 弹出容器 |

```tsx
<Tooltip title="提示文字" placement="top">
  <button>悬停我</button>
</Tooltip>
```

## Popup

底层弹出组件，Dropdown 和 Tooltip 都基于 Popup 实现。

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `visible` | `boolean` | - | 受控显示 |
| `trigger` | `Trigger` | `'hover'` | 触发方式 |
| `placement` | `Placement` | `'bottom'` | 弹出位置 |
| `offset` | `{ x?: number, y?: number }` | `{ y: 4 }` | 偏移量 |
| `getContainer` | `() => HTMLElement` | `() => document.body` | 弹出容器 |
| `destroyOnClose` | `boolean` | `true` | 关闭时销毁 DOM |
```
