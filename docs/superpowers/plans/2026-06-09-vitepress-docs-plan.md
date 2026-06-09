# VitePress Documentation Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `packages/docs` VitePress project with complete technical documentation covering getting started, API, components, theme, i18n, events, and architecture.

**Architecture:** VitePress static site in the pnpm monorepo. Markdown files organized by topic area. `.vitepress/config.ts` defines nav and sidebar. Homepage with Hero + Features layout.

**Tech Stack:** VitePress v1, Markdown, pnpm workspace

---

## File Structure

| File | Responsibility |
|---|---|
| `packages/docs/package.json` | Project config, vitepress dependency |
| `packages/docs/.vitepress/config.ts` | Site nav, sidebar, theme config |
| `packages/docs/index.md` | Homepage Hero + Features |
| `packages/docs/guide/getting-started.md` | Installation, minimal example |
| `packages/docs/guide/core-concepts.md` | Skeleton/Widget/Panel/Area concepts |
| `packages/docs/api/skeleton.md` | ISkeleton API reference |
| `packages/docs/api/widget.md` | IWidget API reference |
| `packages/docs/api/pane.md` | IPane API + ViewMode |
| `packages/docs/components/panel-view.md` | PanelView component |
| `packages/docs/components/dropdown.md` | Dropdown series |
| `packages/docs/components/tooltip-popup.md` | Tooltip & Popup |
| `packages/docs/features/theme.md` | ColorScheme + themeName + registerTheme |
| `packages/docs/features/i18n.md` | setLocale, built-in locales, custom |
| `packages/docs/features/events.md` | Lifecycle events, cross-component |
| `packages/docs/architecture.md` | Architecture design overview |
| `packages/docs/plugin.md` | Plugin system placeholder |

---

### Task 1: Initialize VitePress project

**Files:**
- Create: `packages/docs/package.json`
- Create: `packages/docs/.vitepress/config.ts`
- Create: `packages/docs/index.md`

- [ ] **Step 1: Create `packages/docs/package.json`**

```json
{
  "name": "@layplux/docs",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "preview": "vitepress preview"
  },
  "devDependencies": {
    "vitepress": "^1.6.3"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `cd packages/docs && pnpm install`
Expected: vitepress installed successfully.

- [ ] **Step 3: Create `.vitepress/config.ts`**

```ts
import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Layplux',
  description: '可扩展的 IDE 布局框架',
  lang: 'zh-CN',

  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API', link: '/api/skeleton' },
      { text: '组件', link: '/components/panel-view' },
      { text: '特性', link: '/features/theme' },
    ],

    sidebar: {
      '/guide/': [
        { text: '快速开始', link: '/guide/getting-started' },
        { text: '核心概念', link: '/guide/core-concepts' },
      ],
      '/api/': [
        { text: 'Skeleton', link: '/api/skeleton' },
        { text: 'Widget', link: '/api/widget' },
        { text: 'Pane', link: '/api/pane' },
      ],
      '/components/': [
        { text: 'PanelView', link: '/components/panel-view' },
        { text: 'Dropdown', link: '/components/dropdown' },
        { text: 'Tooltip & Popup', link: '/components/tooltip-popup' },
      ],
      '/features/': [
        { text: '主题系统', link: '/features/theme' },
        { text: '国际化', link: '/features/i18n' },
        { text: '事件系统', link: '/features/events' },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com' },
    ],

    footer: {
      message: 'MIT Licensed',
    },
  },
});
```

- [ ] **Step 4: Create `index.md` homepage**

```md
---
layout: home
hero:
  name: 'Layplux'
  text: 可扩展的 IDE 布局框架
  tagline: 基于 Vue 3 的面板式布局系统，支持拖拽、主题、国际化、事件通信
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com
features:
  - title: 🧩 灵活布局
    details: 8 个区域面板 + Dock/Undock 模式 + 拖拽调整大小，轻松构建 VS Code 风格界面
  - title: 🎨 主题系统
    details: 亮/暗/跟随系统 + 自定义主题色(data-theme)，零依赖 CSS 变量体系
  - title: 🌍 国际化
    details: 内置中英文，零依赖 inject/provide 方案，支持自定义语言包
  - title: ⚡ 事件总线
    details: 基于 EventEmitter2 的生命周期事件系统，支持跨组件通配符订阅
---
```

- [ ] **Step 5: Verify site starts**

Run: `cd packages/docs && npx vitepress dev --port 5174 2>&1 | head -10`
Expected: VitePress dev server starts.

---

### Task 2: Write guide pages

**Files:**
- Create: `packages/docs/guide/getting-started.md`
- Create: `packages/docs/guide/core-concepts.md`

- [ ] **Step 1: Create `getting-started.md`**

```md
# 快速开始

## 安装

```bash
pnpm add layplux
```

## 最小示例

```ts
import { useSkeleton } from 'layplux';
import { h } from 'vue';

const skeleton = useSkeleton();

// 添加一个面板
skeleton.add({
  name: 'hello',
  type: 'panel',
  area: 'leftTopArea',
  content: h('div', 'Hello Layplux!'),
});
```

```vue
<template>
  <div style="width:100%;height:100vh">
    <Layplux :skeleton="skeleton" />
  </div>
</template>

<script setup>
import { Layplux } from 'layplux';
</script>
```

## 下一步

- [核心概念](/guide/core-concepts) — 理解 Skeleton / Widget / Panel / Area
- [Skeleton API](/api/skeleton) — 完整 API 参考
```

- [ ] **Step 2: Create `core-concepts.md`**

```md
# 核心概念

## Skeleton（骨架）

Skeleton 是 Layplux 的核心对象，管理所有区域和 Widget 的生命周期。

```ts
import { useSkeleton } from 'layplux';
const skeleton = useSkeleton();
```

通过 `skeleton.add(config)` 向指定区域添加 Widget。

## Widget（组件）

Widget 是 Layplux 中最小的功能单元，分两种类型：

- **Panel（面板）**：可停靠、可拖动大小的面板，如文件树、终端
- **Interaction（交互组件）**：工具栏按钮、状态栏项等轻量组件

## Area（区域）

Layplux 预定义了 8 个区域：

| 区域 | 位置 | 类型 |
|------|------|------|
| `topArea` | 顶部工具栏 | Interaction |
| `bottomArea` | 底部状态栏 | Interaction |
| `leftTopArea` | 左侧上部 | Panel |
| `leftBottomArea` | 左侧下部 | Panel |
| `rightTopArea` | 右侧上部 | Panel |
| `rightBottomArea` | 右侧下部 | Panel |
| `bottomLeftArea` | 底部左侧 | Panel |
| `bottomRightArea` | 底部右侧 | Panel |

## Pane（面板状态）

每个 Panel Widget 有一个 `pane` 对象，管理三种视图模式：

- `DockPinned`：停靠固定，始终可见
- `DockUnpinned`：停靠不固定，失焦自动收起
- `Undock`：取消停靠，浮动显示

## 数据流

```
Skeleton
  ├── topArea / bottomArea (Interaction Widgets)
  ├── leftTopArea / leftBottomArea (Panel Widgets)
  ├── rightTopArea / rightBottomArea (Panel Widgets)
  └── bottomLeftArea / bottomRightArea (Panel Widgets)
```
```

---

### Task 3: Write API pages

**Files:**
- Create: `packages/docs/api/skeleton.md`
- Create: `packages/docs/api/widget.md`
- Create: `packages/docs/api/pane.md`

- [ ] **Step 1: Create `skeleton.md`**

```md
# ISkeleton API

ISkeleton 是 Layplux 的核心接口，管理所有区域和 Widget。

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `widgets` | `IWidget[]` | 所有已注册的 Widget |
| `focusedId` | `Ref<string \| null>` | 当前聚焦的 Widget 名称 |
| `focusTracker` | `FocusTracker` | 焦点追踪器 |
| `event` | `PluginEventBus` | 全局事件总线 |
| `locale` | `Ref<LaypluxLocale>` | 当前语言包 |
| `theme` | `Ref<'light' \| 'dark' \| 'system'>` | 亮暗模式 |
| `themeName` | `Ref<string>` | 当前主题名 |

## 方法

### add(config)

向指定区域添加 Widget。

```ts
skeleton.add({
  name: 'explorer',
  type: 'panel',
  area: 'leftTopArea',
  content: h(MyComponent),
});
```

### setLocale(name)

切换语言。

```ts
skeleton.setLocale('en-US');
```

### setTheme(theme)

切换亮暗模式。

```ts
skeleton.setTheme('dark'); // 'light' | 'dark' | 'system'
```

### setThemeName(name)

切换主题色。

```ts
skeleton.setThemeName('blue');
```

### registerTheme(name, vars)

注册自定义主题色（JS 方式）。

```ts
skeleton.registerTheme('blue', {
  '--layplux-primary': '200 80% 50%',
  '--layplux-accent': '200 5% 20%',
});
```

## 区域访问

```ts
skeleton.leftTopArea   // IArea<PanelWidgetConfig, IWidget>
skeleton.rightTopArea  // IArea<PanelWidgetConfig, IWidget>
skeleton.topArea       // IArea<InteractionWidgetConfig, IWidget>
skeleton.bottomArea    // IArea<InteractionWidgetConfig, IWidget>
```
```

- [ ] **Step 2: Create `widget.md`**

```md
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
  type: 'panel';
  name: string;
  area?: SkeletonConfigArea;
  props?: PanelWidgetProps;
  content?: string | Component | VNode;
  index?: number;
}

interface PanelWidgetProps {
  icon?: string | Component | VNode;
  title?: string | Component | VNode;
  showHelp?: boolean;
  onHelpClick?: () => void;
  panelMenuItems?: MenuItemConfig[];
  panelTitleExtra?: string | Component | VNode;
  panelActionsExtra?: string | Component | VNode;
}
```

### InteractionWidgetConfig

```ts
interface InteractionWidgetConfig {
  type: 'interaction';
  name: string;
  area?: SkeletonConfigArea;
  props?: { align?: 'left' | 'center' | 'right' };
  content?: string | Component | VNode;
}
```
```

- [ ] **Step 3: Create `pane.md`**

```md
# IPane API

IPane 管理 Panel Widget 的视图模式。

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `viewMode` | `Ref<ViewMode>` | 当前视图模式 |

## ViewMode 枚举

```ts
type ViewMode = 'DockPinned' | 'DockUnpinned' | 'Undock';
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
widget.pane.setViewMode('Undock');
```

## 使用示例

```ts
// 在菜单点击事件中切换
skeleton.add({
  name: 'explorer',
  type: 'panel',
  area: 'leftTopArea',
  content: h(MyPanel),
  props: {
    panelMenuItems: [
      { key: 'undock', label: '取消停靠', onClick: (_, w) => w.pane.setViewMode('Undock') },
    ],
  },
});
```
```

---

### Task 4: Write component pages

**Files:**
- Create: `packages/docs/components/panel-view.md`
- Create: `packages/docs/components/dropdown.md`
- Create: `packages/docs/components/tooltip-popup.md`

- [ ] **Step 1: Create `panel-view.md`**

```md
# PanelView

PanelView 是每个 Panel Widget 的面板容器组件，提供标题栏、操作按钮和下拉菜单。

## Props

| Prop | 类型 | 说明 |
|------|------|------|
| `anchor` | `string` | Teleport 锚点 ID |
| `title` | `string` | 面板标题 |
| `widget` | `IWidget` | Widget 实例 |

## 内置菜单项

每个 PanelView 的下拉菜单默认包含：
- **视图模式**：停靠固定 / 停靠不固定 / 取消停靠
- **帮助**（可通过 `showHelp: false` 隐藏）

## PanelWidgetProps 扩展

通过 `props` 配置面板：

```ts
skeleton.add({
  type: 'panel',
  name: 'my-panel',
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
});
```
```

- [ ] **Step 2: Create `dropdown.md`**

```md
# Dropdown

Dropdown 提供点击触发的下拉菜单功能。

## 组件

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
```

- [ ] **Step 3: Create `tooltip-popup.md`**

```md
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
```

---

### Task 5: Write feature pages

**Files:**
- Create: `packages/docs/features/theme.md`
- Create: `packages/docs/features/i18n.md`
- Create: `packages/docs/features/events.md`

- [ ] **Step 1: Create `theme.md`**

```md
# 主题系统

Layplux 的主题系统有两个独立维度：亮暗模式 + 主题色。

## 亮暗模式

```ts
skeleton.setTheme('dark');  // 'light' | 'dark' | 'system'
```

- `light`：浅色模式
- `dark`：暗色模式
- `system`：跟随系统（监听 `prefers-color-scheme`）

## 主题色

通过 `data-theme` 属性切换主题色：

```ts
skeleton.setThemeName('blue');
```

渲染为 `<div class="layplux-root" data-theme="blue">`。

## 自定义主题色

### JS 方式

```ts
skeleton.registerTheme('ocean', {
  '--layplux-primary': '200 80% 50%',
  '--layplux-accent': '200 5% 20%',
  '--layplux-border': '200 10% 30%',
});
skeleton.setThemeName('ocean');
```

### CSS 方式

```css
.layplux-root[data-theme='ocean'] {
  --layplux-primary: 200 80% 50%;
}

.layplux-root.dark[data-theme='ocean'] {
  --layplux-primary: 200 80% 60%;
}
```

## CSS 变量参考

| 变量 | 用途 |
|------|------|
| `--layplux-background` | 主背景色 |
| `--layplux-foreground` | 主文字色 |
| `--layplux-primary` | 主色调 |
| `--layplux-accent` | 强调色 |
| `--layplux-border` | 边框色 |
| `--layplux-hover` | 悬停色 |
| `--layplux-muted` | 弱化背景 |
| `--layplux-muted-foreground` | 弱化文字 |
| `--layplux-radius` | 圆角 |
```
```

- [ ] **Step 2: Create `i18n.md`**

```md
# 国际化

Layplux 通过 `provide/inject` 下发语言包，零依赖。

## 切换语言

```ts
skeleton.setLocale('en-US');
```

内置 `zh-CN`（默认）和 `en-US`。

## 自定义语言

```ts
skeleton.locale.value = {
  panel: {
    viewMode: '视图模式',
    dockPinned: '停靠固定',
    dockUnpinned: '停靠不固定',
    undock: '取消停靠',
    help: '帮助',
    more: '更多',
    minimize: '最小化',
  },
};
```

## 语言包结构

```ts
interface LaypluxLocale {
  panel: {
    viewMode: string;
    dockPinned: string;
    dockUnpinned: string;
    undock: string;
    help: string;
    more: string;
    minimize: string;
  };
}
```
```

- [ ] **Step 3: Create `events.md`**

```md
# 事件系统

Layplux 基于 EventEmitter2 提供生命周期事件和跨组件通信。

## 生命周期事件

| 事件 | 触发时机 |
|------|----------|
| `skeleton:widget-added` | Widget 注册时 |
| `skeleton:widget-removed` | Widget 移除时 |
| `skeleton:focus-changed` | 焦点切换时 |
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
  console.log(`${widget.name} focused`);
});

// 等待一次性事件
const { widget } = await skeleton.event.waitForGlobal('skeleton:widget-added');
```

## 跨组件通信

内容组件通过 `event` prop 收发事件：

```ts
// Widget A 发送
props.event.emitGlobal('data:exported', { csv: '...' });

// Widget B 接收
props.event.onGlobal('data:exported', (payload) => {
  // 处理数据
});
```
```

---

### Task 6: Write architecture and plugin pages

**Files:**
- Create: `packages/docs/architecture.md`
- Create: `packages/docs/plugin.md`

- [ ] **Step 1: Create `architecture.md`**

```md
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
        │           └── CenterArea (Dock/Undock panels)
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
| `components/panel-view` | 面板容器组件 |
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
```

- [ ] **Step 2: Create `plugin.md`**

```md
# 插件系统

::: warning 开发中
插件系统正在设计中，预计在后续版本发布。
:::

## 设计目标

- 每个插件有独立的事件命名空间
- 支持通配符跨插件通信
- DAG 依赖排序
- 动态注册/卸载

## 事件总线

插件系统将基于已集成的 EventEmitter2 事件总线：

```ts
// 基础 API 已可用
skeleton.event.onGlobal('**', (payload) => {
  // 监听所有全局事件
});
```
```

---

### Task 7: Verify the full site

- [ ] **Step 1: Start dev server**

Run: `cd packages/docs && npx vitepress dev --port 5174`

- [ ] **Step 2: Verify all pages load**

Open `http://localhost:5174` and check:
1. Homepage renders with Hero + Features
2. Nav links work (指南 / API / 组件 / 特性)
3. Sidebar navigation works on each section
4. All pages render without broken links
5. Code blocks are syntax highlighted

- [ ] **Step 3: Verify build**

Run: `cd packages/docs && npx vitepress build 2>&1 | tail -5`
Expected: Build completes without errors, files generated in `.vitepress/dist/`.
