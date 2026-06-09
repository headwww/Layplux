# 架构设计

## 分层架构

```
Layplux (Vue 组件)
  └── RootPane
        ├── CornerGlow        装饰
        ├── LayeredManager    Z 轴分层
        │     └── Skeleton
        │           ├── TopArea / BottomArea
        │           ├── LeftTopArea / LeftBottomArea
        │           ├── RightTopArea / RightBottomArea
        │           ├── CenterArea (Dock/Undock 面板 + 拖拽 + centerArea 注册)
        └── GlassOverlay       交互事件捕获
```

## 核心模块

| 模块 | 职责 |
|------|------|
| `managers/skeleton` | 全局骨架，管理所有区域和 Widget 生命周期 |
| `managers/widget` | Widget 工厂，创建 IWidget 实例 |
| `managers/widget-container` | 容器管理，activeId 单数据源 |
| `managers/pane` | 面板视图模式管理 |
| `managers/theme` | 主题 CSS 变量注入 |
| `managers/area` | 区域工厂，封装 container |
| `components/panel-view` | 面板容器组件（带 chrome） |
| `components/center-view` | 中心区域容器组件（无 chrome，纯内容） |
| `components/popup` | 弹层组件（Dropdown/Tooltip 基础） |
| `components/dropdown` | 下拉菜单 |
| `components/tooltip` | 提示工具 |
| `utils/event-bus` | 事件总线（EventEmitter2） |
| `utils/focus-tracker` | 焦点追踪 |
| `layout/root-pane` | 根容器 |
| `layout/center-area` | 中央区域（Dock/Undock/拖拽） |

## Z 轴分层

LayeredManager 预设五层：

| 层号 | 名称 | 用途 |
|------|------|------|
| 0 | DEFAULT | 默认内容 |
| 100 | PALETTE | 调色板/工具面板 |
| 200 | MODAL | 模态框 |
| 300 | POPUP | 弹出层 |
| 400 | DRAG | 拖拽反馈 |
