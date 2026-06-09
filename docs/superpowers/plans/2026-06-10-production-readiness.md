# 生产就绪三件套 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean entry point exports, add widget error boundary, and implement layout persistence with localStorage.

**Architecture:** Three independent fixes — (1) delete broken `layplux.ts`, rewrite `index.ts` as unified entry; (2) add `onErrorCaptured` in `WidgetView`; (3) new `persistence.ts` module with pluggable storage, `panelSizes` moved from CenterArea local refs to `ISkeleton`, auto save/load via debounced watch.

**Tech Stack:** Vue 3 (TSX), TypeScript, localStorage

---

### Task 1: Delete layplux.ts and rewrite index.ts

**Files:**
- Delete: `packages/layplux/src/layplux.ts`
- Modify: `packages/layplux/src/index.ts`

- [ ] **Step 1: Delete layplux.ts**

```bash
rm packages/layplux/src/layplux.ts
```

- [ ] **Step 2: Rewrite index.ts**

```ts
// 组件
export { default as Layplux } from './layout/layplux'

// 核心 composable
export { useSkeleton } from './managers/skeleton'

// 核心接口类型
export type { ISkeleton, IWidget, IWidgetContainer } from './managers'
export type { IArea } from './managers/area'
export type { IPane, ViewMode } from './managers/pane'

// 配置类型
export type {
  SkeletonConfig,
  SkeletonConfigArea,
  SkeletonConfigType,
  WidgetBaseConfig,
  PanelWidgetConfig,
  PanelWidgetProps,
  InteractionWidgetConfig,
  InteractionWidgetProps,
  CenterWidgetConfig,
  CenterWidgetProps,
} from './types'

// 工具
export { createPluginEventBus } from './utils/event-bus'
export type { PluginEventBus } from './utils/event-bus'
export { FocusTracker } from './utils/focus-tracker'
```

- [ ] **Step 3: Verify TS compilation**

```bash
npx tsc --noEmit -p packages/layplux/tsconfig.json 2>&1 | head -20
```

Expected: No new errors (only pre-existing errors unrelated to this change).

- [ ] **Step 4: Verify playground builds**

```bash
npx vite build 2>&1 | tail -5
```

Expected: `✓ built in` with no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/layplux/src/layplux.ts packages/layplux/src/index.ts
git commit -m "feat: clean entry point - delete broken class wrapper, unified exports

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Add error boundary to WidgetView

**Files:**
- Modify: `packages/layplux/src/components/widget/index.tsx`

- [ ] **Step 1: Rewrite WidgetView with error boundary**

Replace the entire `WidgetView` definition with:

```tsx
import { defineComponent, Fragment, ref, onErrorCaptured, h, type PropType } from 'vue'
import type { IWidget } from '../../managers'

export const WidgetView = defineComponent({
  name: 'WidgetView',
  inheritAttrs: false,
  props: {
    widget: Object as PropType<IWidget>,
  },
  setup(props) {
    const hasError = ref(false)
    const errorMessage = ref('')

    onErrorCaptured((err: Error) => {
      hasError.value = true
      errorMessage.value = err.message
      console.error(`[Layplux] Widget "${props.widget?.name}" crashed:`, err)
      return false // 阻止向上传播
    })

    return () => {
      const { widget } = props

      if (hasError.value) {
        const fallback = widget?.config.props?.errorFallback
        if (fallback) {
          return h(fallback, { error: errorMessage.value, widget })
        }
        return (
          <div class="layplux-widget-error">
            <span>组件 "{widget?.name}" 发生错误</span>
            <pre>{errorMessage.value}</pre>
          </div>
        )
      }

      return <Fragment>{widget?.renderBody()}</Fragment>
    }
  },
})

export const WidgetTitleView = defineComponent({
  name: 'WidgetTitleView',
  inheritAttrs: false,
  props: {
    widget: Object as PropType<IWidget>,
  },

  setup(props) {
    const tooltipVisible = ref(false)

    const handleClick = () => {
      tooltipVisible.value = false
      props.widget?.container?.toggleActive(props.widget?.name)
    }

    return () => {
      const { widget } = props
      const tooltipTitle = (widget?.config.props?.title as string) ?? widget?.name ?? ''

      return (
        <div class="widget-title-view">
          <Tooltip
            visible={tooltipVisible.value}
            onUpdate:visible={(v: boolean) => {
              tooltipVisible.value = v
            }}
            title={tooltipTitle}
            placement="right"
            mouseEnterDelay={500}
            getContainer={() => document.querySelector('.layplux-root') || document.body}
          >
            <TitleView
              onClick={handleClick}
              focused={widget?.focused.value}
              state={widget?.active.value ? 'active' : 'idle'}
              icon={widget?.config.props?.icon}
              title={widget?.config.props?.title}
            />
          </Tooltip>
        </div>
      )
    }
  },
})
```

Note: Keep existing imports for `TitleView`, `Tooltip` at the top of the file. Only the `WidgetView` definition changes — `WidgetTitleView` stays unchanged.

- [ ] **Step 2: Verify TS compilation**

```bash
npx tsc --noEmit -p packages/layplux/tsconfig.json 2>&1 | head -20
```

Expected: No new errors.

- [ ] **Step 3: Verify playground builds**

```bash
npx vite build 2>&1 | tail -5
```

Expected: `✓ built in`.

- [ ] **Step 4: Commit**

```bash
git add packages/layplux/src/components/widget/index.tsx
git commit -m "feat: add error boundary in WidgetView to isolate widget crashes

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Create persistence module

**Files:**
- Create: `packages/layplux/src/managers/persistence.ts`

- [ ] **Step 1: Create persistence.ts**

```ts
import type { ViewMode } from './pane'

export interface PanelSizes {
  leftWidth: number
  rightWidth: number
  bottomHeight: number
  leftSplitRatio: number
  rightSplitRatio: number
  bottomSplitRatio: number
}

export interface LayoutPreferences {
  theme: 'light' | 'dark' | 'system'
  themeName: string
  locale: string
}

export interface LayoutSnapshot {
  version: 1
  panels: {
    sizes: PanelSizes
    activeIds: Record<string, string | null>
    viewModes: Record<string, ViewMode>
  }
  preferences: LayoutPreferences
  extra: Record<string, Record<string, unknown>>
}

export interface LayoutStorage {
  save(key: string, data: LayoutSnapshot): void
  load(key: string): LayoutSnapshot | null
}

export function createLocalStorage(): LayoutStorage {
  return {
    save(key: string, data: LayoutSnapshot): void {
      try {
        localStorage.setItem(key, JSON.stringify(data))
      } catch {
        // localStorage full or unavailable — silently ignore
      }
    },
    load(key: string): LayoutSnapshot | null {
      try {
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as LayoutSnapshot) : null
      } catch {
        return null
      }
    },
  }
}
```

- [ ] **Step 2: Export from managers index**

Add to `packages/layplux/src/managers/index.ts`:

```ts
export type { LayoutStorage, LayoutSnapshot, PanelSizes } from './persistence'
export { createLocalStorage } from './persistence'
```

- [ ] **Step 3: Export from layplux entry point**

Add to `packages/layplux/src/index.ts`:

```ts
// 持久化
export type { LayoutStorage, LayoutSnapshot, PanelSizes } from './managers/persistence'
export { createLocalStorage } from './managers/persistence'
```

- [ ] **Step 4: Verify TS compilation**

```bash
npx tsc --noEmit -p packages/layplux/tsconfig.json 2>&1 | head -20
```

Expected: No new errors.

- [ ] **Step 5: Commit**

```bash
git add packages/layplux/src/managers/persistence.ts packages/layplux/src/managers/index.ts packages/layplux/src/index.ts
git commit -m "feat: add layout persistence module with pluggable storage

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Add panelSizes and persistence to skeleton

**Files:**
- Modify: `packages/layplux/src/managers/skeleton.ts`

- [ ] **Step 1: Add imports**

Add after existing imports:

```ts
import { ref, watch, type Ref } from 'vue'
import type { CenterWidgetConfig, InteractionWidgetConfig, PanelWidgetConfig, SkeletonConfig } from '../types'
import { createLocalStorage, type LayoutSnapshot, type LayoutStorage, type PanelSizes } from './persistence'
```

Note: Replace the existing `import { ref, type Ref } from 'vue'` line — upgrade from named to include `watch`.

- [ ] **Step 2: Add panelSizes and persistence to ISkeleton interface**

Add inside the `ISkeleton` interface, before the `}`:

```ts
  // 面板尺寸（CenterArea 从 skeleton 读写）
  panelSizes: {
    leftWidth: Ref<number>
    rightWidth: Ref<number>
    bottomHeight: Ref<number>
    leftSplitRatio: Ref<number>
    rightSplitRatio: Ref<number>
    bottomSplitRatio: Ref<number>
  }

  // 持久化
  saveLayout(): void
  loadLayout(): boolean
  resetLayout(): void

  // 扩展数据
  setExtra(namespace: string, data: Record<string, unknown>): void
  getExtra(namespace: string): Record<string, unknown> | undefined
```

- [ ] **Step 3: Add persistence config to useSkeleton params**

Change the function signature from:

```ts
export function useSkeleton(): ISkeleton {
```

To:

```ts
export function useSkeleton(options?: {
  persistence?: {
    key: string
    storage: LayoutStorage
  }
}): ISkeleton {
```

- [ ] **Step 4: Add localeName ref alongside existing locale**

After `// eslint-disable-next-line @typescript-eslint/no-unsafe-argument` and `const locale = ...` line, add:

```ts
const localeName = ref<string>('zh-CN')
```

Update `setLocale()` to track the name:

```ts
function setLocale(name: string) {
  localeName.value = name
  locale.value = getBuiltInLocale(name)
}
```

- [ ] **Step 5: Add panelSizes and extra state in useSkeleton body**

After the `const widgets: IWidget[] = [];` line, add:

```ts
const extra = ref<Record<string, Record<string, unknown>>>({})

const panelSizes = {
  leftWidth: ref(340),
  rightWidth: ref(340),
  bottomHeight: ref(300),
  leftSplitRatio: ref(0.5),
  rightSplitRatio: ref(0.5),
  bottomSplitRatio: ref(0.5),
}
```

- [ ] **Step 5: Add persistence methods**

After `panelSizes` definition, add:

```ts
const storage = options?.persistence?.storage ?? createLocalStorage()
const persistenceKey = options?.persistence?.key

function collectSnapshot(): LayoutSnapshot {
  const activeIds: Record<string, string | null> = {}
  const viewModes: Record<string, string> = {}
  containers.forEach((container, name) => {
    activeIds[name] = container.activeId.value
  })
  widgets.forEach((w) => {
    viewModes[w.name] = w.pane.viewMode.value
  })

  return {
    version: 1,
    panels: {
      sizes: {
        leftWidth: panelSizes.leftWidth.value,
        rightWidth: panelSizes.rightWidth.value,
        bottomHeight: panelSizes.bottomHeight.value,
        leftSplitRatio: panelSizes.leftSplitRatio.value,
        rightSplitRatio: panelSizes.rightSplitRatio.value,
        bottomSplitRatio: panelSizes.bottomSplitRatio.value,
      },
      activeIds,
      viewModes,
    },
    preferences: {
      theme: theme.value,
      themeName: themeName.value,
      locale: localeName.value,
    },
    extra: extra.value,
  }
}

function saveLayout(): void {
  if (!persistenceKey) return
  storage.save(persistenceKey, collectSnapshot())
}

function loadLayout(): boolean {
  if (!persistenceKey) return false
  const snapshot = storage.load(persistenceKey)
  if (!snapshot) return false

  const s = snapshot.panels.sizes
  panelSizes.leftWidth.value = s.leftWidth
  panelSizes.rightWidth.value = s.rightWidth
  panelSizes.bottomHeight.value = s.bottomHeight
  panelSizes.leftSplitRatio.value = s.leftSplitRatio
  panelSizes.rightSplitRatio.value = s.rightSplitRatio
  panelSizes.bottomSplitRatio.value = s.bottomSplitRatio

  const prefs = snapshot.preferences
  if (prefs.theme) theme.value = prefs.theme
  if (prefs.themeName) themeName.value = prefs.themeName
  if (prefs.locale) setLocale(prefs.locale)

  // Restore activeIds and viewModes after widgets are registered
  requestAnimationFrame(() => {
    snapshot.panels.activeIds && Object.entries(snapshot.panels.activeIds).forEach(([name, id]) => {
      if (id) containers.get(name)?.activate(id)
    })
    snapshot.panels.viewModes && Object.entries(snapshot.panels.viewModes).forEach(([name, mode]) => {
      widgets.find(w => w.name === name)?.pane.setViewMode(mode as ViewMode)
    })
  })

  return true
}

function resetLayout(): void {
  panelSizes.leftWidth.value = 340
  panelSizes.rightWidth.value = 340
  panelSizes.bottomHeight.value = 300
  panelSizes.leftSplitRatio.value = 0.5
  panelSizes.rightSplitRatio.value = 0.5
  panelSizes.bottomSplitRatio.value = 0.5
}

function setExtra(namespace: string, data: Record<string, unknown>): void {
  extra.value = { ...extra.value, [namespace]: data }
}

function getExtra(namespace: string): Record<string, unknown> | undefined {
  return extra.value[namespace]
}
```

- [ ] **Step 6: Add debounced auto-save watch**

After the self assignment block (before `return self`), add:

```ts
// 自动持久化：debounce 300ms 后保存
if (persistenceKey) {
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  watch(
    () => collectSnapshot(),
    () => {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => saveLayout(), 300)
    },
    { deep: true },
  )
}
```

- [ ] **Step 7: Add to Object.assign**

Inside `Object.assign(self, {...})`, add `panelSizes`, `saveLayout`, `loadLayout`, `resetLayout`, `setExtra`, `getExtra`.

- [ ] **Step 8: Call loadLayout at end of useSkeleton**

After `Object.assign` and before `return self`, add:

```ts
// Auto-load persisted state
loadLayout()
```

- [ ] **Step 9: Verify TS compilation**

```bash
npx tsc --noEmit -p packages/layplux/tsconfig.json 2>&1 | head -30
```

Expected: No new errors.

- [ ] **Step 10: Commit**

```bash
git add packages/layplux/src/managers/skeleton.ts
git commit -m "feat: add panelSizes and persistence to skeleton

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: Adapt CenterArea to use skeleton.panelSizes

**Files:**
- Modify: `packages/layplux/src/layout/skeleton/center-area.tsx`

- [ ] **Step 1: Replace local size refs with computed from skeleton.panelSizes**

Replace lines 31-39 (the panel size state section):

```tsx
// ─── 面板尺寸状态（从 skeleton.panelSizes 读写） ──────────────────────
const sk = props.skeleton!
const panelSizes = sk.panelSizes

const leftWidth = computed({
  get: () => panelSizes.leftWidth.value,
  set: (v) => { panelSizes.leftWidth.value = v },
})
const rightWidth = computed({
  get: () => panelSizes.rightWidth.value,
  set: (v) => { panelSizes.rightWidth.value = v },
})
const bottomHeight = computed({
  get: () => panelSizes.bottomHeight.value,
  set: (v) => { panelSizes.bottomHeight.value = v },
})
const leftSplitRatio = computed({
  get: () => panelSizes.leftSplitRatio.value,
  set: (v) => { panelSizes.leftSplitRatio.value = v },
})
const rightSplitRatio = computed({
  get: () => panelSizes.rightSplitRatio.value,
  set: (v) => { panelSizes.rightSplitRatio.value = v },
})
const bottomSplitRatio = computed({
  get: () => panelSizes.bottomSplitRatio.value,
  set: (v) => { panelSizes.bottomSplitRatio.value = v },
})
```

- [ ] **Step 2: Remove the `ref()` imports for sizes**

The `leftWidth` through `bottomSplitRatio` were previously `ref(340)` etc. Those are now `computed` from skeleton, so remove the `ref` calls.

- [ ] **Step 3: Verify TS compilation**

```bash
npx tsc --noEmit -p packages/layplux/tsconfig.json 2>&1 | head -20
```

Expected: No new errors.

- [ ] **Step 4: Verify playground builds**

```bash
npx vite build 2>&1 | tail -5
```

Expected: `✓ built in`.

- [ ] **Step 5: Commit**

```bash
git add packages/layplux/src/layout/skeleton/center-area.tsx
git commit -m "feat: adapt CenterArea to use skeleton.panelSizes for persistence

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: Integration verification in playground

**Files:**
- Modify: `packages/playground/src/App.vue` (temporary)

- [ ] **Step 1: Add persistence config to playground**

In `App.vue`, change the `useSkeleton()` call:

```ts
import { useSkeleton, createLocalStorage } from '../../layplux/src/managers'

const skeleton = useSkeleton({
  persistence: {
    key: 'layplux-playground-layout',
    storage: createLocalStorage(),
  },
})
```

- [ ] **Step 2: Build and verify**

```bash
npx vite build 2>&1 | tail -5
```

Expected: `✓ built in`.

- [ ] **Step 3: Start dev server and test manually**

```bash
npx vite --port 5173
```

Test checklist:
- Open browser, drag panel sizes → refresh → panel sizes preserved
- Switch theme → refresh → theme preserved
- Open/close panels → refresh → preserved
- Switch center area → refresh → active widget preserved
- Open DevTools → Application → Local Storage → verify `layplux-playground-layout` key exists with JSON data

- [ ] **Step 4: Revert playground App.vue changes**

```bash
git checkout packages/playground/src/App.vue
```

- [ ] **Step 5: Final verification build**

```bash
npx vite build 2>&1 | tail -5
```

Expected: `✓ built in`.

- [ ] **Step 6: Commit any remaining changes**
