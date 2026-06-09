# Dropdown

Dropdown 提供点击触发的下拉菜单功能。

## 组件列表

| 组件 | 说明 |
|------|------|
| `Dropdown` | 下拉触发器 + 菜单容器 |
| `DropdownMenu` | 菜单列表 |
| `DropdownItem` | 菜单项 |
| `DropdownDivider` | 分隔线 |
| `DropdownSubmenu` | 子菜单 |

## Props (Dropdown)

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `visible` | `boolean` | - | 受控显示 |
| `trigger` | `'click' \| 'hover' \| 'contextmenu'` | `'click'` | 触发方式 |
| `placement` | `Placement` | `'bottom-start'` | 弹出位置 |
| `disabled` | `boolean` | `false` | 禁用 |
| `getContainer` | `() => HTMLElement` | `() => document.body` | 弹出容器 |
| `onClick` | `(key: string) => void` | - | 菜单项点击回调 |

## 使用示例

```tsx
<Dropdown trigger="click" placement="bottom-start" onClick={handleClick}>
  {{
    default: () => <button>更多</button>,
    overlay: () => (
      <DropdownMenu>
        <DropdownItem eventKey="action1">操作一</DropdownItem>
        <DropdownDivider />
        <DropdownSubmenu title="子菜单">
          <DropdownItem eventKey="sub1">子项一</DropdownItem>
        </DropdownSubmenu>
      </DropdownMenu>
    ),
  }}
</Dropdown>
```
