# Layplux 主题系统设计

## 概述

Layplux 组件库采用 SCSS + CSS 自定义属性的主题架构。Token 层挂载在 `.layplux-root` 容器上，使用 `--layplux-` 前缀避免与宿主项目冲突。支持亮色/暗色模式、多套预设主题、外部自定义主题扩展。

## 架构

```
┌──────────────────────────────────────────────┐
│                layplux.scss (入口)            │
│  @use 'base/tokens';                         │
│  @use 'base/tokens-dark';                    │
│  @use 'components/*';                        │
└──────────────────┬───────────────────────────┘
                   │ SCSS 编译
                   ▼
┌──────────────────────────────────────────────┐
│               layplux.css                    │
│                                              │
│  .layplux-root {                             │
│    --layplux-background: 0 0% 100%;          │  ← Token 层
│    --layplux-primary: 212 100% 45%;          │    (容器作用域)
│    color-scheme: light;                      │
│  }                                           │
│  .layplux-root[data-theme='violet'] { ... }  │
│  .layplux-root.dark { ... }                  │
│  .layplux-root.dark[data-theme='violet'] {}  │
│                                              │
│  .stripe { ... }                             │  ← 组件样式层
│  .tool-window { ... }                        │
│  .editor-area { ... }                        │
│  .status-bar { ... }                         │
│  .glass-pane { ... }                         │
└──────────────────────────────────────────────┘
```

## 文件结构

```
packages/layplux/src/styles/
├── base/
│   ├── _tokens.scss          ← 亮色 .layplux-root 默认 + 所有 [data-theme] 亮色变体
│   └── _tokens-dark.scss     ← .layplux-root.dark + 所有暗色主题变体
├── components/
│   ├── _root-pane.scss
│   ├── _stripe.scss
│   ├── _tool-window.scss
│   ├── _editor-area.scss
│   ├── _status-bar.scss
│   ├── _glass-pane.scss
│   └── _main-tool-bar.scss
└── layplux.scss              ← 唯一入口
```

## Token 层

### 命名规范

- 全部带 `--layplux-` 前缀，避免与宿主项目 CSS 变量冲突
- HSL 裸值存储：`--layplux-background: 0 0% 100%`（不带 `hsl()` 包装）
- 引用时：`hsl(var(--layplux-background))`
- 修复现有 `default.css` 中部分值使用逗号的问题（如 `--info: 240, 5%, 96%` → `240 5% 96%`）

### 容器作用域

Token 挂载在 `.layplux-root` 而非 `:root`，隔离宿主项目：

```css
.layplux-root {
  --layplux-background: 0 0% 100%;
  --layplux-primary: 212 100% 45%;
  /* ... */
  color-scheme: light;
}

.layplux-root.dark {
  --layplux-background: 222.34deg 10.43% 12.27%;
  /* ... */
  color-scheme: dark;
}
```

### 主题切换

- 宿主在容器上切换 `<div class="layplux-root dark" data-theme="violet">`
- 组件不写 `.dark` 或 `[data-theme]` 选择器，只引用 token，自动响应
- 同一页面可存在多个 Layplux 容器实例，各自独立主题

### 预设主题

`[data-theme]` 属性切换，内部预设：violet、pink、rose、sky-blue、deep-blue、green、deep-green、orange、yellow、zinc、neutral、slate、gray。

每个主题提供亮色和暗色两套值：

```css
.layplux-root[data-theme='violet'] { --layplux-primary: 262.1 83.3% 57.8%; ... }
.layplux-root.dark[data-theme='violet'] { --layplux-background: 224 71.4% 4.1%; ... }
```

### Token 清单

| 类别 | Token | 说明 |
|---|---|---|
| 背景 | `--layplux-background` | 默认背景色 |
| | `--layplux-background-deep` | 主体区域更深背景 |
| 前景 | `--layplux-foreground` | 默认文字色 |
| 卡片 | `--layplux-card` / `--layplux-card-foreground` | Card 背景/文字 |
| 弹出层 | `--layplux-popover` / `--layplux-popover-foreground` | Popover 等弹出层 |
| | `--layplux-popup-z-index` | 弹出层基础层级 |
| 静音 | `--layplux-muted` / `--layplux-muted-foreground` | 柔和背景/文字 |
| 主题色 | `--layplux-primary` / `--layplux-primary-foreground` | 主题色 |
| 破坏性 | `--layplux-destructive` / `--layplux-destructive-foreground` | 破坏性操作 |
| 信息 | `--layplux-info` / `--layplux-info-foreground` | 信息提示 |
| 成功 | `--layplux-success` / `--layplux-success-foreground` | 成功提示 |
| 警告 | `--layplux-warning` / `--layplux-warning-foreground` | 警告提示 |
| 次要 | `--layplux-secondary` / `--layplux-secondary-foreground` | 次要颜色 |
| 强调 | `--layplux-accent` / `--layplux-accent-dark` / `--layplux-accent-darker` / `--layplux-accent-lighter` / `--layplux-accent-hover` / `--layplux-accent-foreground` | 强调效果 |
| 深色 | `--layplux-heavy` / `--layplux-heavy-foreground` | 深色元素 |
| 边框 | `--layplux-border` | 默认边框 |
| 输入框 | `--layplux-input` / `--layplux-input-placeholder` / `--layplux-input-background` | 输入框样式 |
| 焦点 | `--layplux-ring` | 焦点环 |
| 圆角 | `--layplux-radius` | 基本圆角 |
| 遮罩 | `--layplux-overlay` / `--layplux-overlay-content` | 遮罩颜色 |
| 字体 | `--layplux-font-family` / `--layplux-font-size-base` | 字体相关 |
| 布局 | `--layplux-sidebar` / `--layplux-sidebar-deep` / `--layplux-menu` / `--layplux-header` | 布局组件 |

## 组件样式层

### 编写规范

- 每个组件一个 SCSS partial（`_{component}.scss`）
- 使用 SCSS 语法（`@use`、嵌套、`&` 父选择器引用）
- 直接引用 token：`hsl(var(--layplux-background))`
- 不做 SCSS 变量桥接层

### 命名规范

- BEM 风格：`.block__element--modifier`
- 组件根类名即文件名（`.stripe`、`.tool-window`、`.status-bar`）
- 避免和宿主应用全局样式冲突

### 局部变量

布局相关的固定值用 SCSS 变量，不放入 CSS 自定义属性：

```scss
$stripe-width: 40px;
$title-bar-height: 28px;
$status-bar-height: 24px;
```

### 示例

```scss
// _stripe.scss
.stripe {
  background-color: hsl(var(--layplux-background));
  border-right: 1px solid hsl(var(--layplux-border));

  &__button {
    color: hsl(var(--layplux-muted-foreground));

    &--active {
      background-color: hsl(var(--layplux-accent));
      color: hsl(var(--layplux-accent-foreground));
    }

    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &--error {
      color: hsl(var(--layplux-destructive));
    }
  }
}
```

## 外部扩展主题

消费者在引入 `layplux.css` 后，在自己的 CSS 中扩展：

```css
.layplux-root[data-theme='my-brand'] {
  --layplux-primary: 280 65% 50%;
  --layplux-ring: 280 65% 50%;
  --layplux-radius: 0.75rem;
}

.layplux-root.dark[data-theme='my-brand'],
.layplux-root[data-theme='my-brand'].dark {
  --layplux-background: 280 10% 6%;
  --layplux-foreground: 280 5% 95%;
  --layplux-card: 280 10% 10%;
  --layplux-border: 280 5% 18%;
}
```

无需 JS API，纯 CSS 层覆盖。Layplux 组件容器设置对应属性后自动响应。内部预设主题同样遵循此机制。

## 后续设计

以下内容不在本次范围内，后续单独设计：

- **构建管线**：SCSS 编译方式（Vite CSS 提取 vs 独立 sass CLI），产物路径
- **组件属性控制**：通过 JS 属性控制主题/模式切换（`layplux.theme = 'violet'`、`layplux.darkMode = true`）
