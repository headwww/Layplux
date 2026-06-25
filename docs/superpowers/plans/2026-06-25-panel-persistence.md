# 面板持久化管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Layplux 添加面板状态持久化能力 — 通过事件产出状态、通过 initialState 注入初始状态，序列化交由使用方处理

**Architecture:** 尺寸数据从 CenterArea 本地 ref 迁移到 skeleton 统一管理；pane 和 widget-container 变更时通知 skeleton 触发事件；skeleton 通过 getState() 动态构建状态快照；尺寸变化 300ms 防抖

**Tech Stack:** TypeScript, Vue 3 Composition API (ref, reactive)

---

## 文件结构

| 文件 | 改动 |
|------|------|
| `packages/layplux/src/types/state.ts` | **新建** — SkeletonState 类型 |
| `packages/layplux/src/managers/skeleton.ts` | **修改** — 尺寸 refs、getState、emitState、initialState、防抖 |
| `packages/layplux/src/managers/pane.ts` | **修改** — 添加 onChange 回调参数 |
| `packages/layplux/src/managers/widget.ts` | **修改** — 传递 viewMode onChange 和 initialState.viewMode |
| `packages/layplux/src/managers/widget-container.ts` | **修改** — 接受 areaName 参数，初始 activeId，变更通知 |
| `packages/layplux/src/layout/skeleton/center-area.tsx` | **修改** — 尺寸从本地 ref 迁移到 skeleton 读写 |
| `packages/layplux/src/types/index.ts` | **修改** — 导出 SkeletonState |
| `packages/layplux/src/index.ts` | **修改** — 导出 SkeletonState 类型 |

---

### Task 1: 新建 SkeletonState 类型

**Files:**
- Create: `packages/layplux/src/types/state.ts`
- Modify: `packages/layplux/src/types/index.ts`

- [ ] **Step 1: 创建 state.ts 类型文件**

```ts
import type { ViewMode } from '../managers/pane';

export interface SkeletonState {
  /** 左侧面板宽度 (px)，默认 340 */
  leftWidth: number;
  /** 右侧面板宽度 (px)，默认 340 */
  rightWidth: number;
  /** 底部面板高度 (px)，默认 300 */
  bottomHeight: number;
  /** 左侧内部上下分割比例 (0~1)，默认 0.5 */
  leftSplitRatio: number;
  /** 右侧内部上下分割比例 (0~1)，默认 0.5 */
  rightSplitRatio: number;
  /** 底部内部左右分割比例 (0~1)，默认 0.5 */
  bottomSplitRatio: number;
  /** 每个 panel widget 的视图模式，key 为 widget name */
  viewModes: Record<string, ViewMode>;
  /** 每个区域当前激活的 widget name，key 为 area name */
  activeIds: Record<string, string | null>;
}
```

- [ ] **Step 2: 从 types/index.ts 导出 SkeletonState**

读取 `packages/layplux/src/types/index.ts` 确认其内容，然后添加：
```ts
export type { SkeletonState } from './state';
```

- [ ] **Step 3: 编译检查**

```bash
cd packages/layplux && npx tsc --noEmit
```
Expected: 无类型错误（新增类型文件能被正确解析）

- [ ] **Step 4: Commit**

```bash
git add packages/layplux/src/types/state.ts packages/layplux/src/types/index.ts
git commit -m "feat: add SkeletonState type for panel persistence"
```

---

### Task 2: skeleton 增加状态管理

**Files:**
- Modify: `packages/layplux/src/managers/skeleton.ts`

- [ ] **Step 1: 添加尺寸 refs 和 emitState 基础设施到 ISkeleton 接口**

在 `ISkeleton` 接口（约第21行）的现有字段后添加：

```ts
export interface ISkeleton {
  // ...现有字段全部保留...

  // ─── 持久化状态 ────────────────────────────────────────────────
  leftWidth: Ref<number>;
  rightWidth: Ref<number>;
  bottomHeight: Ref<number>;
  leftSplitRatio: Ref<number>;
  rightSplitRatio: Ref<number>;
  bottomSplitRatio: Ref<number>;
  /** 获取当前完整状态快照 */
  getState(): SkeletonState;
  /** @internal 通知骨架状态已变更，debounce=true 表示防抖 300ms */
  notifyStateChange(debounce?: boolean): void;
}
```

在文件顶部添加 import：
```ts
import type { SkeletonState } from '../types/state';
```

- [ ] **Step 2: 添加 SkeletonOptions 类型和 useSkeleton 签名修改**

在 `useSkeleton` 函数前添加：

```ts
export interface SkeletonOptions {
  initialState?: Partial<SkeletonState>;
}
```

修改函数签名：
```ts
export function useSkeleton(options?: SkeletonOptions): ISkeleton {
  const { initialState } = options || {};
```

- [ ] **Step 3: 添加尺寸 refs 和防抖/emitState 逻辑**

在 `useSkeleton` 函数体内，`const widgets: IWidget[] = []` 之后，添加：

```ts
// ─── 持久化状态 refs ────────────────────────────────────────────
const leftWidth = ref(initialState?.leftWidth ?? 340);
const rightWidth = ref(initialState?.rightWidth ?? 340);
const bottomHeight = ref(initialState?.bottomHeight ?? 300);
const leftSplitRatio = ref(initialState?.leftSplitRatio ?? 0.5);
const rightSplitRatio = ref(initialState?.rightSplitRatio ?? 0.5);
const bottomSplitRatio = ref(initialState?.bottomSplitRatio ?? 0.5);

// 防抖定时器
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function getState(): SkeletonState {
  const viewModes: Record<string, ViewMode> = {};
  widgets.forEach((w) => {
    if (w.type === 'panel') {
      viewModes[w.name] = w.pane.viewMode.value;
    }
  });

  const activeIds: Record<string, string | null> = {};
  containers.forEach((container, name) => {
    activeIds[name] = container.activeId.value;
  });

  return {
    leftWidth: leftWidth.value,
    rightWidth: rightWidth.value,
    bottomHeight: bottomHeight.value,
    leftSplitRatio: leftSplitRatio.value,
    rightSplitRatio: rightSplitRatio.value,
    bottomSplitRatio: bottomSplitRatio.value,
    viewModes,
    activeIds,
  };
}

function emitState() {
  event.emitGlobal('skeleton:state-changed', getState());
}

function notifyStateChange(debounce = false) {
  if (debounce) {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(emitState, 300);
  } else {
    emitState();
  }
}
```

- [ ] **Step 4: 将新字段填入 self 的 Object.assign**

在 `Object.assign(self, { ... })` 中（约第252行）添加：

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
  centerArea,
  focusedId,
  focusTracker,
  event,
  locale,
  setLocale,
  theme,
  resolveTheme,
  isDark,
  setTheme,
  themeName,
  setThemeName,
  registerTheme,
  toggleFocus,
  focus,
  blur,
  add,
  createContainer,
  // 持久化状态
  leftWidth,
  rightWidth,
  bottomHeight,
  leftSplitRatio,
  rightSplitRatio,
  bottomSplitRatio,
  getState,
  notifyStateChange,
});
```

- [ ] **Step 5: 添加 ViewMode import**

在文件顶部 import 中添加：
```ts
import type { ViewMode } from './pane';
```

- [ ] **Step 6: 编译检查**

```bash
cd packages/layplux && npx tsc --noEmit
```
Expected: 无类型错误

- [ ] **Step 7: Commit**

```bash
git add packages/layplux/src/managers/skeleton.ts
git commit -m "feat: add state management refs, getState, notifyStateChange to skeleton"
```

---

### Task 3: pane 接收 onChange 回调

**Files:**
- Modify: `packages/layplux/src/managers/pane.ts`

- [ ] **Step 1: 在 usePane 中添加 onChange 参数**

修改 `usePane` 函数：

```ts
export function usePane(
  defaultViewMode: ViewMode = 'DockPinned',
  onChange?: (mode: ViewMode) => void,
): IPane {
  const viewMode = ref<ViewMode>(defaultViewMode);

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode;
    onChange?.(mode);
  }

  return {
    viewMode,
    setViewMode,
  };
}
```

IPane 接口保持不变，不需要修改。

- [ ] **Step 2: 编译检查**

```bash
cd packages/layplux && npx tsc --noEmit
```
Expected: 无类型错误（onChange 是可选参数，现有调用不受影响）

- [ ] **Step 3: Commit**

```bash
git add packages/layplux/src/managers/pane.ts
git commit -m "feat: add onChange callback to usePane"
```

---

### Task 4: widget 和 widget-container 连接状态通知

**Files:**
- Modify: `packages/layplux/src/managers/widget.ts`
- Modify: `packages/layplux/src/managers/widget-container.ts`

- [ ] **Step 1: 修改 useWidgetContainer 接受 areaName 并设置初始 activeId**

修改 `useWidgetContainer` 签名和 activeId 初始化（文件：`widget-container.ts`）：

```ts
export function useWidgetContainer<T extends WidgetItem = any, G extends WidgetItem = any>(
  handle: WidgetContainerHandle<T, G>,
  skeleton: ISkeleton,
  areaName?: string,
): IWidgetContainer<T, G> {
  const maps: { [name: string]: T } = {};
  const items: Ref<T[]> = ref([]);
  const activeId = ref<string | null>(null);

  const self: IWidgetContainer<T, G> = {
    // ... 保持不变 ...
  };

  function activate(id: string): void {
    if (!maps[id]) return;
    activeId.value = id;
    skeleton.focus(id);
    maps[id].focusable.active();
    skeleton.event.emitGlobal(`widget:${id}:activated`, { widget: maps[id] });
    skeleton.notifyStateChange(false);
  }

  function deactivate(): void {
    const current = activeId.value;
    activeId.value = null;
    skeleton.blur();
    if (current && maps[current]) {
      maps[current].focusable.suspense();
      skeleton.event.emitGlobal(`widget:${current}:deactivated`, { widget: maps[current] });
    }
    skeleton.notifyStateChange(false);
  }

  // ...其余方法不变...
}
```

注意：不在这里初始化 activeId（延迟到 Task 5 中 createContainer 改造时处理），因为 skeleton 需要先知道 areaName→container 的映射才能查询 initialState。

- [ ] **Step 2: 修改 createContainer 传递 areaName**

在 `skeleton.ts` 的 `createContainer` 函数中：

```ts
function createContainer<T extends IWidget = IWidget, G extends WidgetItem = SkeletonConfig>(
  name: string,
  handle: (item: T | G, container: IWidgetContainer<T, T | G>) => T,
): IWidgetContainer<T, T | G> {
  const container = useWidgetContainer<T, T | G>(handle, self, name);
  containers.set(name, container);
  return container;
}
```

- [ ] **Step 3: 在容器创建后初始化 activeId**

在 `createContainer` 返回前，根据 initialState 设置初始 activeId：

```ts
function createContainer<T extends IWidget = IWidget, G extends WidgetItem = SkeletonConfig>(
  name: string,
  handle: (item: T | G, container: IWidgetContainer<T, T | G>) => T,
): IWidgetContainer<T, T | G> {
  const container = useWidgetContainer<T, T | G>(handle, self, name);
  containers.set(name, container);

  // 从 initialState 恢复 activeId
  const initialActiveId = initialState?.activeIds?.[name];
  if (initialActiveId) {
    container.activeId.value = initialActiveId;
  }

  return container;
}
```

- [ ] **Step 4: 修改 useWidget 传递 viewMode onChange 和初始值**

在 `widget.ts` 中，修改 `usePane()` 调用：

```ts
// 修改前：
const pane = usePane();

// 修改后：
const pane = usePane(
  (skeleton as any)?.initialState?.viewModes?.[name] || undefined,
  () => {
    skeleton?.event?.emitGlobal && (skeleton as any).notifyStateChange?.(false);
  },
);
```

这里需要将 `skeleton` 参数类型扩展以支持 `notifyStateChange`。当前 `skeleton` 参数类型是 `Pick<ISkeleton, 'focusedId' | 'focus' | 'blur' | 'focusTracker' | 'event'>`。保留现有解构但直接引用 `skeleton` 对象。

更好的做法：不修改 Pick 类型，而是让 widget.ts 内部通过闭包持有完整的 skeleton 引用。但当前签名是 Pick... 我们可以把 Pick 改成包含 `notifyStateChange`：

修改 `useWidget` 的 skeleton 参数类型：
```ts
skeleton?: Pick<ISkeleton, 'focusedId' | 'focus' | 'blur' | 'focusTracker' | 'event'> & {
  notifyStateChange?: (debounce?: boolean) => void;
  initialState?: Partial<SkeletonState>;
},
```

然后修改 usePane 调用：
```ts
const initialViewModel = (() => {
  const modes = (skeleton as any)?.initialState?.viewModes;
  return modes?.[name] ? (modes[name] as ViewMode) : undefined;
})();

import { type ViewMode } from './pane';

const pane = usePane(initialViewModel, () => {
  skeleton?.notifyStateChange?.(false);
});
```

- [ ] **Step 5: 编译检查**

```bash
cd packages/layplux && npx tsc --noEmit
```
Expected: 无类型错误

- [ ] **Step 6: Commit**

```bash
git add packages/layplux/src/managers/widget.ts packages/layplux/src/managers/widget-container.ts packages/layplux/src/managers/skeleton.ts
git commit -m "feat: wire pane and widget-container state changes to skeleton notifyStateChange"
```

---

### Task 5: 尺寸数据从 CenterArea 迁移到 skeleton

**Files:**
- Modify: `packages/layplux/src/layout/skeleton/center-area.tsx`

- [ ] **Step 1: 用 skeleton 上的 refs 替换本地 refs**

在 `CenterArea` 的 setup 函数中，将：

```ts
// ─── 面板尺寸状态 ─────────────────────────────────────────────────────
const leftWidth = ref(340);
const rightWidth = ref(340);
const bottomHeight = ref(300);

// 上下 / 左右内部分割比例 (0~1)
const leftSplitRatio = ref(0.5);
const rightSplitRatio = ref(0.5);
const bottomSplitRatio = ref(0.5);
```

替换为：

```ts
const sk = props.skeleton!;
```

然后模板中所有 `leftWidth.value` → `sk.leftWidth.value`，`rightWidth.value` → `sk.rightWidth.value`，以此类推。

- [ ] **Step 2: 修改拖拽回调，通过 sk 写入并用 notifyStateChange**

修改 `dragLeftWidth`：
```ts
function dragLeftWidth(e: MouseEvent) {
  const base = sk.leftWidth.value;
  startDrag(e, 'x', (d) => {
    sk.leftWidth.value = Math.max(160, Math.min(600, base + d));
    sk.notifyStateChange(true);
  });
}
```

修改 `dragRightWidth`：
```ts
function dragRightWidth(e: MouseEvent) {
  const base = sk.rightWidth.value;
  startDrag(e, 'x', (d) => {
    sk.rightWidth.value = Math.max(160, Math.min(600, base - d));
    sk.notifyStateChange(true);
  });
}
```

修改 `dragBottomHeight`：
```ts
function dragBottomHeight(e: MouseEvent) {
  const base = sk.bottomHeight.value;
  startDrag(e, 'y', (d) => {
    sk.bottomHeight.value = Math.max(80, Math.min(600, base - d));
    sk.notifyStateChange(true);
  });
}
```

修改 `dragLeftSplit`：
```ts
function dragLeftSplit(e: MouseEvent, totalHeight: number) {
  const base = sk.leftSplitRatio.value;
  startDrag(e, 'y', (d) => {
    sk.leftSplitRatio.value = Math.max(0.15, Math.min(0.85, base + d / totalHeight));
    sk.notifyStateChange(true);
  });
}
```

修改 `dragRightSplit`：
```ts
function dragRightSplit(e: MouseEvent, totalHeight: number) {
  const base = sk.rightSplitRatio.value;
  startDrag(e, 'y', (d) => {
    sk.rightSplitRatio.value = Math.max(0.15, Math.min(0.85, base + d / totalHeight));
    sk.notifyStateChange(true);
  });
}
```

修改 `dragBottomSplit`：
```ts
function dragBottomSplit(e: MouseEvent, totalWidth: number) {
  const base = sk.bottomSplitRatio.value;
  startDrag(e, 'x', (d) => {
    sk.bottomSplitRatio.value = Math.max(0.15, Math.min(0.85, base + d / totalWidth));
    sk.notifyStateChange(true);
  });
}
```

- [ ] **Step 3: 更新模板中的尺寸引用**

所有 `leftWidth.value` → `sk.leftWidth.value`
所有 `rightWidth.value` → `sk.rightWidth.value`
所有 `bottomHeight.value` → `sk.bottomHeight.value`
所有 `leftSplitRatio.value` → `sk.leftSplitRatio.value`
所有 `rightSplitRatio.value` → `sk.rightSplitRatio.value`
所有 `bottomSplitRatio.value` → `sk.bottomSplitRatio.value`
所有 `leftTopHeight.value` → `calc((100% - 4px) * ${sk.leftSplitRatio.value})` 等等

同时更新 computed 属性中对 old refs 的引用：
- `leftTopHeight`：将 `leftSplitRatio` 引用改为 `sk.leftSplitRatio`
- 其他 computed 同理

- [ ] **Step 4: 移除 CenterArea 中不再需要的 import**

`ref` 从 vue import 中移除（如果其他地方还在用就不移）。

- [ ] **Step 5: 编译检查**

```bash
cd packages/layplux && npx tsc --noEmit
```
Expected: 无类型错误

- [ ] **Step 6: Commit**

```bash
git add packages/layplux/src/layout/skeleton/center-area.tsx
git commit -m "refactor: migrate size state from CenterArea local refs to skeleton"
```

---

### Task 6: 更新公共 API 导出

**Files:**
- Modify: `packages/layplux/src/index.ts`

- [ ] **Step 1: 导出 SkeletonState 和 SkeletonOptions 类型**

在 `packages/layplux/src/index.ts` 中添加导出：

```ts
// 持久化状态类型
export type { SkeletonState } from './types/state';
export type { SkeletonOptions } from './managers/skeleton';
```

- [ ] **Step 2: 编译检查**

```bash
cd packages/layplux && npx tsc --noEmit
```
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add packages/layplux/src/index.ts
git commit -m "feat: export SkeletonState and SkeletonOptions types"
```

---

### Task 7: 构建验证与 playground 测试

**Files:**
- Modify: `packages/playground/src/App.vue`（临时测试用）

- [ ] **Step 1: 在 playground 中添加持久化测试代码**

在 `packages/playground/src/App.vue` 或 `main.ts` 中，添加 localStorage 持久化逻辑：

```ts
// 恢复状态
const saved = JSON.parse(localStorage.getItem('layplux-state') || '{}');
const skeleton = useSkeleton({ initialState: saved });

// 监听并持久化
skeleton.event.onGlobal('skeleton:state-changed', (state: any) => {
  console.log('state-changed', state);
  localStorage.setItem('layplux-state', JSON.stringify(state));
});
```

- [ ] **Step 2: 构建 layplux 库**

```bash
cd packages/layplux && pnpm build
```
Expected: 构建成功，无报错

- [ ] **Step 3: 启动 playground 验证**

```bash
cd packages/playground && pnpm dev
```

手动验证：
1. 拖拽左侧面板宽度 → 控制台应看到 `state-changed` 日志，localStorage 有数据
2. 切换面板视图模式 → 控制台立即看到 `state-changed` 日志
3. 刷新页面 → 面板尺寸和模式恢复

- [ ] **Step 4: 还原 playground 中的测试代码**（如果不想提交）

```bash
git checkout packages/playground/src/App.vue
```

- [ ] **Step 5: Commit**（如果有 playground 改动需要保留）

```bash
git add packages/playground/src/App.vue
git commit -m "test: add persistence demo in playground"
```

---

## 边界情况验证清单

实现完成后，手动验证以下场景：

- [ ] `useSkeleton()` 不传参数 → 所有值取默认，正常运行
- [ ] `useSkeleton({ initialState: {} })` → 所有值取默认
- [ ] `useSkeleton({ initialState: { leftWidth: 500 } })` → leftWidth=500，其他默认
- [ ] `initialState.activeIds` 包含不存在于任何 area 的 widget name → 忽略
- [ ] `initialState.viewModes` 包含未注册的 widget name → 忽略
- [ ] 快速连续拖拽分隔条 → `state-changed` 仅在停止后 300ms 触发一次
- [ ] 切换视图模式 → `state-changed` 立即触发
- [ ] 激活/关闭面板 → `state-changed` 立即触发
