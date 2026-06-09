# Theme Customization System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `themeName` + `registerTheme(name, vars)` to ISkeleton so users can define and switch between named themes via `data-theme` attribute.

**Architecture:** `ISkeleton.themeName` stores the active theme name, `RootPane` renders it as `data-theme` attribute alongside the existing `.dark` class. `registerTheme(name, vars)` dynamically injects a `<style>` tag into `<head>` with CSS custom properties scoped to `[data-theme="name"]`.

**Tech Stack:** TypeScript, CSS custom properties, DOM manipulation for style injection

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `packages/layplux/src/types/theme.ts` | Create | `ThemeVars` interface |
| `packages/layplux/src/managers/theme.ts` | Create | `createStyleTag()`, `registerTheme()` helper |
| `packages/layplux/src/managers/skeleton.ts` | Modify | `ISkeleton.themeName`, `setThemeName`, `registerTheme` |
| `packages/layplux/src/layout/root-pane.tsx` | Modify | Render `data-theme` attribute |
| `packages/layplux/src/utils/index.ts` | Modify | Export theme types/functions |
| `packages/playground/src/App.vue` | Modify | Theme preset selector demo |

---

### Task 1: Create ThemeVars type

**Files:**
- Create: `packages/layplux/src/types/theme.ts`

- [ ] **Step 1: Write the type file**

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

- [ ] **Step 2: Verify type check**

Run: `cd packages/layplux && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

---

### Task 2: Create theme manager utility

**Files:**
- Create: `packages/layplux/src/managers/theme.ts`

- [ ] **Step 1: Write the theme manager**

This file provides `registerTheme(name, vars)` and `setThemeName(name)` helpers plus the CSS variable generation logic.

```ts
import type { ThemeVars } from '../types/theme';

/** 将 ThemeVars 映射为 CSS 自定义属性字符串 */
function varsToCSS(vars: Partial<ThemeVars>): string {
  const map: Record<keyof ThemeVars, string> = {
    background: '--layplux-background',
    foreground: '--layplux-foreground',
    primary: '--layplux-primary',
    primaryForeground: '--layplux-primary-foreground',
    secondary: '--layplux-secondary',
    secondaryForeground: '--layplux-secondary-foreground',
    muted: '--layplux-muted',
    mutedForeground: '--layplux-muted-foreground',
    accent: '--layplux-accent',
    accentForeground: '--layplux-accent-foreground',
    border: '--layplux-border',
    input: '--layplux-input',
    card: '--layplux-card',
    cardForeground: '--layplux-card-foreground',
    destructive: '--layplux-destructive',
  };

  const lines: string[] = [];
  for (const [key, varName] of Object.entries(map) as Array<[keyof ThemeVars, string]>) {
    const value = vars[key];
    if (value !== undefined) {
      lines.push(`    ${varName}: ${value};`);
    }
  }
  return lines.join('\n');
}

/** 为指定主题名构建 CSS 规则 */
function buildThemeCSS(name: string, vars: Partial<ThemeVars>): string {
  const varsBlock = varsToCSS(vars);
  return `.layplux-root[data-theme='${name}'] {\n${varsBlock}\n}\n`;
}

/** 动态注入 <style> 标签到 <head>，idempotent（重复注册会替换） */
export function injectThemeCSS(name: string, vars: Partial<ThemeVars>): void {
  const styleId = `layplux-theme-${name}`;
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = buildThemeCSS(name, vars);
}

/** 切换主题：移除旧的 data-theme，设置新的 */
export function applyThemeName(element: HTMLElement, name: string): void {
  element.setAttribute('data-theme', name);
}

/** 移除已注入的主题样式标签 */
export function removeThemeCSS(name: string): void {
  const styleEl = document.getElementById(`layplux-theme-${name}`);
  if (styleEl) {
    styleEl.remove();
  }
}
```

---

### Task 3: Add themeName/registerTheme to ISkeleton

**Files:**
- Modify: `packages/layplux/src/managers/skeleton.ts`

The current `ISkeleton` already has `theme: Ref<'light' | 'dark' | 'system'>` and related methods (lines 30-33). Add `themeName` and `registerTheme` alongside them.

- [ ] **Step 1: Add import**

After line 3 `import type { LaypluxLocale } from '../types/locale';`, add:

```ts
import type { ThemeVars } from '../types/theme';
```

After line 13 (end of utils import), add:

```ts
import { injectThemeCSS, applyThemeName, removeThemeCSS } from './theme';
```

- [ ] **Step 2: Add `themeName` and `registerTheme` to `ISkeleton` interface**

After `setTheme(theme: 'light' | 'dark' | 'system'): void;` (line 33), add:

```ts
readonly themeName: Ref<string>;
setThemeName(name: string): void;
registerTheme(name: string, vars: Partial<ThemeVars>): void;
```

- [ ] **Step 3: Add implementation in `useSkeleton()`**

After the `setTheme` function (line 78-80), add:

```ts
const themeName = ref<string>('default');

function setThemeName(name: string) {
  themeName.value = name;
}

function registerTheme(name: string, vars: Partial<ThemeVars>) {
  injectThemeCSS(name, vars);
}
```

- [ ] **Step 4: Add to `Object.assign`**

In the `Object.assign(self, { ... })` block (around line 223-247), add `themeName`, `setThemeName`, `registerTheme` after `setTheme,`:

```ts
setTheme,
themeName,
setThemeName,
registerTheme,
```

- [ ] **Step 5: Verify type check**

Run: `cd packages/layplux && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

---

### Task 4: Render data-theme in RootPane

**Files:**
- Modify: `packages/layplux/src/layout/root-pane.tsx`

Current state already has a `rootClass` computed. Add `data-theme` attribute to the root div.

- [ ] **Step 1: Update JSX to render data-theme**

Change the returned JSX from:

```tsx
return () => (
  <div class={rootClass.value}>
    <CornerGlow />
    <LayeredManager skeleton={props.skeleton} />
    <GlassOverlay />
  </div>
);
```

to:

```tsx
return () => (
  <div class={rootClass.value} data-theme={props.skeleton?.themeName?.value ?? 'default'}>
    <CornerGlow />
    <LayeredManager skeleton={props.skeleton} />
    <GlassOverlay />
  </div>
);
```

- [ ] **Step 2: Verify type check**

Run: `cd packages/layplux && npx vue-tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

---

### Task 5: Export theme types from utils

**Files:**
- Modify: `packages/layplux/src/utils/index.ts`

- [ ] **Step 1: Add theme export**

```ts
export * from './vue';
export * from './unique-id';
export * from './focus-tracker';
export * from './event-bus';
export { getBuiltInLocale, zhCN, enUS, type LaypluxLocale } from '../locales';
export type { ThemeVars } from '../types/theme';
export { injectThemeCSS, applyThemeName, removeThemeCSS } from '../managers/theme';
```

Wait — this creates a circular dependency: `managers/skeleton.ts` imports from `managers/theme.ts`, and `utils/index.ts` also imports from `managers/theme.ts`. But `skeleton.ts` imports from `utils/index.ts`. Let me check...

Actually, `skeleton.ts` imports `{ FocusTracker, createPluginEventBus, type PluginEventBus, getBuiltInLocale } from '../utils'`. If utils also exports from `managers/theme`, and `skeleton.ts` imports from `managers/theme`, there's no circular dependency — they're both importing from theme.ts, not from each other.

But wait, `utils/index.ts` is just a barrel file. It re-exports from `../managers/theme`. `skeleton.ts` would import directly from `./theme` instead of going through utils. That's fine, no circular dependency.

Actually, to keep it clean, let's just export the type from utils and leave the theme manager functions imported directly where needed.

```ts
export * from './vue';
export * from './unique-id';
export * from './focus-tracker';
export * from './event-bus';
export { getBuiltInLocale, zhCN, enUS, type LaypluxLocale } from '../locales';
export type { ThemeVars } from '../types/theme';
export { injectThemeCSS, applyThemeName, removeThemeCSS } from '../managers/theme';
```

This is fine — utils is a barrel, theme.ts is a standalone utility with no deps on other managers. No circular dependency.

---

### Task 6: Add theme preset demo to playground

**Files:**
- Modify: `packages/playground/src/App.vue`

Add preset themes and enhance the ThemeSwitcher to cycle through named themes.

- [ ] **Step 1: Add preset theme definitions and update toggle**

Replace the theme toggle section (around lines currently containing `themeIcons` and `nextThemes`). Find the current theme section and replace with:

```ts
// ═══ 主题切换 ═══════════════════════════════════════════════════════════════

const themes = [
  { name: 'default', label: '默认' },
  { name: 'ocean', label: '海洋' },
  { name: 'forest', label: '森林' },
  { name: 'sunset', label: '日落' },
];

// 注册预设自定义主题
skeleton.registerTheme('ocean', {
  background: '200 15% 10%',
  foreground: '200 10% 95%',
  primary: '200 80% 50%',
  accent: '200 5% 20%',
  border: '200 10% 30%',
});

skeleton.registerTheme('forest', {
  background: '150 10% 10%',
  foreground: '150 10% 95%',
  primary: '150 60% 40%',
  accent: '150 5% 20%',
  border: '150 10% 30%',
});

skeleton.registerTheme('sunset', {
  background: '25 15% 10%',
  foreground: '25 10% 95%',
  primary: '25 80% 50%',
  accent: '25 5% 20%',
  border: '25 10% 30%',
});

let themeIndex = 0;
function toggleTheme() {
  themeIndex = (themeIndex + 1) % themes.length;
  const next = themes[themeIndex];
  skeleton.setThemeName(next.name);
}

const ThemeSwitcher = defineComponent({
  name: 'ThemeSwitcher',
  setup() {
    return () =>
      h(
        'button',
        {
          class: 'ide-btn',
          onClick: toggleTheme,
          title: `Theme: ${skeleton.themeName.value}`,
        },
        themes.find((t) => t.name === skeleton.themeName.value)?.label ?? 'Theme',
      );
  },
});
```

- [ ] **Step 2: Verify HMR works**

Run: check `tail -3` of Vite output
Expected: HMR update without errors, "Demo ready" in console.

---

### Task 7: Verify full theme pipeline

- [ ] **Step 1: Manual verification checklist**

Open `http://localhost:5173` and check:

1. **Default theme**: `data-theme="default"` on `.layplux-root` in DevTools
2. **Click ThemeSwitcher**: cycles through `ocean` → `forest` → `sunset` → `default`
3. **Check `<head>`**: `<style id="layplux-theme-ocean">` etc. injected
4. **Check CSS variables** in DevTools on `.layplux-root`: `--layplux-primary` changes per theme
5. **Combined with dark/light**: `data-theme="ocean"` + `.dark` class work together
6. **Revert to default**: clicking back to "默认" restores original appearance

---
