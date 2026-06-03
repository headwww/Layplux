# Layplux 主题系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 CSS token 文件转换为 SCSS partial 架构，所有 token 加 `--layplux-` 前缀并挂载到 `.layplux-root` 容器，为每个布局组件创建 SCSS 样式文件。

**Architecture:** Token 层（`_tokens.scss` + `_tokens-dark.scss`）定义 CSS 自定义属性，组件样式层（`components/_*.scss`）通过 `var(--layplux-*)` 引用 token，`layplux.scss` 作为唯一入口 `@use` 所有 partial。

**Tech Stack:** SCSS

---

## 文件结构变更

```
styles/                               (现有)
├── base/
│   ├── default.css                   → 删除，内容迁移到 _tokens.scss
│   └── dark.css                      → 删除，内容迁移到 _tokens-dark.scss
├── root-pane-tsx.scss                → 删除，拆入 components/
└── layplux.scss                      → 修改

styles/                               (目标)
├── base/
│   ├── _tokens.scss                  ← 创建 (亮色 + 所有亮色主题)
│   └── _tokens-dark.scss             ← 创建 (暗色 + 所有暗色主题)
├── components/
│   ├── _root-pane.scss               ← 创建
│   ├── _skeleton.scss                ← 创建
│   ├── _stripe.scss                  ← 创建
│   ├── _tool-window.scss             ← 创建
│   ├── _editor-area.scss             ← 创建
│   ├── _status-bar.scss              ← 创建
│   ├── _glass-pane.scss              ← 创建
│   ├── _main-tool-bar.scss           ← 创建
│   └── _bottom-tool-bar.scss         ← 创建
└── layplux.scss                      ← 修改
```

---

### Task 1: 创建亮色 token 文件 `_tokens.scss`

**Files:**
- Create: `packages/layplux/src/styles/base/_tokens.scss`

- [ ] **Step 1: 写入 `_tokens.scss`**

将 `default.css` 的内容做以下变换后写入 `base/_tokens.scss`：
- `:root` → `.layplux-root`
- `[data-theme='xxx']` → `.layplux-root[data-theme='xxx']`
- 所有 `--xxx` → `--layplux-xxx`
- `--info` 和 `--info-foreground` 中逗号改空格

```scss
.layplux-root {
  --layplux-popup-z-index: 2000;
  --layplux-font-family: -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, 'Helvetica Neue', arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';

  --layplux-background: 0 0% 100%;
  --layplux-background-deep: 216 20.11% 95.47%;
  --layplux-foreground: 210 6% 21%;

  --layplux-card: 0 0% 100%;
  --layplux-card-foreground: 222.2 84% 4.9%;

  --layplux-popover: 0 0% 100%;
  --layplux-popover-foreground: 222.2 84% 4.9%;

  --layplux-muted: 240 4.8% 95.9%;
  --layplux-muted-foreground: 240 3.8% 46.1%;

  --layplux-primary: 212 100% 45%;
  --layplux-primary-foreground: 0 0% 98%;

  --layplux-destructive: 359.33 100% 65.1%;
  --layplux-destructive-foreground: 0 0% 98%;

  --layplux-info: 240 5% 96%;
  --layplux-info-foreground: 220 4% 58%;

  --layplux-success: 144 57% 58%;
  --layplux-success-foreground: 0 0% 98%;

  --layplux-warning: 42 84% 61%;
  --layplux-warning-foreground: 0 0% 98%;

  --layplux-secondary: 240 5% 96%;
  --layplux-secondary-foreground: 240 6% 10%;

  --layplux-accent: 240 5% 96%;
  --layplux-accent-dark: 216 14% 93%;
  --layplux-accent-darker: 216 11% 91%;
  --layplux-accent-lighter: 240 0% 98%;
  --layplux-accent-hover: 200deg 10% 90%;
  --layplux-accent-foreground: 240 6% 10%;

  --layplux-heavy: 192deg 9.43% 89.61%;
  --layplux-heavy-foreground: var(--layplux-accent-foreground);

  --layplux-border: 240 5.9% 90%;

  --layplux-input: 240deg 5.88% 90%;
  --layplux-input-placeholder: 217 10.6% 65%;
  --layplux-input-background: 0 0% 100%;

  --layplux-ring: 222.2 84% 4.9%;

  --layplux-radius: 0.5rem;

  --layplux-overlay: 0 0% 0% / 45%;
  --layplux-overlay-content: 0 0% 95% / 45%;

  --layplux-font-size-base: 16px;

  --layplux-sidebar: 0 0% 100%;
  --layplux-sidebar-deep: 0 0% 100%;
  --layplux-menu: var(--layplux-sidebar);

  --layplux-header: 0 0% 100%;

  accent-color: var(--layplux-primary);
  color-scheme: light;
}

.layplux-root[data-theme='violet'] {
  --layplux-foreground: 224 71.4% 4.1%;
  --layplux-card: 0 0% 100%;
  --layplux-card-foreground: 224 71.4% 4.1%;
  --layplux-popover: 0 0% 100%;
  --layplux-popover-foreground: 224 71.4% 4.1%;
  --layplux-primary-foreground: 210 20% 98%;
  --layplux-secondary: 220 14.3% 95.9%;
  --layplux-secondary-foreground: 220.9 39.3% 11%;
  --layplux-muted: 220 14.3% 95.9%;
  --layplux-muted-foreground: 220 8.9% 46.1%;
  --layplux-accent: 220 14.3% 95.9%;
  --layplux-accent-foreground: 220.9 39.3% 11%;
  --layplux-destructive: 0 84.2% 60.2%;
  --layplux-destructive-foreground: 210 20% 98%;
  --layplux-border: 220 13% 91%;
  --layplux-input: 220 13% 91%;
  --layplux-ring: 262.1 83.3% 57.8%;
}

.layplux-root[data-theme='pink'] {
  --layplux-foreground: 240 10% 3.9%;
  --layplux-card: 0 0% 100%;
  --layplux-card-foreground: 240 10% 3.9%;
  --layplux-popover: 0 0% 100%;
  --layplux-popover-foreground: 240 10% 3.9%;
  --layplux-primary-foreground: 355.7 100% 97.3%;
  --layplux-secondary: 240 4.8% 95.9%;
  --layplux-secondary-foreground: 240 5.9% 10%;
  --layplux-muted: 240 4.8% 95.9%;
  --layplux-muted-foreground: 240 3.8% 46.1%;
  --layplux-accent: 240 4.8% 95.9%;
  --layplux-accent-foreground: 240 5.9% 10%;
  --layplux-destructive: 0 84.2% 60.2%;
  --layplux-destructive-foreground: 0 0% 98%;
  --layplux-border: 240 5.9% 90%;
  --layplux-input: 240 5.9% 90%;
  --layplux-ring: 346.8 77.2% 49.8%;
}

.layplux-root[data-theme='rose'] {
  --layplux-foreground: 240 10% 3.9%;
  --layplux-card: 0 0% 100%;
  --layplux-card-foreground: 240 10% 3.9%;
  --layplux-popover: 0 0% 100%;
  --layplux-popover-foreground: 240 10% 3.9%;
  --layplux-primary-foreground: 355.7 100% 97.3%;
  --layplux-secondary: 240 4.8% 95.9%;
  --layplux-secondary-foreground: 240 5.9% 10%;
  --layplux-muted: 240 4.8% 95.9%;
  --layplux-muted-foreground: 240 3.8% 46.1%;
  --layplux-accent: 240 4.8% 95.9%;
  --layplux-accent-foreground: 240 5.9% 10%;
  --layplux-destructive: 0 84.2% 60.2%;
  --layplux-destructive-foreground: 0 0% 98%;
  --layplux-border: 240 5.9% 90%;
  --layplux-input: 240 5.9% 90%;
  --layplux-ring: 346.8 77.2% 49.8%;
}

.layplux-root[data-theme='sky-blue'] {
  --layplux-foreground: 222.2 84% 4.9%;
  --layplux-card: 0 0% 100%;
  --layplux-card-foreground: 222.2 84% 4.9%;
  --layplux-popover: 0 0% 100%;
  --layplux-popover-foreground: 222.2 84% 4.9%;
  --layplux-primary-foreground: 210 40% 98%;
  --layplux-secondary: 210 40% 96.1%;
  --layplux-secondary-foreground: 222.2 47.4% 11.2%;
  --layplux-muted: 210 40% 96.1%;
  --layplux-muted-foreground: 215.4 16.3% 46.9%;
  --layplux-accent: 210 40% 96.1%;
  --layplux-accent-foreground: 222.2 47.4% 11.2%;
  --layplux-destructive: 0 84.2% 60.2%;
  --layplux-destructive-foreground: 210 40% 98%;
  --layplux-border: 214.3 31.8% 91.4%;
  --layplux-input: 214.3 31.8% 91.4%;
  --layplux-ring: 221.2 83.2% 53.3%;
}

.layplux-root[data-theme='deep-blue'] {
  --layplux-foreground: 222.2 84% 4.9%;
  --layplux-card: 0 0% 100%;
  --layplux-card-foreground: 222.2 84% 4.9%;
  --layplux-popover: 0 0% 100%;
  --layplux-popover-foreground: 222.2 84% 4.9%;
  --layplux-primary-foreground: 210 40% 98%;
  --layplux-secondary: 210 40% 96.1%;
  --layplux-secondary-foreground: 222.2 47.4% 11.2%;
  --layplux-muted: 210 40% 96.1%;
  --layplux-muted-foreground: 215.4 16.3% 46.9%;
  --layplux-accent: 210 40% 96.1%;
  --layplux-accent-foreground: 222.2 47.4% 11.2%;
  --layplux-destructive: 0 84.2% 60.2%;
  --layplux-destructive-foreground: 210 40% 98%;
  --layplux-border: 214.3 31.8% 91.4%;
  --layplux-input: 214.3 31.8% 91.4%;
  --layplux-ring: 221.2 83.2% 53.3%;
}

.layplux-root[data-theme='green'] {
  --layplux-foreground: 240 10% 3.9%;
  --layplux-card: 0 0% 100%;
  --layplux-card-foreground: 240 10% 3.9%;
  --layplux-popover: 0 0% 100%;
  --layplux-popover-foreground: 240 10% 3.9%;
  --layplux-primary-foreground: 355.7 100% 97.3%;
  --layplux-secondary: 240 4.8% 95.9%;
  --layplux-secondary-foreground: 240 5.9% 10%;
  --layplux-muted: 240 4.8% 95.9%;
  --layplux-muted-foreground: 240 3.8% 46.1%;
  --layplux-accent: 240 4.8% 95.9%;
  --layplux-accent-foreground: 240 5.9% 10%;
  --layplux-destructive: 0 84.2% 60.2%;
  --layplux-destructive-foreground: 0 0% 98%;
  --layplux-border: 240 5.9% 90%;
  --layplux-input: 240 5.9% 90%;
  --layplux-ring: 142.1 76.2% 36.3%;
}

.layplux-root[data-theme='deep-green'] {
  --layplux-foreground: 240 10% 3.9%;
  --layplux-card: 0 0% 100%;
  --layplux-card-foreground: 240 10% 3.9%;
  --layplux-popover: 0 0% 100%;
  --layplux-popover-foreground: 240 10% 3.9%;
  --layplux-primary-foreground: 355.7 100% 97.3%;
  --layplux-secondary: 240 4.8% 95.9%;
  --layplux-secondary-foreground: 240 5.9% 10%;
  --layplux-muted: 240 4.8% 95.9%;
  --layplux-muted-foreground: 240 3.8% 46.1%;
  --layplux-accent: 240 4.8% 95.9%;
  --layplux-accent-foreground: 240 5.9% 10%;
  --layplux-destructive: 0 84.2% 60.2%;
  --layplux-destructive-foreground: 0 0% 98%;
  --layplux-border: 240 5.9% 90%;
  --layplux-input: 240 5.9% 90%;
  --layplux-ring: 142.1 76.2% 36.3%;
}

.layplux-root[data-theme='orange'] {
  --layplux-foreground: 20 14.3% 4.1%;
  --layplux-card: 0 0% 100%;
  --layplux-card-foreground: 20 14.3% 4.1%;
  --layplux-popover: 0 0% 100%;
  --layplux-popover-foreground: 20 14.3% 4.1%;
  --layplux-primary-foreground: 60 9.1% 97.8%;
  --layplux-secondary: 60 4.8% 95.9%;
  --layplux-secondary-foreground: 24 9.8% 10%;
  --layplux-muted: 60 4.8% 95.9%;
  --layplux-muted-foreground: 25 5.3% 44.7%;
  --layplux-accent: 60 4.8% 95.9%;
  --layplux-accent-foreground: 24 9.8% 10%;
  --layplux-destructive: 0 84.2% 60.2%;
  --layplux-destructive-foreground: 60 9.1% 97.8%;
  --layplux-border: 20 5.9% 90%;
  --layplux-input: 20 5.9% 90%;
  --layplux-ring: 24.6 95% 53.1%;
}

.layplux-root[data-theme='yellow'] {
  --layplux-foreground: 20 14.3% 4.1%;
  --layplux-card: 0 0% 100%;
  --layplux-card-foreground: 20 14.3% 4.1%;
  --layplux-popover: 0 0% 100%;
  --layplux-popover-foreground: 20 14.3% 4.1%;
  --layplux-primary-foreground: 26 83.3% 14.1%;
  --layplux-secondary: 60 4.8% 95.9%;
  --layplux-secondary-foreground: 24 9.8% 10%;
  --layplux-muted: 60 4.8% 95.9%;
  --layplux-muted-foreground: 25 5.3% 44.7%;
  --layplux-accent: 60 4.8% 95.9%;
  --layplux-accent-foreground: 24 9.8% 10%;
  --layplux-destructive: 0 84.2% 60.2%;
  --layplux-destructive-foreground: 60 9.1% 97.8%;
  --layplux-border: 20 5.9% 90%;
  --layplux-input: 20 5.9% 90%;
  --layplux-ring: 20 14.3% 4.1%;
}

.layplux-root[data-theme='zinc'] {
  --layplux-foreground: 240 10% 3.9%;
  --layplux-card: 0 0% 100%;
  --layplux-card-foreground: 240 10% 3.9%;
  --layplux-popover: 0 0% 100%;
  --layplux-popover-foreground: 240 10% 3.9%;
  --layplux-primary-foreground: 0 0% 98%;
  --layplux-secondary: 240 4.8% 95.9%;
  --layplux-secondary-foreground: 240 5.9% 10%;
  --layplux-muted: 240 4.8% 95.9%;
  --layplux-muted-foreground: 240 3.8% 46.1%;
  --layplux-accent: 240 4.8% 95.9%;
  --layplux-accent-foreground: 240 5.9% 10%;
  --layplux-destructive: 0 84.2% 60.2%;
  --layplux-destructive-foreground: 0 0% 98%;
  --layplux-border: 240 5.9% 90%;
  --layplux-input: 240 5.9% 90%;
  --layplux-ring: 240 5.9% 10%;
}

.layplux-root[data-theme='neutral'] {
  --layplux-foreground: 0 0% 3.9%;
  --layplux-card: 0 0% 100%;
  --layplux-card-foreground: 0 0% 3.9%;
  --layplux-popover: 0 0% 100%;
  --layplux-popover-foreground: 0 0% 3.9%;
  --layplux-primary-foreground: 0 0% 98%;
  --layplux-secondary: 0 0% 96.1%;
  --layplux-secondary-foreground: 0 0% 9%;
  --layplux-muted: 0 0% 96.1%;
  --layplux-muted-foreground: 0 0% 45.1%;
  --layplux-accent: 0 0% 96.1%;
  --layplux-accent-foreground: 0 0% 9%;
  --layplux-destructive: 0 84.2% 60.2%;
  --layplux-destructive-foreground: 0 0% 98%;
  --layplux-border: 0 0% 89.8%;
  --layplux-input: 0 0% 89.8%;
  --layplux-ring: 0 0% 3.9%;
}

.layplux-root[data-theme='slate'] {
  --layplux-foreground: 222.2 84% 4.9%;
  --layplux-card: 0 0% 100%;
  --layplux-card-foreground: 222.2 84% 4.9%;
  --layplux-popover: 0 0% 100%;
  --layplux-popover-foreground: 222.2 84% 4.9%;
  --layplux-primary-foreground: 210 40% 98%;
  --layplux-secondary: 210 40% 96.1%;
  --layplux-secondary-foreground: 222.2 47.4% 11.2%;
  --layplux-muted: 210 40% 96.1%;
  --layplux-muted-foreground: 215.4 16.3% 46.9%;
  --layplux-accent: 210 40% 96.1%;
  --layplux-accent-foreground: 222.2 47.4% 11.2%;
  --layplux-destructive: 0 84.2% 60.2%;
  --layplux-destructive-foreground: 210 40% 98%;
  --layplux-border: 214.3 31.8% 91.4%;
  --layplux-input: 214.3 31.8% 91.4%;
  --layplux-ring: 222.2 84% 4.9%;
}

.layplux-root[data-theme='gray'] {
  --layplux-foreground: 224 71.4% 4.1%;
  --layplux-card: 0 0% 100%;
  --layplux-card-foreground: 224 71.4% 4.1%;
  --layplux-popover: 0 0% 100%;
  --layplux-popover-foreground: 224 71.4% 4.1%;
  --layplux-primary-foreground: 210 20% 98%;
  --layplux-secondary: 220 14.3% 95.9%;
  --layplux-secondary-foreground: 220.9 39.3% 11%;
  --layplux-muted: 220 14.3% 95.9%;
  --layplux-muted-foreground: 220 8.9% 46.1%;
  --layplux-accent: 220 14.3% 95.9%;
  --layplux-accent-foreground: 220.9 39.3% 11%;
  --layplux-destructive: 0 84.2% 60.2%;
  --layplux-destructive-foreground: 210 20% 98%;
  --layplux-border: 220 13% 91%;
  --layplux-input: 220 13% 91%;
  --layplux-ring: 224 71.4% 4.1%;
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/layplux/src/styles/base/_tokens.scss
git commit -m "feat(styles): add light mode token partial with --layplux- prefix"
```

---

### Task 2: 创建暗色 token 文件 `_tokens-dark.scss`

**Files:**
- Create: `packages/layplux/src/styles/base/_tokens-dark.scss`

- [ ] **Step 1: 写入 `_tokens-dark.scss`**

将 `dark.css` 的内容做以下变换后写入 `base/_tokens-dark.scss`：
- `.dark` / `.dark[data-theme='xxx']` → `.layplux-root.dark` / `.layplux-root.dark[data-theme='xxx']`
- `[data-theme='xxx'] .dark` → `.layplux-root[data-theme='xxx'].dark`
- 所有 `--xxx` → `--layplux-xxx`
- `--info` 和 `--info-foreground` 中逗号改空格

```scss
.layplux-root.dark,
.layplux-root.dark[data-theme='custom'],
.layplux-root.dark[data-theme='default'] {
  --layplux-background: 222.34deg 10.43% 12.27%;
  --layplux-background-deep: 220deg 13.06% 9%;
  --layplux-foreground: 0 0% 95%;

  --layplux-card: 222.34deg 10.43% 12.27%;
  --layplux-card-foreground: 210 40% 98%;

  --layplux-popover: 0 0% 14.2%;
  --layplux-popover-foreground: 210 40% 98%;

  --layplux-muted: 240 3.7% 15.9%;
  --layplux-muted-foreground: 240 5% 64.9%;

  --layplux-primary-foreground: 0 0% 98%;

  --layplux-destructive: 359.21 68.47% 56.47%;
  --layplux-destructive-foreground: 0 0% 98%;

  --layplux-info: 180 1.54% 12.75%;
  --layplux-info-foreground: 220 4% 58%;

  --layplux-success: 144 57% 58%;
  --layplux-success-foreground: 0 0% 98%;

  --layplux-warning: 42 84% 61%;
  --layplux-warning-foreground: 0 0% 98%;

  --layplux-secondary: 240 5% 17%;
  --layplux-secondary-foreground: 0 0% 98%;

  --layplux-accent: 216 5% 19%;
  --layplux-accent-dark: 240 0% 22%;
  --layplux-accent-darker: 240 0% 26%;
  --layplux-accent-lighter: 216 5% 12%;
  --layplux-accent-hover: 216 5% 24%;
  --layplux-accent-foreground: 0 0% 98%;

  --layplux-heavy: 216 5% 24%;
  --layplux-heavy-foreground: var(--layplux-accent-foreground);

  --layplux-border: 240 3.7% 22%;

  --layplux-input: 0deg 0% 100% / 10%;
  --layplux-input-placeholder: 218deg 11% 65%;
  --layplux-input-background: 0deg 0% 100% / 5%;

  --layplux-ring: 222.2 84% 4.9%;

  --layplux-radius: 0.5rem;

  --layplux-overlay: 0deg 0% 0% / 40%;
  --layplux-overlay-content: 0deg 0% 0% / 40%;

  --layplux-font-size-base: 16px;

  --layplux-sidebar: 222.34deg 10.43% 12.27%;
  --layplux-sidebar-deep: 220deg 13.06% 9%;
  --layplux-menu: var(--layplux-sidebar);

  --layplux-header: 222.34deg 10.43% 12.27%;

  color-scheme: dark;
}

.layplux-root.dark[data-theme='violet'],
.layplux-root[data-theme='violet'].dark {
  --layplux-background: 224 71.4% 4.1%;
  --layplux-background-deep: var(--layplux-background);
  --layplux-foreground: 210 20% 98%;
  --layplux-card: 224 71.4% 4.1%;
  --layplux-card-foreground: 210 20% 98%;
  --layplux-popover: 224 71.4% 4.1%;
  --layplux-popover-foreground: 210 20% 98%;
  --layplux-primary-foreground: 210 20% 98%;
  --layplux-secondary: 215 27.9% 16.9%;
  --layplux-secondary-foreground: 210 20% 98%;
  --layplux-muted: 215 27.9% 16.9%;
  --layplux-muted-foreground: 217.9 10.6% 64.9%;
  --layplux-accent: 215 27.9% 16.9%;
  --layplux-accent-foreground: 210 20% 98%;
  --layplux-destructive: 359.21 68.47% 56.47%;
  --layplux-destructive-foreground: 210 20% 98%;
  --layplux-border: 215 27.9% 16.9%;
  --layplux-input: 215 27.9% 16.9%;
  --layplux-ring: 263.4 70% 50.4%;
  --layplux-sidebar: 224 71.4% 4.1%;
  --layplux-sidebar-deep: 224 71.4% 4.1%;
  --layplux-header: 224 71.4% 4.1%;
}

.layplux-root.dark[data-theme='pink'],
.layplux-root[data-theme='pink'].dark {
  --layplux-background: 20 14.3% 4.1%;
  --layplux-background-deep: var(--layplux-background);
  --layplux-foreground: 0 0% 95%;
  --layplux-card: 0 0% 9%;
  --layplux-card-foreground: 0 0% 95%;
  --layplux-popover: 0 0% 9%;
  --layplux-popover-foreground: 0 0% 95%;
  --layplux-primary-foreground: 355.7 100% 97.3%;
  --layplux-secondary: 240 3.7% 15.9%;
  --layplux-secondary-foreground: 0 0% 98%;
  --layplux-muted: 0 0% 15%;
  --layplux-muted-foreground: 240 5% 64.9%;
  --layplux-accent: 12 6.5% 15.1%;
  --layplux-accent-foreground: 0 0% 98%;
  --layplux-destructive: 359.21 68.47% 56.47%;
  --layplux-destructive-foreground: 0 85.7% 97.3%;
  --layplux-border: 240 3.7% 15.9%;
  --layplux-input: 240 3.7% 15.9%;
  --layplux-ring: 346.8 77.2% 49.8%;
  --layplux-sidebar: 20 14.3% 4.1%;
  --layplux-sidebar-deep: 20 14.3% 4.1%;
  --layplux-header: 20 14.3% 4.1%;
}

.layplux-root.dark[data-theme='rose'],
.layplux-root[data-theme='rose'].dark {
  --layplux-background: 0 0% 3.9%;
  --layplux-background-deep: var(--layplux-background);
  --layplux-foreground: 0 0% 98%;
  --layplux-card: 0 0% 3.9%;
  --layplux-card-foreground: 0 0% 98%;
  --layplux-popover: 0 0% 3.9%;
  --layplux-popover-foreground: 0 0% 98%;
  --layplux-primary-foreground: 0 85.7% 97.3%;
  --layplux-secondary: 0 0% 14.9%;
  --layplux-secondary-foreground: 0 0% 98%;
  --layplux-muted: 0 0% 14.9%;
  --layplux-muted-foreground: 0 0% 63.9%;
  --layplux-accent: 0 0% 14.9%;
  --layplux-accent-foreground: 0 0% 98%;
  --layplux-destructive: 359.21 68.47% 56.47%;
  --layplux-destructive-foreground: 0 0% 98%;
  --layplux-border: 0 0% 14.9%;
  --layplux-input: 0 0% 14.9%;
  --layplux-ring: 0 72.2% 50.6%;
  --layplux-sidebar: 0 0% 3.9%;
  --layplux-sidebar-deep: 0 0% 3.9%;
  --layplux-header: 0 0% 3.9%;
}

.layplux-root.dark[data-theme='sky-blue'],
.layplux-root[data-theme='sky-blue'].dark {
  --layplux-background: 222.2 84% 4.9%;
  --layplux-background-deep: var(--layplux-background);
  --layplux-foreground: 210 40% 98%;
  --layplux-card: 222.2 84% 4.9%;
  --layplux-card-foreground: 210 40% 98%;
  --layplux-popover: 222.2 84% 4.9%;
  --layplux-popover-foreground: 210 40% 98%;
  --layplux-primary-foreground: 210 20% 98%;
  --layplux-secondary: 217.2 32.6% 17.5%;
  --layplux-secondary-foreground: 210 40% 98%;
  --layplux-muted: 217.2 32.6% 17.5%;
  --layplux-muted-foreground: 215 20.2% 65.1%;
  --layplux-accent: 217.2 32.6% 17.5%;
  --layplux-accent-foreground: 210 40% 98%;
  --layplux-destructive: 359.21 68.47% 56.47%;
  --layplux-destructive-foreground: 210 40% 98%;
  --layplux-border: 217.2 32.6% 17.5%;
  --layplux-input: 217.2 32.6% 17.5%;
  --layplux-ring: 224.3 76.3% 48%;
  --layplux-sidebar: 222.2 84% 4.9%;
  --layplux-sidebar-deep: 222.2 84% 4.9%;
  --layplux-header: 222.2 84% 4.9%;
}

.layplux-root.dark[data-theme='deep-blue'],
.layplux-root[data-theme='deep-blue'].dark {
  --layplux-background: 222.2 84% 4.9%;
  --layplux-background-deep: var(--layplux-background);
  --layplux-foreground: 210 40% 98%;
  --layplux-card: 222.2 84% 4.9%;
  --layplux-card-foreground: 210 40% 98%;
  --layplux-popover: 222.2 84% 4.9%;
  --layplux-popover-foreground: 210 40% 98%;
  --layplux-primary-foreground: 210 20% 98%;
  --layplux-secondary: 217.2 32.6% 17.5%;
  --layplux-secondary-foreground: 210 40% 98%;
  --layplux-muted: 217.2 32.6% 17.5%;
  --layplux-muted-foreground: 215 20.2% 65.1%;
  --layplux-accent: 217.2 32.6% 17.5%;
  --layplux-accent-foreground: 210 40% 98%;
  --layplux-destructive: 359.21 68.47% 56.47%;
  --layplux-destructive-foreground: 210 40% 98%;
  --layplux-border: 217.2 32.6% 17.5%;
  --layplux-input: 217.2 32.6% 17.5%;
  --layplux-ring: 224.3 76.3% 48%;
  --layplux-sidebar: 222.2 84% 4.9%;
  --layplux-sidebar-deep: 222.2 84% 4.9%;
  --layplux-header: 222.2 84% 4.9%;
}

.layplux-root.dark[data-theme='green'],
.layplux-root[data-theme='green'].dark {
  --layplux-background: 20 14.3% 4.1%;
  --layplux-background-deep: var(--layplux-background);
  --layplux-foreground: 0 0% 95%;
  --layplux-card: 24 9.8% 6%;
  --layplux-card-foreground: 0 0% 95%;
  --layplux-popover: 0 0% 9%;
  --layplux-popover-foreground: 0 0% 95%;
  --layplux-primary-foreground: 210 20% 98%;
  --layplux-secondary: 240 3.7% 15.9%;
  --layplux-secondary-foreground: 0 0% 98%;
  --layplux-muted: 0 0% 15%;
  --layplux-muted-foreground: 240 5% 64.9%;
  --layplux-accent: 12 6.5% 15.1%;
  --layplux-accent-foreground: 0 0% 98%;
  --layplux-destructive: 359.21 68.47% 56.47%;
  --layplux-destructive-foreground: 0 85.7% 97.3%;
  --layplux-border: 240 3.7% 15.9%;
  --layplux-input: 240 3.7% 15.9%;
  --layplux-ring: 142.4 71.8% 29.2%;
  --layplux-sidebar: 20 14.3% 4.1%;
  --layplux-sidebar-deep: 20 14.3% 4.1%;
  --layplux-header: 20 14.3% 4.1%;
}

.layplux-root.dark[data-theme='deep-green'],
.layplux-root[data-theme='deep-green'].dark {
  --layplux-background: 20 14.3% 4.1%;
  --layplux-background-deep: var(--layplux-background);
  --layplux-foreground: 0 0% 95%;
  --layplux-card: 24 9.8% 6%;
  --layplux-card-foreground: 0 0% 95%;
  --layplux-popover: 0 0% 9%;
  --layplux-popover-foreground: 0 0% 95%;
  --layplux-primary-foreground: 210 20% 98%;
  --layplux-secondary: 240 3.7% 15.9%;
  --layplux-secondary-foreground: 0 0% 98%;
  --layplux-muted: 0 0% 15%;
  --layplux-muted-foreground: 240 5% 64.9%;
  --layplux-accent: 12 6.5% 15.1%;
  --layplux-accent-foreground: 0 0% 98%;
  --layplux-destructive: 359.21 68.47% 56.47%;
  --layplux-destructive-foreground: 0 85.7% 97.3%;
  --layplux-border: 240 3.7% 15.9%;
  --layplux-input: 240 3.7% 15.9%;
  --layplux-ring: 142.4 71.8% 29.2%;
  --layplux-sidebar: 20 14.3% 4.1%;
  --layplux-sidebar-deep: 20 14.3% 4.1%;
  --layplux-header: 20 14.3% 4.1%;
}

.layplux-root.dark[data-theme='orange'],
.layplux-root[data-theme='orange'].dark {
  --layplux-background: 20 14.3% 4.1%;
  --layplux-background-deep: var(--layplux-background);
  --layplux-foreground: 60 9.1% 97.8%;
  --layplux-card: 20 14.3% 4.1%;
  --layplux-card-foreground: 60 9.1% 97.8%;
  --layplux-popover: 20 14.3% 4.1%;
  --layplux-popover-foreground: 60 9.1% 97.8%;
  --layplux-primary-foreground: 60 9.1% 97.8%;
  --layplux-secondary: 12 6.5% 15.1%;
  --layplux-secondary-foreground: 60 9.1% 97.8%;
  --layplux-muted: 12 6.5% 15.1%;
  --layplux-muted-foreground: 24 5.4% 63.9%;
  --layplux-accent: 12 6.5% 15.1%;
  --layplux-accent-foreground: 60 9.1% 97.8%;
  --layplux-destructive: 0 72.2% 50.6%;
  --layplux-destructive-foreground: 60 9.1% 97.8%;
  --layplux-border: 12 6.5% 15.1%;
  --layplux-input: 12 6.5% 15.1%;
  --layplux-ring: 20.5 90.2% 48.2%;
  --layplux-sidebar: 20 14.3% 4.1%;
  --layplux-sidebar-deep: 20 14.3% 4.1%;
  --layplux-header: 20 14.3% 4.1%;
}

.layplux-root.dark[data-theme='yellow'],
.layplux-root[data-theme='yellow'].dark {
  --layplux-background: 20 14.3% 4.1%;
  --layplux-background-deep: var(--layplux-background);
  --layplux-foreground: 60 9.1% 97.8%;
  --layplux-card: 20 14.3% 4.1%;
  --layplux-card-foreground: 60 9.1% 97.8%;
  --layplux-popover: 20 14.3% 4.1%;
  --layplux-popover-foreground: 60 9.1% 97.8%;
  --layplux-primary-foreground: 26 83.3% 14.1%;
  --layplux-secondary: 12 6.5% 15.1%;
  --layplux-secondary-foreground: 60 9.1% 97.8%;
  --layplux-muted: 12 6.5% 15.1%;
  --layplux-muted-foreground: 24 5.4% 63.9%;
  --layplux-accent: 12 6.5% 15.1%;
  --layplux-accent-foreground: 60 9.1% 97.8%;
  --layplux-destructive: 359.21 68.47% 56.47%;
  --layplux-destructive-foreground: 60 9.1% 97.8%;
  --layplux-border: 12 6.5% 15.1%;
  --layplux-input: 12 6.5% 15.1%;
  --layplux-ring: 35.5 91.7% 32.9%;
  --layplux-sidebar: 20 14.3% 4.1%;
  --layplux-sidebar-deep: 20 14.3% 4.1%;
  --layplux-header: 20 14.3% 4.1%;
}

.layplux-root.dark[data-theme='zinc'],
.layplux-root[data-theme='zinc'].dark {
  --layplux-background: 240 10% 3.9%;
  --layplux-background-deep: var(--layplux-background);
  --layplux-foreground: 0 0% 98%;
  --layplux-card: 240 10% 3.9%;
  --layplux-card-foreground: 0 0% 98%;
  --layplux-popover: 240 10% 3.9%;
  --layplux-popover-foreground: 0 0% 98%;
  --layplux-primary-foreground: 240 5.9% 10%;
  --layplux-secondary: 240 3.7% 15.9%;
  --layplux-secondary-foreground: 0 0% 98%;
  --layplux-muted: 240 3.7% 15.9%;
  --layplux-muted-foreground: 240 5% 64.9%;
  --layplux-accent: 240 3.7% 15.9%;
  --layplux-accent-foreground: 0 0% 98%;
  --layplux-destructive: 359.21 68.47% 56.47%;
  --layplux-destructive-foreground: 0 0% 98%;
  --layplux-border: 240 3.7% 15.9%;
  --layplux-input: 240 3.7% 15.9%;
  --layplux-ring: 240 4.9% 83.9%;
  --layplux-sidebar: 240 10% 3.9%;
  --layplux-sidebar-deep: 240 10% 3.9%;
  --layplux-header: 240 10% 3.9%;
}

.layplux-root.dark[data-theme='neutral'],
.layplux-root[data-theme='neutral'].dark {
  --layplux-background: 0 0% 3.9%;
  --layplux-background-deep: var(--layplux-background);
  --layplux-foreground: 0 0% 98%;
  --layplux-card: 0 0% 3.9%;
  --layplux-card-foreground: 0 0% 98%;
  --layplux-popover: 0 0% 3.9%;
  --layplux-popover-foreground: 0 0% 98%;
  --layplux-primary-foreground: 0 0% 9%;
  --layplux-secondary: 0 0% 14.9%;
  --layplux-secondary-foreground: 0 0% 98%;
  --layplux-muted: 0 0% 14.9%;
  --layplux-muted-foreground: 0 0% 63.9%;
  --layplux-accent: 0 0% 14.9%;
  --layplux-accent-foreground: 0 0% 98%;
  --layplux-destructive: 359.21 68.47% 56.47%;
  --layplux-destructive-foreground: 0 0% 98%;
  --layplux-border: 0 0% 14.9%;
  --layplux-input: 0 0% 14.9%;
  --layplux-ring: 0 0% 83.1%;
  --layplux-sidebar: 0 0% 3.9%;
  --layplux-sidebar-deep: 0 0% 3.9%;
  --layplux-header: 0 0% 3.9%;
}

.layplux-root.dark[data-theme='slate'],
.layplux-root[data-theme='slate'].dark {
  --layplux-background: 222.2 84% 4.9%;
  --layplux-background-deep: var(--layplux-background);
  --layplux-foreground: 210 40% 98%;
  --layplux-card: 222.2 84% 4.9%;
  --layplux-card-foreground: 210 40% 98%;
  --layplux-popover: 222.2 84% 4.9%;
  --layplux-popover-foreground: 210 40% 98%;
  --layplux-primary-foreground: 222.2 47.4% 11.2%;
  --layplux-secondary: 217.2 32.6% 17.5%;
  --layplux-secondary-foreground: 210 40% 98%;
  --layplux-muted: 217.2 32.6% 17.5%;
  --layplux-muted-foreground: 215 20.2% 65.1%;
  --layplux-accent: 217.2 32.6% 17.5%;
  --layplux-accent-foreground: 210 40% 98%;
  --layplux-destructive: 359.21 68.47% 56.47%;
  --layplux-destructive-foreground: 210 40% 98%;
  --layplux-border: 217.2 32.6% 17.5%;
  --layplux-input: 217.2 32.6% 17.5%;
  --layplux-ring: 212.7 26.8% 83.9%;
  --layplux-sidebar: 222.2 84% 4.9%;
  --layplux-sidebar-deep: 222.2 84% 4.9%;
  --layplux-header: 222.2 84% 4.9%;
}

.layplux-root.dark[data-theme='gray'],
.layplux-root[data-theme='gray'].dark {
  --layplux-background: 224 71.4% 4.1%;
  --layplux-background-deep: var(--layplux-background);
  --layplux-foreground: 210 20% 98%;
  --layplux-card: 224 71.4% 4.1%;
  --layplux-card-foreground: 210 20% 98%;
  --layplux-popover: 224 71.4% 4.1%;
  --layplux-popover-foreground: 210 20% 98%;
  --layplux-primary-foreground: 220.9 39.3% 11%;
  --layplux-secondary: 215 27.9% 16.9%;
  --layplux-secondary-foreground: 210 20% 98%;
  --layplux-muted: 215 27.9% 16.9%;
  --layplux-muted-foreground: 217.9 10.6% 64.9%;
  --layplux-accent: 215 27.9% 16.9%;
  --layplux-accent-foreground: 210 20% 98%;
  --layplux-destructive: 359.21 68.47% 56.47%;
  --layplux-destructive-foreground: 210 20% 98%;
  --layplux-border: 215 27.9% 16.9%;
  --layplux-input: 215 27.9% 16.9%;
  --layplux-ring: 216 12.2% 83.9%;
  --layplux-sidebar: 224 71.4% 4.1%;
  --layplux-sidebar-deep: 224 71.4% 4.1%;
  --layplux-header: 224 71.4% 4.1%;
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/layplux/src/styles/base/_tokens-dark.scss
git commit -m "feat(styles): add dark mode token partial with --layplux- prefix"
```

---

### Task 3: 更新入口文件 + 删除旧 CSS

**Files:**
- Modify: `packages/layplux/src/styles/layplux.scss`
- Delete: `packages/layplux/src/styles/base/default.css`
- Delete: `packages/layplux/src/styles/base/dark.css`
- Delete: `packages/layplux/src/styles/root-pane-tsx.scss`

- [ ] **Step 1: 重写 `layplux.scss`**

```scss
@use 'base/tokens';
@use 'base/tokens-dark';
```

- [ ] **Step 2: 删除旧文件**

```bash
rm packages/layplux/src/styles/base/default.css
rm packages/layplux/src/styles/base/dark.css
rm packages/layplux/src/styles/root-pane-tsx.scss
```

- [ ] **Step 3: 验证 SCSS 编译**

```bash
npx sass packages/layplux/src/styles/layplux.scss /tmp/layplux-test.css --no-source-map
```

Expected: 生成 `/tmp/layplux-test.css`，内容包含 `.layplux-root` 选择器和所有 token，无错误。

- [ ] **Step 4: 提交**

```bash
git add packages/layplux/src/styles/layplux.scss
git add packages/layplux/src/styles/base/
git add packages/layplux/src/styles/root-pane-tsx.scss
git commit -m "feat(styles): switch entry to SCSS partials, remove old CSS"
```

---

### Task 4: 创建组件 SCSS 文件

**Files:**
- Create: `packages/layplux/src/styles/components/_root-pane.scss`
- Create: `packages/layplux/src/styles/components/_skeleton.scss`
- Create: `packages/layplux/src/styles/components/_stripe.scss`
- Create: `packages/layplux/src/styles/components/_tool-window.scss`
- Create: `packages/layplux/src/styles/components/_editor-area.scss`
- Create: `packages/layplux/src/styles/components/_status-bar.scss`
- Create: `packages/layplux/src/styles/components/_glass-pane.scss`
- Create: `packages/layplux/src/styles/components/_main-tool-bar.scss`
- Create: `packages/layplux/src/styles/components/_bottom-tool-bar.scss`
- Modify: `packages/layplux/src/styles/layplux.scss`

- [ ] **Step 1: 创建 `components/_root-pane.scss`**

```scss
.layplux-root {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: hsl(var(--layplux-background));
  color: hsl(var(--layplux-foreground));
  font-family: var(--layplux-font-family);
  font-size: var(--layplux-font-size-base);
}
```

- [ ] **Step 2: 创建 `components/_skeleton.scss`**

```scss
.skeleton {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;

  &__main {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  &__bottom {
    display: flex;
    flex-shrink: 0;
  }
}
```

- [ ] **Step 3: 创建 `components/_stripe.scss`**

```scss
$stripe-width: 40px;

.stripe {
  display: flex;
  flex-shrink: 0;
  background-color: hsl(var(--layplux-background-deep));
  border-color: hsl(var(--layplux-border));

  &--left {
    width: $stripe-width;
    flex-direction: column;
    border-right: 1px solid hsl(var(--layplux-border));
  }

  &--right {
    width: $stripe-width;
    flex-direction: column;
    border-left: 1px solid hsl(var(--layplux-border));
  }

  &--bottom {
    height: $stripe-width;
    flex-direction: row;
    border-top: 1px solid hsl(var(--layplux-border));
  }

  &__button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: $stripe-width;
    height: $stripe-width;
    padding: 4px;
    border: none;
    background: transparent;
    color: hsl(var(--layplux-muted-foreground));
    cursor: pointer;
    flex-shrink: 0;
    position: relative;

    &:hover {
      background-color: hsl(var(--layplux-accent));
      color: hsl(var(--layplux-accent-foreground));
    }

    &--active {
      background-color: hsl(var(--layplux-accent));
      color: hsl(var(--layplux-accent-foreground));
    }

    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;

      &:hover {
        background: transparent;
        color: hsl(var(--layplux-muted-foreground));
      }
    }

    &--error {
      color: hsl(var(--layplux-destructive));
    }
  }

  &__spinner {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 2px solid hsl(var(--layplux-muted-foreground));
    border-top-color: transparent;
    border-radius: 50%;
    animation: layplux-spin 0.8s linear infinite;
  }
}

@keyframes layplux-spin {
  to {
    transform: rotate(360deg);
  }
}
```

- [ ] **Step 4: 创建 `components/_tool-window.scss`**

```scss
$title-bar-height: 28px;

.tool-window {
  display: flex;
  flex-direction: column;
  width: 280px;
  background-color: hsl(var(--layplux-card));
  border-color: hsl(var(--layplux-border));
  flex-shrink: 0;
  overflow: hidden;

  &--left {
    border-right: 1px solid hsl(var(--layplux-border));
  }

  &--right {
    border-left: 1px solid hsl(var(--layplux-border));
  }

  &--bottom {
    height: 200px;
    width: 100%;
    border-top: 1px solid hsl(var(--layplux-border));
  }

  &__title-bar {
    display: flex;
    align-items: center;
    height: $title-bar-height;
    padding: 0 8px;
    background-color: hsl(var(--layplux-accent));
    border-bottom: 1px solid hsl(var(--layplux-border));
    cursor: default;
    user-select: none;
    flex-shrink: 0;
  }

  &__title {
    flex: 1;
    font-size: 12px;
    margin-left: 6px;
  }

  &__close {
    background: none;
    border: none;
    color: hsl(var(--layplux-muted-foreground));
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 2px;

    &:hover {
      color: hsl(var(--layplux-foreground));
    }
  }

  &__tabs {
    display: flex;
    background-color: hsl(var(--layplux-accent));
    border-bottom: 1px solid hsl(var(--layplux-border));
    flex-shrink: 0;
  }

  &__tab {
    padding: 2px 10px;
    font-size: 11px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: hsl(var(--layplux-muted-foreground));
    cursor: pointer;
    white-space: nowrap;

    &--active {
      background-color: hsl(var(--layplux-card));
      border-bottom-color: hsl(var(--layplux-primary));
      color: hsl(var(--layplux-foreground));
    }

    &:hover:not(&--active) {
      color: hsl(var(--layplux-foreground));
    }
  }

  &__close-tab {
    margin-left: 6px;
    opacity: 0.6;

    &:hover {
      opacity: 1;
    }
  }

  &__content {
    flex: 1;
    overflow: auto;
  }

  &__loading {
    padding: 16px;
    color: hsl(var(--layplux-muted-foreground));
    font-size: 13px;
  }

  &__error {
    padding: 16px;
    color: hsl(var(--layplux-destructive));
    font-size: 13px;
  }

  &__retry {
    margin-top: 8px;
    padding: 4px 12px;
    background: hsl(var(--layplux-accent));
    border: 1px solid hsl(var(--layplux-border));
    color: hsl(var(--layplux-foreground));
    cursor: pointer;
    border-radius: 3px;

    &:hover {
      background: hsl(var(--layplux-accent-hover));
    }
  }
}
```

- [ ] **Step 5: 创建 `components/_editor-area.scss`**

```scss
.editor-area {
  display: flex;
  flex: 1;
  background-color: hsl(var(--layplux-background-deep));
  overflow: hidden;
  position: relative;

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: hsl(var(--layplux-muted-foreground));
    font-size: 14px;
  }
}
```

- [ ] **Step 6: 创建 `components/_status-bar.scss`**

```scss
$status-bar-height: 24px;

.status-bar {
  display: flex;
  align-items: center;
  height: $status-bar-height;
  min-height: $status-bar-height;
  background-color: hsl(var(--layplux-accent));
  border-top: 1px solid hsl(var(--layplux-border));
  font-size: 11px;
  color: hsl(var(--layplux-foreground));
  padding: 0 12px;
  user-select: none;

  &__left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__center {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}
```

- [ ] **Step 7: 创建 `components/_glass-pane.scss`**

```scss
.glass-pane {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: var(--layplux-popup-z-index);
}
```

- [ ] **Step 8: 创建 `components/_main-tool-bar.scss`**

```scss
.main-tool-bar {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 8px;
  background-color: hsl(var(--layplux-header));
  border-bottom: 1px solid hsl(var(--layplux-border));
  flex-shrink: 0;
}
```

- [ ] **Step 9: 创建 `components/_bottom-tool-bar.scss`**

```scss
.bottom-tool-bar {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 8px;
  background-color: hsl(var(--layplux-card));
  border-top: 1px solid hsl(var(--layplux-border));
  flex-shrink: 0;
}
```

- [ ] **Step 10: 更新 `layplux.scss` 入口**

```scss
@use 'base/tokens';
@use 'base/tokens-dark';
@use 'components/root-pane';
@use 'components/skeleton';
@use 'components/stripe';
@use 'components/tool-window';
@use 'components/editor-area';
@use 'components/status-bar';
@use 'components/glass-pane';
@use 'components/main-tool-bar';
@use 'components/bottom-tool-bar';
```

- [ ] **Step 11: 验证 SCSS 编译**

```bash
npx sass packages/layplux/src/styles/layplux.scss /tmp/layplux-full.css --no-source-map
```

Expected: 无错误，产物包含 token 定义和所有组件样式。

- [ ] **Step 12: 提交**

```bash
git add packages/layplux/src/styles/components/
git add packages/layplux/src/styles/layplux.scss
git commit -m "feat(styles): add component SCSS partials for all layout components"
```
