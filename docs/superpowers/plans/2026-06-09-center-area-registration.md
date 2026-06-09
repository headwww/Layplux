# Center Area Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `centerArea` as a standard `IArea` to the skeleton system, enabling registration-based center content with Teleport keep-alive switching.

**Architecture:** `centerArea` reuses the existing `useArea` → `useWidgetContainer` → `useWidget` chain. A new lightweight `CenterView` component (no chrome) replaces PanelView for center widgets. Content switching happens via `activeId` + Teleport between `#center-area` and `#center-offscreen`.

**Tech Stack:** Vue 3 (TSX), TypeScript

---

### Task 1: Add 'centerArea' to SkeletonConfigArea type

**Files:**
- Modify: `packages/layplux/src/types/config.ts`

- [ ] **Step 1: Add 'centerArea' to the union type**

```ts
export type SkeletonConfigArea =
  | 'topArea'
  | 'bottomArea'
  | 'leftTopArea'
  | 'leftBottomArea'
  | 'rightTopArea'
  | 'rightBottomArea'
  | 'bottomLeftArea'
  | 'bottomRightArea'
  | 'centerArea';
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit -p packages/layplux/tsconfig.json 2>&1 | head -20`
Expected: No new errors related to SkeletonConfigArea.

- [ ] **Step 3: Commit**

```bash
git add packages/layplux/src/types/config.ts
git commit -m "feat: add centerArea to SkeletonConfigArea type

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Add centerArea to ISkeleton and useSkeleton

**Files:**
- Modify: `packages/layplux/src/managers/skeleton.ts`

- [ ] **Step 1: Add centerArea to ISkeleton interface**

Add this line inside the `ISkeleton` interface, after the existing `bottomRightArea` declaration (line 26):

```ts
centerArea: IArea<PanelWidgetConfig, IWidget>;
```

- [ ] **Step 2: Create centerArea in useSkeleton()**

Add this block after the `bottomLeftArea` creation (line 168):

```ts
// 中心区域
const centerArea = useArea<PanelWidgetConfig, IWidget>(
  { createContainer },
  'centerArea',
  (config, container) => createWidget(config, container),
);
```

- [ ] **Step 3: Add centerArea routing in add()**

Add this branch inside the `add()` method, after the `bottomRightArea` branch (line 224):

```ts
} else if (area === 'centerArea') {
  centerArea.add(config as PanelWidgetConfig);
```

- [ ] **Step 4: Add centerArea to Object.assign**

Add `centerArea` to the `Object.assign(self, {...})` properties list (around line 238), alongside the other area properties.

- [ ] **Step 5: Verify TypeScript compilation**

Run: `npx tsc --noEmit -p packages/layplux/tsconfig.json 2>&1 | head -20`
Expected: No new errors.

- [ ] **Step 6: Commit**

```bash
git add packages/layplux/src/managers/skeleton.ts
git commit -m "feat: add centerArea to ISkeleton and useSkeleton

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Create CenterView component

**Files:**
- Create: `packages/layplux/src/components/center-view/index.tsx`

- [ ] **Step 1: Create the CenterView component**

```tsx
import { defineComponent, Teleport, type PropType } from 'vue';
import type { IWidget } from '../../managers';

export const CenterView = defineComponent({
  name: 'CenterView',
  props: {
    widget: Object as PropType<IWidget>,
    anchor: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => {
      if (!props.widget) return null;
      return (
        <Teleport defer to={props.anchor}>
          {props.widget.renderContent()}
        </Teleport>
      );
    };
  },
});
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit -p packages/layplux/tsconfig.json 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add packages/layplux/src/components/center-view/index.tsx
git commit -m "feat: add CenterView component for center area content rendering

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Update CenterArea with center widget Teleport

**Files:**
- Modify: `packages/layplux/src/layout/skeleton/center-area.tsx`

- [ ] **Step 1: Update imports**

Replace the existing import block (lines 1-11) to add `IArea`, `PanelWidgetConfig`, and `CenterView`:

```ts
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  Teleport,
  type PropType,
} from 'vue';
import type { ISkeleton, IArea } from '../../managers';
import type { PanelWidgetConfig } from '../../types';
import { PanelView } from '../../components';
```

- [ ] **Step 2: Add centerArea prop**

In the `props` block (lines 15-17), add `centerArea`:

```ts
props: {
  skeleton: Object as PropType<ISkeleton>,
  centerArea: Object as PropType<IArea<PanelWidgetConfig, IWidget>>,
},
```

- [ ] **Step 3: Add center widget Teleport logic**

After the existing `teleportTargets` computed (before the leftTopHeight computed, around line 246), add:

```ts
// ─── Center widget Teleport 目标 ──────────────────────────────────────
const centerWidgetNames = computed(() => {
  const names = new Set<string>();
  props.centerArea?.container.items.value.forEach((w) => names.add(w.name));
  return names;
});

const centerTargets = computed(() => {
  const activeId = props.centerArea?.container.activeId.value ?? null;
  const map: Record<string, string> = {};
  props.centerArea?.container.items.value.forEach((w) => {
    map[w.name] = w.name === activeId ? '#center-area' : '#center-offscreen';
  });
  return map;
});
```

- [ ] **Step 4: Exclude center widgets from existing panel Teleport loop**

In the existing panel widget Teleport loop (the `.filter((w) => w.type === 'panel')` line), change the filter to exclude center widgets:

```tsx
{sk.widgets
  .filter((w) => w.type === 'panel' && !centerWidgetNames.value.has(w.name))
  .map((w) => (
```

- [ ] **Step 5: Add #center-offscreen div**

After the existing `<div id="widget-offscreen" style="display:none;" />` (line 265), add:

```tsx
<div id="center-offscreen" style="display:none;" />
```

- [ ] **Step 6: Add center widget Teleport loop**

After the offscreen div, before the undocked panel section, add:

```tsx
{/* Center widget Teleport 声明 */}
{props.centerArea?.container.items.value.map((w) => (
  <Teleport defer key={w.name} to={centerTargets.value[w.name] ?? '#center-offscreen'}>
    {w.renderContent()}
  </Teleport>
))}
```

- [ ] **Step 7: Replace editor div with #center-area anchor**

Replace `<div class="layplux-center-area__editor" />` (line 371) with:

```tsx
<div id="center-area" class="layplux-center-area__editor" />
```

- [ ] **Step 8: Verify TypeScript compilation**

Run: `npx tsc --noEmit -p packages/layplux/tsconfig.json 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 9: Verify the playground still builds**

Run: `npx vite build packages/playground 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 10: Commit**

```bash
git add packages/layplux/src/layout/skeleton/center-area.tsx
git commit -m "feat: add center widget Teleport logic to CenterArea

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: Pass centerArea to CenterArea in Skeleton

**Files:**
- Modify: `packages/layplux/src/layout/skeleton/skeleton.tsx`

- [ ] **Step 1: Pass centerArea prop to CenterArea**

Change line 32 from:

```tsx
<CenterArea skeleton={props.skeleton} />
```

To:

```tsx
<CenterArea skeleton={props.skeleton} centerArea={props.skeleton?.centerArea} />
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit -p packages/layplux/tsconfig.json 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 3: Verify the playground still builds**

Run: `npx vite build packages/playground 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/layplux/src/layout/skeleton/skeleton.tsx
git commit -m "feat: pass centerArea prop to CenterArea in Skeleton

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: Integration verification

**Files:**
- Modify: `packages/playground/src/App.vue` (temporary, for smoke testing)

- [ ] **Step 1: Add a center widget registration in playground**

Read `packages/playground/src/App.vue` and add a test registration in `onMounted` or `setup`:

```ts
skeleton.add({
  name: 'test-center',
  type: 'panel',
  area: 'centerArea',
  content: {
    setup() {
      return () => <div style="padding:20px;color:white;">Center Area Content</div>;
    },
  },
});
skeleton.centerArea.container.activate('test-center');
```

- [ ] **Step 2: Start the playground dev server and verify visually**

Run: `npx vite packages/playground --port 5173`
Open: `http://localhost:5173`
Expected: Center area shows "Center Area Content" without panel chrome (no title bar, no tabs, no dropdown).

- [ ] **Step 3: Test switching between multiple center widgets**

Add a second widget and test activation switching—verify both render, only one visible, switching preserves state.

- [ ] **Step 4: Revert playground changes**

```bash
git checkout packages/playground/src/App.vue
```

- [ ] **Step 5: Final commit (if any remaining changes)**

---

### Task 7: Export CenterView from components index

**Files:**
- Modify: `packages/layplux/src/components/index.ts`

- [ ] **Step 1: Add CenterView export**

Add after the existing exports:

```ts
export * from './center-view';
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit -p packages/layplux/tsconfig.json 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add packages/layplux/src/components/index.ts
git commit -m "feat: export CenterView from components index

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
