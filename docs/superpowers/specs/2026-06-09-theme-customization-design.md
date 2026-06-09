# 主题定制系统设计

> 在已有 colorScheme（亮/暗/系统）基础上，增加 themeName（主题配色）+ registerTheme（自定义主题注入），支持开箱即用和深度定制。

## 目标

- 内置 `default` 主题（当前浅色/暗色两套 CSS 变量）
- 支持多套主题切换，通过 `data-theme` 属性区分
- 提供 `registerTheme(name, vars)` API，JS 注入自定义主题
- 同时兼容纯 CSS 覆盖（不调 API 也能用）

## 架构

两个独立维度，`RootPane` 组合渲染：

```
isDark() →
  .dark  class (已有)
  color-scheme: light/dark

themeName →
  data-theme="default" | "custom" | "ocean" | ...
```

```html
<div class="layplux-root dark" data-theme="ocean">
```

### 数据流

```
ISkeleton
├── colorScheme: 'light' | 'dark' | 'system'    (已有)
├── themeName: string                             (新增，默认 'default')
├── registerTheme(name, vars)                     (新增)
└── setThemeName(name)                            (新增)
         │
    RootPane: computed class + data-theme
         │
    <div class="layplux-root dark"
         data-theme="ocean">
```

## ThemeVars 接口

只暴露核心语义变量，衍生变量由框架自动计算：

```ts
export interface ThemeVars {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  card: string;
  cardForeground: string;
  destructive: string;
}
```

## registerTheme 机制

调用后动态注入 `<style>` 标签到 `<head>`：

```ts
skeleton.registerTheme('ocean', {
  background: '200 15% 10%',
  foreground: '200 10% 95%',
  primary: '200 80% 50%',
  // 未传的字段 fallback 到 default 对应值
});
```

生成：

```html
<style id="layplux-theme-ocean">
  .layplux-root[data-theme='ocean'] {
    --layplux-background: 200 15% 10%;
    --layplux-foreground: 200 10% 95%;
    ...
  }
</style>
```

切换到该主题：

```ts
skeleton.setThemeName('ocean');
// → data-theme="ocean"，CSS 选择器生效
```

### 衍生变量自动计算

`registerTheme` 传入的 `accent` 等基础值，自动派生：

| 输入 | 派生变量 |
|---|---|
| `accent` | `--layplux-accent-dark: accent 调暗` |
| `accent` | `--layplux-accent-darker: accent 进一步调暗` |
| `accent` | `--layplux-accent-lighter: accent 调亮` |
| `background` | `--layplux-background-deep: background 调暗` |
| `background` | `--layplux-card: background` |
| `foreground` | `--layplux-input-placeholder: foreground 降低 opacity` |

## CSS 覆盖兼容

用户可以不调 `registerTheme`，直接写 CSS：

```css
.layplux-root[data-theme='my-theme'] {
  --layplux-background: 200 15% 10%;
  --layplux-foreground: 200 10% 95%;
}
```

然后 `skeleton.setThemeName('my-theme')` 即可生效。未注册时不会报错，`data-theme` 正常设置。

## 改动文件

### 1. types/theme.ts（新建）

`ThemeVars` 接口定义。

### 2. managers/skeleton.ts

- `ISkeleton` 加 `themeName`、`setThemeName`、`registerTheme`
- `registerTheme` 实现：动态创建 `<style>` 标签注入 head

### 3. layout/root-pane.tsx

- `computed` 中加入 `data-theme` 属性
- 渲染 `<div data-theme={themeName}>`

### 4. components/panel-view/index.tsx

- 无需改动（CSS 变量自动生效）

### 5. playground/App.vue

- 加 theme 选择器 demo（几个预设主题切换）

## 用户使用

```ts
const sk = useSkeleton();

// 切换内置主题
sk.setThemeName('default');

// 注册自定义主题
sk.registerTheme('ocean', {
  background: '200 15% 10%',
  foreground: '200 10% 95%',
  primary: '200 80% 50%',
  // ...
});
sk.setThemeName('ocean');

// 纯 CSS 方式（不调 registerTheme）
sk.setThemeName('my-css-theme');
```

## 不在此范围

- 主题编辑器/GUI
- 主题持久化（localStorage）— 用户自行实现
- 多主题同时预览
- 组件级别的主题覆盖
