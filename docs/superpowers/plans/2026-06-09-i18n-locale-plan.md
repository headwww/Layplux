# i18n Locale System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded Chinese strings in PanelView with a provide/inject-based locale system, zero dependencies, built-in zh-CN/en-US support.

**Architecture:** `LaypluxLocale` interface defines all translatable strings. `getBuiltInLocale(name)` returns a locale object. `ISkeleton.locale` holds a reactive ref, `RootPane` provides it, `PanelView` (and future components) inject it.

**Tech Stack:** Vue 3 provide/inject, TypeScript

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `packages/layplux/src/types/locale.ts` | Create | `LaypluxLocale` interface |
| `packages/layplux/src/locales/zh-CN.ts` | Create | Chinese language pack |
| `packages/layplux/src/locales/en-US.ts` | Create | English language pack |
| `packages/layplux/src/locales/index.ts` | Create | `getBuiltInLocale()` factory, re-exports |
| `packages/layplux/src/utils/index.ts` | Modify | Export locale types/functions |
| `packages/layplux/src/managers/skeleton.ts` | Modify | `ISkeleton.locale`, `setLocale()` |
| `packages/layplux/src/layout/root-pane.tsx` | Modify | `provide('layplux-locale', ...)` |
| `packages/layplux/src/components/panel-view/index.tsx` | Modify | `inject` locale, replace hardcoded strings |

---

### Task 1: Create LaypluxLocale type

**Files:**
- Create: `packages/layplux/src/types/locale.ts`

- [ ] **Step 1: Write the type file**

```ts
export interface LaypluxLocale {
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

- [ ] **Step 2: Verify type check**

Run: `cd packages/layplux && npx vue-tsc --noEmit 2>&1 | head -30`
Expected: No new errors (only pre-existing ones).

---

### Task 2: Create zh-CN language pack

**Files:**
- Create: `packages/layplux/src/locales/zh-CN.ts`

- [ ] **Step 1: Write the Chinese locale**

```ts
import type { LaypluxLocale } from '../types/locale';

export const zhCN: LaypluxLocale = {
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

---

### Task 3: Create en-US language pack

**Files:**
- Create: `packages/layplux/src/locales/en-US.ts`

- [ ] **Step 1: Write the English locale**

```ts
import type { LaypluxLocale } from '../types/locale';

export const enUS: LaypluxLocale = {
  panel: {
    viewMode: 'View Mode',
    dockPinned: 'Dock Pinned',
    dockUnpinned: 'Dock Unpinned',
    undock: 'Undock',
    help: 'Help',
    more: 'More',
    minimize: 'Minimize',
  },
};
```

---

### Task 4: Create locales index with getBuiltInLocale

**Files:**
- Create: `packages/layplux/src/locales/index.ts`

- [ ] **Step 1: Write the index file**

```ts
import type { LaypluxLocale } from '../types/locale';
import { zhCN } from './zh-CN';
import { enUS } from './en-US';

export type { LaypluxLocale } from '../types/locale';

const builtInLocales: Record<string, LaypluxLocale> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export function getBuiltInLocale(name: string): LaypluxLocale {
  const locale = builtInLocales[name];
  if (!locale) {
    console.warn(`[Layplux] Unknown locale "${name}", falling back to zh-CN`);
    return zhCN;
  }
  return locale;
}

export { zhCN, enUS };
```

---

### Task 5: Export locale from utils/index.ts

**Files:**
- Modify: `packages/layplux/src/utils/index.ts`

- [ ] **Step 1: Add locale export**

```ts
export * from './vue';
export * from './unique-id';
export * from './focus-tracker';
export * from './event-bus';
export { getBuiltInLocale, zhCN, enUS, type LaypluxLocale } from '../locales';
```

- [ ] **Step 2: Verify type check**

Run: `cd packages/layplux && npx vue-tsc --noEmit 2>&1 | head -30`
Expected: No new errors.

---

### Task 6: Add locale to ISkeleton and useSkeleton

**Files:**
- Modify: `packages/layplux/src/managers/skeleton.ts`

- [ ] **Step 1: Add import at top**

After line 7, add:

```ts
import { ref, type Ref } from 'vue';
import type { LaypluxLocale } from '../types/locale';
import { getBuiltInLocale } from '../locales';
```

Wait — `ref` is already imported on line 1. So just add the locale imports:

On line 1, `ref` is already imported. Just add locale imports after line 7:

No wait, let me check the current imports:

```ts
import { ref, type Ref } from 'vue';
import type { InteractionWidgetConfig, PanelWidgetConfig, SkeletonConfig } from '../types';
import { useArea } from './area';
import type { IArea } from './area';
import { isWidget, useWidget, type IWidget } from './widget';
import { useWidgetContainer, type IWidgetContainer, type WidgetItem } from './widget-container';
import { FocusTracker, createPluginEventBus, type PluginEventBus } from '../utils';
```

Add after line 2:

```ts
import type { LaypluxLocale } from '../types/locale';
```

And change the utils import to also import locale functions. Actually, since utils/index.ts now exports from locales, we can get it from utils:

Change line 7:

```ts
import { FocusTracker, createPluginEventBus, type PluginEventBus, getBuiltInLocale } from '../utils';
```

And add the type import from types:

```ts
import type { InteractionWidgetConfig, PanelWidgetConfig, SkeletonConfig } from '../types';
import type { LaypluxLocale } from '../types/locale';
```

Actually wait, let me reconsider. Types should be imported from `../types` not from `../utils`. Since `LaypluxLocale` is defined in `types/locale.ts`, let me import it from there.

Let me be precise about the import changes:

Import changes for skeleton.ts:
1. Add `import type { LaypluxLocale } from '../types/locale';` after line 2
2. Change line 7 to: `import { FocusTracker, createPluginEventBus, type PluginEventBus, getBuiltInLocale } from '../utils';`

OK let me rewrite this step more precisely.

- [ ] **Step 1: Add locale imports to skeleton.ts**

Add after the existing type import on line 2:

```ts
import type { LaypluxLocale } from '../types/locale';
```

Change the utils import on line 7 from:

```ts
import { FocusTracker, createPluginEventBus, type PluginEventBus } from '../utils';
```

to:

```ts
import { FocusTracker, createPluginEventBus, type PluginEventBus, getBuiltInLocale } from '../utils';
```

- [ ] **Step 2: Add `locale` and `setLocale` to `ISkeleton` interface**

After `event: PluginEventBus;` (line 21), add:

```ts
locale: Ref<LaypluxLocale>;
setLocale(name: string): void;
```

- [ ] **Step 3: Create locale ref in `useSkeleton()`**

After `const event = createPluginEventBus('skeleton');` (line 40), add:

```ts
const locale = ref<LaypluxLocale>(getBuiltInLocale('zh-CN'));

function setLocale(name: string) {
  locale.value = getBuiltInLocale(name);
}
```

- [ ] **Step 4: Add `locale` and `setLocale` to `Object.assign(self, {...})`**

In the Object.assign block (around line 176-194), add `locale` and `setLocale`:

```ts
Object.assign(self, {
  widgets,
  topArea,
  bottomArea,
  leftTopArea,
  leftBottomArea,
  rightTopArea,
  rightBottomArea,
  bottomRightArea,
  bottomLeftArea,
  focusedId,
  focusTracker,
  event,
  locale,
  setLocale,
  toggleFocus,
  focus,
  blur,
  add,
  createContainer,
});
```

- [ ] **Step 5: Verify type check**

Run: `cd packages/layplux && npx vue-tsc --noEmit 2>&1 | head -30`
Expected: No new errors.

---

### Task 7: Provide locale in RootPane

**Files:**
- Modify: `packages/layplux/src/layout/root-pane.tsx`

- [ ] **Step 1: Read current file, then add provide**

Add `provide` to the vue import. Change line 1 from:

```ts
import { defineComponent, type PropType } from 'vue';
```

to:

```ts
import { defineComponent, provide, type PropType } from 'vue';
```

- [ ] **Step 2: Call provide in setup**

After `setup(props) {`, add:

```ts
provide('layplux-locale', props.skeleton?.locale);
```

Full setup function becomes:

```tsx
setup(props) {
  provide('layplux-locale', props.skeleton?.locale);
  return () => (
    <div class="layplux-root">
      <CornerGlow />
      <LayeredManager skeleton={props.skeleton} />
      <GlassOverlay />
    </div>
  );
},
```

- [ ] **Step 3: Verify type check**

Run: `cd packages/layplux && npx vue-tsc --noEmit 2>&1 | head -30`
Expected: No new errors.

---

### Task 8: Replace hardcoded strings in PanelView with locale

**Files:**
- Modify: `packages/layplux/src/components/panel-view/index.tsx`

- [ ] **Step 1: Add imports**

Add `inject` to the vue import. Change line 1 from:

```ts
import { defineComponent, ref, type PropType, type VNode, type Component } from 'vue';
```

to:

```ts
import { defineComponent, ref, inject, type PropType, type Ref, type VNode, type Component } from 'vue';
```

Add locale imports after line 12:

```ts
import { createContent, getBuiltInLocale } from '../../utils';
import type { LaypluxLocale } from '../../types/locale';
```

Wait, `createContent` is already imported from `../../utils` on line 12. Let me check the current import... Looking at the panel-view file from the system reminder:

Line 12: `import { createContent } from '../../utils';`

So I need to change line 12 to also import `getBuiltInLocale`:

```ts
import { createContent, getBuiltInLocale } from '../../utils';
```

And add the type import.

- [ ] **Step 2: Inject locale with fallback in setup**

After `const panelRef = ref<HTMLElement>();` (currently line 60):

```ts
const panelRef = ref<HTMLElement>();
const locale = inject<Ref<LaypluxLocale>>('layplux-locale', ref(getBuiltInLocale('zh-CN')));
```

- [ ] **Step 3: Use locale in renderItems and template**

Replace all hardcoded strings in the innerItems array (line 24-36):

From:

```ts
const innerItems: MenuItemConfig[] = [
  {
    key: 'viewMode',
    label: '视图模式',
    children: [
      { key: 'DockPinned', label: '停靠固定' },
      { key: 'DockUnpinned', label: '停靠不固定' },
      { key: 'Undock', label: '取消停靠' },
    ],
  },
  { type: 'divider' },
  { key: 'help', label: '帮助' },
];
```

Since `innerItems` is defined outside the component, it currently can't access the injected locale. We need to change the approach: build `innerItems` dynamically inside the return function.

Move `innerItems` from module scope into the return function. Actually, a cleaner approach: build the items array inside the return function that reads from locale.

In the `return () => {` block, replace `finalInnerItems` computation (line 138). Let me replace the entire items generation approach.

Current (line 137-138):

```ts
const showHelp = widgetProps?.showHelp !== false;
const finalInnerItems = showHelp ? innerItems : innerItems.filter((i) => i.key !== 'help');
```

Replace with:

```ts
const showHelp = widgetProps?.showHelp !== false;
const loc = locale.value.panel;
const finalInnerItems: MenuItemConfig[] = [
  {
    key: 'viewMode',
    label: loc.viewMode,
    children: [
      { key: 'DockPinned', label: loc.dockPinned },
      { key: 'DockUnpinned', label: loc.dockUnpinned },
      { key: 'Undock', label: loc.undock },
    ],
  },
  { type: 'divider' },
  ...(showHelp ? [{ key: 'help' as const, label: loc.help }] : []),
];
```

And remove the module-level `innerItems` declaration (lines 24-36) and the `finalInnerItems` computation.

Wait, but `innerItems` was defined at module scope. Let me just remove it. And also remove the `showHelp` filter logic since we build it inline now.

- [ ] **Step 4: Replace hardcoded title attributes in template**

The dropdown button title (currently around line 169):

Change from:

```tsx
<button class="layplux-panel__action-btn" title="更多">
```

to:

```tsx
<button class="layplux-panel__action-btn" title={loc.more}>
```

The minimize button title (currently around line 187):

Change from:

```tsx
<button
  class="layplux-panel__action-btn"
  title="最小化"
```

to:

```tsx
<button
  class="layplux-panel__action-btn"
  title={loc.minimize}
```

- [ ] **Step 5: Verify type check**

Run: `cd packages/layplux && npx vue-tsc --noEmit 2>&1 | head -30`
Expected: No new errors.

---
