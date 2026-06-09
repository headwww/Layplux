# Event System Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the existing event-bus into Skeleton, Widget, Panel lifecycle to enable cross-component communication.

**Architecture:** `createPluginEventBus('skeleton')` creates a bus singleton hung on `ISkeleton.event`. Widget/Panel layers call `skeleton.event.emitGlobal()` to emit namespaced lifecycle events. Content components receive `event` prop via `renderBody()` for custom event emission.

**Tech Stack:** Vue 3 + TypeScript, EventEmitter2

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `packages/layplux/src/utils/index.ts` | Modify | Add event-bus re-export |
| `packages/layplux/src/managers/skeleton.ts` | Modify | Create event bus, emit skeleton-level events |
| `packages/layplux/src/managers/widget-container.ts` | Modify | Emit activated/deactivated/removed events |
| `packages/layplux/src/managers/widget.ts` | Modify | IWidget.event, widget-level events, renderBody injection |
| `packages/layplux/src/components/panel-view/index.tsx` | Modify | Panel-level events (minimize, menu-click) |

---

### Task 1: Export event-bus from utils

**Files:**
- Modify: `packages/layplux/src/utils/index.ts`

- [ ] **Step 1: Add event-bus re-export**

```ts
export * from './vue';
export * from './unique-id';
export * from './focus-tracker';
export * from './event-bus';
```

- [ ] **Step 2: Verify type check**

Run: `cd packages/layplux && npx vue-tsc --noEmit 2>&1 | head -30`
Expected: No new errors from this change.

---

### Task 2: Integrate event bus into skeleton.ts

**Files:**
- Modify: `packages/layplux/src/managers/skeleton.ts:1-191`

- [ ] **Step 1: Add import**

Replace line 7 `} from '../utils';` with:

```ts
import { FocusTracker, createPluginEventBus, type PluginEventBus } from '../utils';
```

- [ ] **Step 2: Add `event` to `ISkeleton` interface**

After line 20 `focusTracker: FocusTracker;`, add:

```ts
event: PluginEventBus;
```

- [ ] **Step 3: Create event bus in `useSkeleton()`**

After line 38 `const focusTracker = new FocusTracker();`, add:

```ts
const event = createPluginEventBus('skeleton');
```

- [ ] **Step 4: Emit `skeleton:widget-added` in `createWidget()`**

In `createWidget()` (line 106-116), add emission after `widgets.push(widget)`:

```ts
function createWidget(
  config: SkeletonConfig | IWidget,
  container: IWidgetContainer<IWidget, any>,
): IWidget {
  if (isWidget(config)) {
    return config;
  }
  const widget = useWidget(config, container, self);
  widgets.push(widget);
  event.emitGlobal('skeleton:widget-added', { widget });
  return widget;
}
```

- [ ] **Step 5: Emit `skeleton:focus-changed` in `focus()` and `blur()`**

In `focus()` (line 128-130):

```ts
function focus(id: string) {
  focusedId.value = id;
  event.emitGlobal('skeleton:focus-changed', { focusedId: id });
}
```

In `blur()` (line 132-134):

```ts
function blur() {
  focusedId.value = null;
  event.emitGlobal('skeleton:focus-changed', { focusedId: null });
}
```

- [ ] **Step 6: Add `event` to `Object.assign(self, {...})`**

In the `Object.assign` block (line 171-188), add `event`:

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
  toggleFocus,
  focus,
  blur,
  add,
  createContainer,
});
```

- [ ] **Step 7: Verify type check**

Run: `cd packages/layplux && npx vue-tsc --noEmit 2>&1 | head -30`
Expected: No new errors.

---

### Task 3: Emit container-level events in widget-container.ts

**Files:**
- Modify: `packages/layplux/src/managers/widget-container.ts:1-121`

- [ ] **Step 1: Emit `skeleton:widget-removed` in `remove()`**

After line 92 `delete maps[name];`, add:

```ts
if (item && 'type' in item) {
  (skeleton as any).event?.emitGlobal('skeleton:widget-removed', { name });
}
```

Wait — `item` is typed as `T` (generic), which doesn't have `name` directly. But `WidgetItem` has `name`. After `const item = maps[name]`, we know `item` exists. Let me adjust — since `T extends WidgetItem`, `item` has `name`. The check `'type' in item` guards for IWidget. For simplicity, just emit on any remove:

Inside `remove()`, after `delete maps[name]`, before `return item`:

```ts
function remove(name: string): T | null {
  const item = maps[name];
  if (!item) return null;
  const i = items.value.indexOf(item);
  if (i > -1) items.value.splice(i, 1);
  delete maps[name];
  skeleton.event?.emitGlobal('skeleton:widget-removed', { name });
  return item;
}
```

- [ ] **Step 2: Emit activated/deactivated events in `activate()` and `deactivate()`**

In `activate()` (line 96-101), after `maps[id].focusable.active();`:

```ts
function activate(id: string): void {
  if (!maps[id]) return;
  activeId.value = id;
  skeleton.focus(id);
  maps[id].focusable.active();
  skeleton.event?.emitGlobal(`widget:${id}:activated`, { widget: maps[id] });
}
```

Wait — the event name uses `name` not `id`. The widget has a `name` property. But `T` is generic so we don't know the exact type. Let me cast to access `name`:

Actually, `WidgetItem` has `name: string`. And `T extends WidgetItem`. So `maps[id].name` is accessible. And `id` here is the widget's name (it's used as the key in maps). Looking at how `activate` is called: `container.activate(name)` — so `id` IS the name. Good.

In `deactivate()` (line 103-110), after `maps[current].focusable.suspense();`:

```ts
function deactivate(): void {
  const current = activeId.value;
  activeId.value = null;
  skeleton.blur();
  if (current && maps[current]) {
    maps[current].focusable.suspense();
    skeleton.event?.emitGlobal(`widget:${current}:deactivated`, { widget: maps[current] });
  }
}
```

- [ ] **Step 3: Verify type check**

Run: `cd packages/layplux && npx vue-tsc --noEmit 2>&1 | head -30`
Expected: No new errors. If `event` is not on ISkeleton yet (since we added it in Task 2), this should be fine.

---

### Task 4: Integrate event bus into widget.ts

**Files:**
- Modify: `packages/layplux/src/managers/widget.ts:1-111`

- [ ] **Step 1: Add imports**

Replace lines 1-8:

```ts
import { computed, watch, h, type Ref, type VNode } from 'vue';
import type { InteractionWidgetAlign, SkeletonConfig, SkeletonConfigType } from '../types';
import { createContent, uniqueId, type PluginEventBus } from '../utils';
import { WidgetTitleView, WidgetView } from '../components';
import type { IWidgetContainer } from './widget-container';
import type { ISkeleton } from './skeleton';
import { usePane, type IPane, type ViewMode } from './pane';
import type { Focusable } from '../utils';
```

- [ ] **Step 2: Add `event` to `IWidget` interface**

After `readonly focusable: Focusable;` (line 21), add:

```ts
readonly event: PluginEventBus;
```

- [ ] **Step 3: Expand skeleton parameter type**

Line 30, change:

```ts
skeleton?: Pick<ISkeleton, 'focusedId' | 'focus' | 'blur' | 'focusTracker'>,
```

to:

```ts
skeleton?: Pick<ISkeleton, 'focusedId' | 'focus' | 'blur' | 'focusTracker' | 'event'>,
```

- [ ] **Step 4: Emit focus/blur events in focusable callbacks**

In `onActive` (line 61-63), add emission:

```ts
onActive: () => {
  widget.container?.activate(name);
  skeleton!.event?.emitGlobal(`widget:${name}:focus`, { widget });
},
```

In `onBlur` (line 65-72), add emission:

```ts
onBlur: () => {
  skeleton!.blur();
  skeleton!.event?.emitGlobal(`widget:${name}:blur`, { widget });
  if (pane.viewMode.value === 'DockUnpinned' || pane.viewMode.value === 'Undock') {
    container?.deactivate();
  }
},
```

- [ ] **Step 5: Watch viewMode and emit event**

After `const pane = usePane();` (line 39), add:

```ts
// Emit view-mode-changed events
if (skeleton?.event) {
  watch(
    () => pane.viewMode.value,
    (mode) => {
      skeleton.event!.emitGlobal(`widget:${name}:view-mode-changed`, { widget, mode });
    },
  );
}
```

Note: `widget` is referenced before declaration. Move this watch after `const widget: IWidget = { ... }` (line 88). Place it after line 103 `const widget: IWidget = { ... };`.

- [ ] **Step 6: Inject `event` prop in `renderBody()`**

Change `renderBody()` (line 75-78) from:

```ts
function renderBody() {
  const { content, contentProps } = config;
  return createContent(content, { ...contentProps, config });
}
```

to:

```ts
function renderBody() {
  const { content, contentProps } = config;
  return createContent(content, { ...contentProps, config, event: widget.event });
}
```

- [ ] **Step 7: Verify type check**

Run: `cd packages/layplux && npx vue-tsc --noEmit 2>&1 | head -30`
Expected: No new errors.

---

### Task 5: Add panel-level events in panel-view/index.tsx

**Files:**
- Modify: `packages/layplux/src/components/panel-view/index.tsx:62-188`

- [ ] **Step 1: Emit `panel:{name}:menu-click` in `handleClick`**

Add emission at the beginning of `handleClick` (after line 76), before the existing logic:

```ts
const handleClick = (key: string) => {
  const widget = props.widget;
  const widgetProps = widget?.config.props;
  const panelItems = widgetProps?.panelMenuItems as MenuItemConfig[] | undefined;

  // Emit panel menu click event
  widget?.event?.emitGlobal(`panel:${widget.name}:menu-click`, { widget, key });

  const panelItem = findItem(panelItems, key);
  if (panelItem?.onClick) {
    panelItem.onClick(key, widget!);
    return;
  }
  // ... rest unchanged
```

- [ ] **Step 2: Emit `panel:{name}:minimize` on minimize button click**

The minimize button is at line 177. Wrap the click handler to emit an event:

```tsx
<button
  class="layplux-panel__action-btn"
  title="最小化"
  onClick={() => {
    widget?.event?.emitGlobal(`panel:${widget.name}:minimize`, { widget });
    props.onMinimize?.();
  }}
>
  <MinimizeIcon size={16} />
</button>
```

- [ ] **Step 3: Verify type check**

Run: `cd packages/layplux && npx vue-tsc --noEmit 2>&1 | head -30`
Expected: No new errors.

---
