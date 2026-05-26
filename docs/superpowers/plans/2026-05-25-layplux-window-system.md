# Layplux 窗口系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 IDEA 风格的窗口 UI 组件系统——Layplux 类作为核心入口，6 个纯逻辑 Manager，TSX 渲染壳子。

**Architecture:** Layplux 通过 assembler 注入到 PluginContext，管理 ToolWindow/Action/EditorArea/StatusBar/Focus/Layout 六个子系统。Manager 纯 TS class（无 Vue 依赖），组件层通过 `provide/inject` 获取 Layplux 实例并渲染。

**Tech Stack:** Vue 3 + TSX + Vitest

**文件结构:**
```
src/layplux/
  ├── types.ts
  ├── managers/
  │   ├── tool-window-manager.ts
  │   ├── action-manager.ts
  │   ├── editor-area-manager.ts
  │   ├── status-bar-manager.ts
  │   ├── focus-manager.ts
  │   └── layout-persistence.ts
  ├── layplux.ts
  ├── composables/
  │   └── use-layplux.ts
  ├── components/
  │   ├── layplux-host.tsx
  │   ├── stripe.tsx
  │   ├── tool-window-decorator.tsx
  │   ├── editor-area.tsx
  │   ├── status-bar.tsx
  │   └── glass-pane.tsx
  └── __tests__/
      ├── tool-window-manager.test.ts
      ├── action-manager.test.ts
      ├── editor-area-manager.test.ts
      ├── status-bar-manager.test.ts
      ├── focus-manager.test.ts
      ├── layout-persistence.test.ts
      └── layplux.test.ts
```

---

## 实现顺序

```
types → ToolWindowManager → ActionManager → EditorAreaManager
  → StatusBarManager → FocusManager → LayoutPersistence
  → Layplux class → composable → TSX components
```

---

### Task 1: 共享类型定义

**Files:**
- Create: `src/layplux/types.ts`

- [ ] **Step 1: 写入所有类型定义**

`src/layplux/types.ts`:

```typescript
import type { Component } from 'vue'

// ── Tool Window ──────────────────────────────────────────────

export type ToolWindowAnchor = 'left' | 'right' | 'bottom'
export type ToolWindowType = 'docked' | 'sliding' | 'undocked'
export type ToolWindowState = 'disabled' | 'enabled' | 'ready' | 'error'

export interface ToolWindowConfig {
  id: string
  anchor: ToolWindowAnchor
  title: string
  icon?: Component
  type?: ToolWindowType
  isSplit?: boolean
  factory: () => Component | Promise<Component>
}

export interface ToolWindowHandle {
  readonly id: string
  readonly state: ToolWindowState
  enable(): void
  disable(): void
  error(message: string): void
  activate(): void
  hide(): void
  dispose(): void
}

// ── Content (tab inside tool window) ─────────────────────────

export interface ContentInfo {
  id: string
  displayName: string
  component: Component
  isCloseable?: boolean
  preferredFocusableElement?: HTMLElement
}

export interface ContentManager {
  readonly activeContentId: string | null
  addContent(content: ContentInfo): Disposable
  removeContent(id: string): void
  setSelectedContent(id: string): void
  getAllContents(): ContentInfo[]
  readonly activeContent: ContentInfo | null
}

// ── Action ───────────────────────────────────────────────────

export interface ActionConfig {
  id: string
  text: string
  description?: string
  icon?: Component
  keyboard?: KeyboardShortcut | KeyboardShortcut[]
  group?: string
  update: (ctx: ActionContext) => ActionPresentation
  actionPerformed: (ctx: ActionContext) => void
}

export interface ActionPresentation {
  enabled: boolean
  visible: boolean
  text?: string
  icon?: Component
}

export interface KeyboardShortcut {
  modifier: 'ctrl' | 'alt' | 'shift' | 'meta'
  key: string
}

// ── Editor ───────────────────────────────────────────────────

export interface EditorProviderConfig {
  id: string
  factory: () => Component
}

// ── Status Bar ───────────────────────────────────────────────

export interface StatusWidgetConfig {
  id: string
  position: 'left' | 'center' | 'right'
  factory: () => Component
  update?: () => void
}

// ── Focus ────────────────────────────────────────────────────

export type FocusRegion = 'editor' | `toolWindow:${string}` | 'statusBar'

// ── Layout Persistence ───────────────────────────────────────

export interface ToolWindowLayoutState {
  id: string
  anchor: ToolWindowAnchor
  type: ToolWindowType
  visible: boolean
  splitProportion?: number
}

export interface LayoutState {
  version: number
  toolWindows: ToolWindowLayoutState[]
}

// ── Disposable ───────────────────────────────────────────────

export interface Disposable {
  dispose(): void
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `npx tsc --noEmit src/layplux/types.ts`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/layplux/types.ts
git commit -m "feat(layplux): add shared type definitions"
```

---

### Task 2: ToolWindowManager（纯逻辑）

**Files:**
- Create: `src/layplux/managers/tool-window-manager.ts`
- Create: `src/layplux/__tests__/tool-window-manager.test.ts`

- [ ] **Step 1: 写测试**

`src/layplux/__tests__/tool-window-manager.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { ToolWindowManager } from '../managers/tool-window-manager'
import type { ToolWindowConfig } from '../types'

function createConfig(overrides?: Partial<ToolWindowConfig>): ToolWindowConfig {
  return {
    id: 'test-tw',
    anchor: 'left',
    title: 'Test',
    factory: () => ({}) as any,
    ...overrides,
  }
}

describe('ToolWindowManager', () => {
  describe('register', () => {
    it('returns a handle with id and state=disabled', () => {
      const mgr = new ToolWindowManager()
      const handle = mgr.register(createConfig())
      expect(handle.id).toBe('test-tw')
      expect(handle.state).toBe('disabled')
    })

    it('throws on duplicate id', () => {
      const mgr = new ToolWindowManager()
      mgr.register(createConfig())
      expect(() => mgr.register(createConfig())).toThrow('already registered')
    })
  })

  describe('handle.enable()', () => {
    it('transitions disabled → enabled', () => {
      const mgr = new ToolWindowManager()
      const handle = mgr.register(createConfig())
      handle.enable()
      expect(handle.state).toBe('enabled')
    })

    it('is idempotent', () => {
      const mgr = new ToolWindowManager()
      const handle = mgr.register(createConfig())
      handle.enable()
      handle.enable()
      expect(handle.state).toBe('enabled')
    })
  })

  describe('handle.disable()', () => {
    it('transitions enabled → disabled', () => {
      const mgr = new ToolWindowManager()
      const handle = mgr.register(createConfig())
      handle.enable()
      handle.disable()
      expect(handle.state).toBe('disabled')
    })
  })

  describe('handle.error()', () => {
    it('transitions to error state with message', () => {
      const mgr = new ToolWindowManager()
      const handle = mgr.register(createConfig())
      handle.error('something went wrong')
      expect(handle.state).toBe('error')
    })

    it('stores the error message', () => {
      const mgr = new ToolWindowManager()
      const handle = mgr.register(createConfig())
      handle.error('timeout')
      const entry = mgr.getWindow('test-tw')
      expect(entry?.errorMessage).toBe('timeout')
    })

    it('can transition from any state to error', () => {
      const mgr = new ToolWindowManager()
      const handle = mgr.register(createConfig())
      handle.enable()
      handle.error('fail')
      expect(handle.state).toBe('error')
    })

    it('error→enable transitions to enabled', () => {
      const mgr = new ToolWindowManager()
      const handle = mgr.register(createConfig())
      handle.error('fail')
      handle.enable()
      expect(handle.state).toBe('enabled')
    })
  })

  describe('handle.activate()', () => {
    it('triggers factory and transitions enabled→ready', () => {
      const mgr = new ToolWindowManager()
      const component = {} as any
      const factory = vi.fn(() => component)
      const handle = mgr.register(createConfig({ factory }))
      handle.enable()
      handle.activate()
      expect(factory).toHaveBeenCalledTimes(1)
      expect(handle.state).toBe('ready')
    })

    it('does nothing when state is disabled', () => {
      const mgr = new ToolWindowManager()
      const factory = vi.fn()
      const handle = mgr.register(createConfig({ factory }))
      handle.activate()
      expect(factory).not.toHaveBeenCalled()
    })

    it('does not re-trigger factory when already ready', () => {
      const mgr = new ToolWindowManager()
      const factory = vi.fn(() => ({} as any))
      const handle = mgr.register(createConfig({ factory }))
      handle.enable()
      handle.activate()
      handle.activate()
      expect(factory).toHaveBeenCalledTimes(1)
    })

    it('stays ready when factory returns Promise', async () => {
      const mgr = new ToolWindowManager()
      const factory = vi.fn(() => Promise.resolve({} as any))
      const handle = mgr.register(createConfig({ factory }))
      handle.enable()
      handle.activate()
      // state is 'ready' immediately (sync), component resolves later
      // The factory promise is tracked internally, renderer reads component
      expect(handle.state).toBe('ready')
    })
  })

  describe('handle.hide()', () => {
    it('marks window as not visible', () => {
      const mgr = new ToolWindowManager()
      const handle = mgr.register(createConfig())
      handle.enable()
      handle.activate()
      handle.hide()
      const entry = mgr.getWindow('test-tw')
      expect(entry?.visible).toBe(false)
    })
  })

  describe('getWindow', () => {
    it('returns entry for registered window', () => {
      const mgr = new ToolWindowManager()
      mgr.register(createConfig())
      expect(mgr.getWindow('test-tw')).toBeDefined()
    })

    it('returns undefined for unknown id', () => {
      const mgr = new ToolWindowManager()
      expect(mgr.getWindow('unknown')).toBeUndefined()
    })
  })

  describe('getWindowsByAnchor', () => {
    it('returns windows filtered by anchor', () => {
      const mgr = new ToolWindowManager()
      mgr.register(createConfig({ id: 'a', anchor: 'left' }))
      mgr.register(createConfig({ id: 'b', anchor: 'right' }))
      mgr.register(createConfig({ id: 'c', anchor: 'left' }))
      expect(mgr.getWindowsByAnchor('left')).toHaveLength(2)
      expect(mgr.getWindowsByAnchor('right')).toHaveLength(1)
    })
  })

  describe('handle.dispose()', () => {
    it('removes window from registry', () => {
      const mgr = new ToolWindowManager()
      const handle = mgr.register(createConfig())
      handle.dispose()
      expect(mgr.getWindow('test-tw')).toBeUndefined()
    })
  })

  describe('ContentManager', () => {
    it('getContentManager returns ContentManager for a ready window', () => {
      const mgr = new ToolWindowManager()
      const handle = mgr.register(createConfig())
      handle.enable()
      handle.activate()
      const cm = mgr.getContentManager('test-tw')
      expect(cm).toBeDefined()
      expect(cm.addContent).toBeDefined()
    })

    it('throws when window not ready', () => {
      const mgr = new ToolWindowManager()
      mgr.register(createConfig())
      expect(() => mgr.getContentManager('test-tw')).toThrow()
    })

    it('addContent adds a tab', () => {
      const mgr = new ToolWindowManager()
      const handle = mgr.register(createConfig())
      handle.enable()
      handle.activate()
      const cm = mgr.getContentManager('test-tw')
      const comp = {} as any
      cm.addContent({ id: 'tab1', displayName: 'Tab 1', component: comp })
      expect(cm.getAllContents()).toHaveLength(1)
      expect(cm.activeContent).not.toBeNull()
    })

    it('removeContent removes a tab', () => {
      const mgr = new ToolWindowManager()
      const handle = mgr.register(createConfig())
      handle.enable()
      handle.activate()
      const cm = mgr.getContentManager('test-tw')
      cm.addContent({ id: 'tab1', displayName: 'Tab 1', component: {} as any })
      cm.addContent({ id: 'tab2', displayName: 'Tab 2', component: {} as any })
      cm.removeContent('tab1')
      expect(cm.getAllContents()).toHaveLength(1)
    })

    it('setSelectedContent switches active tab', () => {
      const mgr = new ToolWindowManager()
      const handle = mgr.register(createConfig())
      handle.enable()
      handle.activate()
      const cm = mgr.getContentManager('test-tw')
      cm.addContent({ id: 'tab1', displayName: 'Tab 1', component: {} as any })
      cm.addContent({ id: 'tab2', displayName: 'Tab 2', component: {} as any })
      cm.setSelectedContent('tab2')
      expect(cm.activeContentId).toBe('tab2')
    })
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/layplux/__tests__/tool-window-manager.test.ts`
Expected: FAIL (ToolWindowManager not defined)

- [ ] **Step 3: 实现 ToolWindowManager**

`src/layplux/managers/tool-window-manager.ts`:

```typescript
import type {
  ToolWindowConfig,
  ToolWindowHandle,
  ToolWindowState,
  ToolWindowAnchor,
  ContentManager as ContentManagerInterface,
  ContentInfo,
  Disposable,
} from '../types'
import type { Component } from 'vue'

interface ToolWindowEntry {
  config: ToolWindowConfig
  state: ToolWindowState
  component: Component | null
  visible: boolean
  type: 'docked' | 'sliding' | 'undocked'
  contentType: 'docked' | 'sliding' | 'undocked'
  errorMessage: string | null
  contentManager: ContentManagerImpl | null
}

class ContentManagerImpl implements ContentManagerInterface {
  private contents: ContentInfo[] = []
  private _activeContentId: string | null = null

  get activeContentId(): string | null {
    return this._activeContentId
  }

  get activeContent(): ContentInfo | null {
    return this.contents.find((c) => c.id === this._activeContentId) ?? null
  }

  addContent(content: ContentInfo): Disposable {
    this.contents.push(content)
    if (this._activeContentId === null) {
      this._activeContentId = content.id
    }
    return {
      dispose: () => this.removeContent(content.id),
    }
  }

  removeContent(id: string): void {
    const idx = this.contents.findIndex((c) => c.id === id)
    if (idx === -1) return
    this.contents.splice(idx, 1)
    if (this._activeContentId === id) {
      this._activeContentId = this.contents[0]?.id ?? null
    }
  }

  setSelectedContent(id: string): void {
    if (this.contents.some((c) => c.id === id)) {
      this._activeContentId = id
    }
  }

  getAllContents(): ContentInfo[] {
    return [...this.contents]
  }
}

class ToolWindowHandleImpl implements ToolWindowHandle {
  constructor(
    public readonly id: string,
    private entry: ToolWindowEntry,
    private onDispose: (id: string) => void,
  ) {}

  get state(): ToolWindowState {
    return this.entry.state
  }

  enable(): void {
    if (this.entry.state !== 'disabled' && this.entry.state !== 'error') return
    this.entry.state = 'enabled'
    this.entry.errorMessage = null
  }

  disable(): void {
    if (this.entry.state === 'disabled') return
    this.entry.state = 'disabled'
  }

  error(message: string): void {
    this.entry.state = 'error'
    this.entry.errorMessage = message
  }

  activate(): void {
    if (this.entry.state !== 'enabled') return
    this.entry.visible = true
    // If already have component (from async factory), don't re-create
    if (this.entry.component !== null) {
      this.entry.state = 'ready'
      return
    }
    const result = this.entry.config.factory()
    if (result instanceof Promise) {
      result.then((comp) => {
        if (this.entry.state !== 'ready' && this.entry.state !== 'error') {
          this.entry.state = 'ready'
        }
        this.entry.component = comp
        this.entry.contentManager = new ContentManagerImpl()
      })
      this.entry.state = 'ready'
    } else {
      this.entry.component = result
      this.entry.contentManager = new ContentManagerImpl()
      this.entry.state = 'ready'
    }
  }

  hide(): void {
    this.entry.visible = false
  }

  dispose(): void {
    this.onDispose(this.id)
  }
}

export class ToolWindowManager {
  private windows = new Map<string, ToolWindowEntry>()

  register(config: ToolWindowConfig): ToolWindowHandle {
    if (this.windows.has(config.id)) {
      throw new Error(`[ToolWindowManager] Tool window "${config.id}" already registered`)
    }
    const entry: ToolWindowEntry = {
      config,
      state: 'disabled',
      component: null,
      visible: false,
      type: config.type ?? 'docked',
      contentType: config.type ?? 'docked',
      errorMessage: null,
      contentManager: null,
    }
    this.windows.set(config.id, entry)
    return new ToolWindowHandleImpl(config.id, entry, (id) => this.windows.delete(id))
  }

  getWindow(id: string): ToolWindowEntry | undefined {
    return this.windows.get(id)
  }

  getWindowsByAnchor(anchor: ToolWindowAnchor): ToolWindowEntry[] {
    return [...this.windows.values()].filter((w) => w.config.anchor === anchor)
  }

  activate(id: string): void {
    this.windows.get(id)?.config.factory()
  }

  hide(id: string): void {
    const entry = this.windows.get(id)
    if (entry) entry.visible = false
  }

  toggle(id: string): void {
    const entry = this.windows.get(id)
    if (!entry) return
    if (entry.visible) {
      entry.visible = false
    } else {
      // activate via the stored config
      entry.visible = true
      if (entry.component === null && entry.state === 'enabled') {
        const result = entry.config.factory()
        if (result instanceof Promise) {
          result.then((comp) => {
            entry.component = comp
            entry.contentManager = new ContentManagerImpl()
          })
          entry.state = 'ready'
        } else {
          entry.component = result
          entry.contentManager = new ContentManagerImpl()
          entry.state = 'ready'
        }
      }
    }
  }

  setType(id: string, type: 'docked' | 'sliding' | 'undocked'): void {
    const entry = this.windows.get(id)
    if (entry) entry.type = type
  }

  getContentManager(id: string): ContentManagerImpl {
    const entry = this.windows.get(id)
    if (!entry) throw new Error(`[ToolWindowManager] Unknown tool window "${id}"`)
    if (!entry.contentManager) {
      throw new Error(
        `[ToolWindowManager] Tool window "${id}" has no content manager (not ready yet)`,
      )
    }
    return entry.contentManager
  }

  /** 获取所有注册的 window entry，供渲染层使用 */
  getAllWindows(): ToolWindowEntry[] {
    return [...this.windows.values()]
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/layplux/__tests__/tool-window-manager.test.ts`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/layplux/managers/tool-window-manager.ts src/layplux/__tests__/tool-window-manager.test.ts
git commit -m "feat(layplux): add ToolWindowManager with state machine and content tabs"
```

---

### Task 3: ActionManager（纯逻辑）

**Files:**
- Create: `src/layplux/managers/action-manager.ts`
- Create: `src/layplux/__tests__/action-manager.test.ts`

- [ ] **Step 1: 写测试**

`src/layplux/__tests__/action-manager.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ActionManager } from '../managers/action-manager'
import type { ActionConfig, ActionContext } from '../types'

function createAction(
  id: string,
  overrides?: Partial<ActionConfig>,
): ActionConfig {
  return {
    id,
    text: id,
    update: () => ({ enabled: true, visible: true }),
    actionPerformed: vi.fn(),
    ...overrides,
  }
}

function createTestContext(overrides?: Partial<ActionContext>): ActionContext {
  return {
    getData: vi.fn(),
    layplux: undefined as any,
    focusComponent: 'editor',
    ...overrides,
  }
}

describe('ActionManager', () => {
  let manager: ActionManager

  beforeEach(() => {
    manager = new ActionManager()
  })

  afterEach(() => {
    manager.dispose()
  })

  describe('register', () => {
    it('stores action and returns Disposable', () => {
      const action = createAction('test')
      const d = manager.register(action)
      expect(manager.getAction('test')).toBe(action)
      expect(d.dispose).toBeDefined()
    })

    it('throws on duplicate id', () => {
      manager.register(createAction('test'))
      expect(() => manager.register(createAction('test'))).toThrow(
        'already registered',
      )
    })

    it('dispose removes action', () => {
      const d = manager.register(createAction('test'))
      d.dispose()
      expect(manager.getAction('test')).toBeUndefined()
    })
  })

  describe('keyboard shortcuts', () => {
    it('matches keyboard shortcut and calls actionPerformed', () => {
      const actionPerformed = vi.fn()
      manager.register(
        createAction('save', {
          keyboard: { modifier: 'ctrl', key: 's' },
          actionPerformed,
        }),
      )

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      })
      manager.handleKeyDown(event)

      expect(actionPerformed).toHaveBeenCalledTimes(1)
    })

    it('does not match when shortcut key differs', () => {
      const actionPerformed = vi.fn()
      manager.register(
        createAction('save', {
          keyboard: { modifier: 'ctrl', key: 's' },
          actionPerformed,
        }),
      )

      const event = new KeyboardEvent('keydown', {
        key: 'x',
        ctrlKey: true,
        bubbles: true,
      })
      manager.handleKeyDown(event)

      expect(actionPerformed).not.toHaveBeenCalled()
    })

    it('respects meta modifier on mac', () => {
      const actionPerformed = vi.fn()
      manager.register(
        createAction('save', {
          keyboard: { modifier: 'meta', key: 's' },
          actionPerformed,
        }),
      )

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        bubbles: true,
      })
      manager.handleKeyDown(event)

      expect(actionPerformed).toHaveBeenCalledTimes(1)
    })

    it('does not intercept when target is input element', () => {
      const actionPerformed = vi.fn()
      manager.register(
        createAction('save', {
          keyboard: { modifier: 'ctrl', key: 's' },
          actionPerformed,
        }),
      )

      const input = document.createElement('input')
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: input, writable: false })

      manager.handleKeyDown(event)
      expect(actionPerformed).not.toHaveBeenCalled()
    })

    it('does not intercept when target is textarea', () => {
      const actionPerformed = vi.fn()
      manager.register(
        createAction('save', {
          keyboard: { modifier: 'ctrl', key: 's' },
          actionPerformed,
        }),
      )

      const textarea = document.createElement('textarea')
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: textarea, writable: false })

      manager.handleKeyDown(event)
      expect(actionPerformed).not.toHaveBeenCalled()
    })

    it('does intercept when target is contenteditable div', () => {
      const actionPerformed = vi.fn()
      manager.register(
        createAction('save', {
          keyboard: { modifier: 'ctrl', key: 's' },
          actionPerformed,
        }),
      )

      const div = document.createElement('div')
      div.contentEditable = 'true'
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: div, writable: false })

      manager.handleKeyDown(event)
      expect(actionPerformed).not.toHaveBeenCalled()
    })

    it('disabled action does not fire', () => {
      const actionPerformed = vi.fn()
      manager.register(
        createAction('save', {
          keyboard: { modifier: 'ctrl', key: 's' },
          update: () => ({ enabled: false, visible: true }),
          actionPerformed,
        }),
      )

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      })
      manager.handleKeyDown(event)

      expect(actionPerformed).not.toHaveBeenCalled()
    })

    it('supports multiple keyboard shortcuts for one action', () => {
      const actionPerformed = vi.fn()
      manager.register(
        createAction('save', {
          keyboard: [
            { modifier: 'ctrl', key: 's' },
            { modifier: 'meta', key: 's' },
          ],
          actionPerformed,
        }),
      )

      const event1 = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true })
      manager.handleKeyDown(event1)
      expect(actionPerformed).toHaveBeenCalledTimes(1)

      const event2 = new KeyboardEvent('keydown', { key: 's', metaKey: true, bubbles: true })
      manager.handleKeyDown(event2)
      expect(actionPerformed).toHaveBeenCalledTimes(2)
    })
  })

  describe('updateAll', () => {
    it('calls update on all registered actions', () => {
      const update1 = vi.fn(() => ({ enabled: true, visible: true }))
      const update2 = vi.fn(() => ({ enabled: false, visible: true }))
      manager.register(createAction('a', { update: update1 }))
      manager.register(createAction('b', { update: update2 }))

      manager.updateAll(createTestContext())

      expect(update1).toHaveBeenCalledTimes(1)
      expect(update2).toHaveBeenCalledTimes(1)
    })
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/layplux/__tests__/action-manager.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现 ActionManager**

`src/layplux/managers/action-manager.ts`:

```typescript
import type { ActionConfig, ActionContext, KeyboardShortcut, Disposable } from '../types'

function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (target.isContentEditable) return true
  return false
}

function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
  if (!keyMatch) return false

  const modifierMap: Record<string, boolean> = {
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
  }
  const expectedMod = modifierMap[shortcut.modifier] ?? false
  if (!expectedMod) return false

  // Ensure no other modifier is pressed
  const allMods = ['ctrl', 'alt', 'shift', 'meta'] as const
  for (const mod of allMods) {
    if (mod !== shortcut.modifier && modifierMap[mod]) return false
  }
  return true
}

interface RegisteredAction {
  config: ActionConfig
  shortcuts: KeyboardShortcut[]
}

export class ActionManager {
  private actions = new Map<string, RegisteredAction>()

  register(config: ActionConfig): Disposable {
    if (this.actions.has(config.id)) {
      throw new Error(`[ActionManager] Action "${config.id}" already registered`)
    }
    const shortcuts: KeyboardShortcut[] = config.keyboard
      ? Array.isArray(config.keyboard)
        ? config.keyboard
        : [config.keyboard]
      : []
    this.actions.set(config.id, { config, shortcuts })
    return {
      dispose: () => this.actions.delete(config.id),
    }
  }

  getAction(id: string): ActionConfig | undefined {
    return this.actions.get(id)?.config
  }

  handleKeyDown(event: KeyboardEvent): boolean {
    if (isEditableElement(event.target)) return false

    for (const { config, shortcuts } of this.actions.values()) {
      for (const shortcut of shortcuts) {
        if (matchesShortcut(event, shortcut)) {
          // Check update() before firing
          const ctx: ActionContext = this.createContext()
          const presentation = config.update(ctx)
          if (!presentation.enabled) continue

          event.preventDefault()
          event.stopPropagation()
          config.actionPerformed(ctx)
          return true
        }
      }
    }
    return false
  }

  updateAll(ctx: ActionContext): void {
    for (const { config } of this.actions.values()) {
      config.update(ctx)
    }
  }

  /** 注册全局 keydown listener */
  attach(): void {
    document.addEventListener('keydown', this._keydownHandler)
  }

  detach(): void {
    document.removeEventListener('keydown', this._keydownHandler)
  }

  dispose(): void {
    this.detach()
    this.actions.clear()
  }

  private _keydownHandler = (event: KeyboardEvent) => {
    this.handleKeyDown(event)
  }

  private createContext(): ActionContext {
    return {
      getData: () => undefined,
      layplux: undefined as any, // injected externally
      focusComponent: 'editor',
    }
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/layplux/__tests__/action-manager.test.ts`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/layplux/managers/action-manager.ts src/layplux/__tests__/action-manager.test.ts
git commit -m "feat(layplux): add ActionManager with keyboard shortcut matching"
```

---

### Task 4: EditorAreaManager（纯逻辑）

**Files:**
- Create: `src/layplux/managers/editor-area-manager.ts`
- Create: `src/layplux/__tests__/editor-area-manager.test.ts`

- [ ] **Step 1: 写测试**

`src/layplux/__tests__/editor-area-manager.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { EditorAreaManager } from '../managers/editor-area-manager'

describe('EditorAreaManager', () => {
  it('starts with no content', () => {
    const mgr = new EditorAreaManager()
    expect(mgr.activeProviderId).toBeNull()
    expect(mgr.getContent()).toBeNull()
  })

  it('setContent sets a factory and stores id', () => {
    const mgr = new EditorAreaManager()
    const comp = {} as any
    mgr.setContent('primary', () => comp)
    expect(mgr.activeProviderId).toBe('primary')
    expect(mgr.getContent()).toBe(comp)
  })

  it('setContent replaces previous content', () => {
    const mgr = new EditorAreaManager()
    const comp1 = {} as any
    const comp2 = {} as any
    mgr.setContent('a', () => comp1)
    mgr.setContent('b', () => comp2)
    expect(mgr.activeProviderId).toBe('b')
  })

  it('clear removes content', () => {
    const mgr = new EditorAreaManager()
    mgr.setContent('primary', () => ({} as any))
    mgr.clear()
    expect(mgr.activeProviderId).toBeNull()
    expect(mgr.getContent()).toBeNull()
  })

  it('onChange callback fires on setContent', () => {
    const mgr = new EditorAreaManager()
    const onChange = vi.fn()
    mgr.onChange(onChange)
    mgr.setContent('p', () => ({} as any))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('offChange removes callback', () => {
    const mgr = new EditorAreaManager()
    const onChange = vi.fn()
    const off = mgr.onChange(onChange)
    off()
    mgr.setContent('p', () => ({} as any))
    expect(onChange).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/layplux/__tests__/editor-area-manager.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现 EditorAreaManager**

`src/layplux/managers/editor-area-manager.ts`:

```typescript
import type { Component } from 'vue'

type ChangeCallback = () => void

export class EditorAreaManager {
  private _activeProviderId: string | null = null
  private _content: Component | null = null
  private factory: (() => Component) | null = null
  private listeners: ChangeCallback[] = []

  get activeProviderId(): string | null {
    return this._activeProviderId
  }

  setContent(id: string, factory: () => Component): void {
    this._activeProviderId = id
    this.factory = factory
    this._content = factory()
    this.notify()
  }

  getContent(): Component | null {
    return this._content
  }

  clear(): void {
    this._activeProviderId = null
    this._content = null
    this.factory = null
    this.notify()
  }

  onChange(cb: ChangeCallback): () => void {
    this.listeners.push(cb)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb)
    }
  }

  private notify(): void {
    for (const cb of this.listeners) {
      cb()
    }
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/layplux/__tests__/editor-area-manager.test.ts`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/layplux/managers/editor-area-manager.ts src/layplux/__tests__/editor-area-manager.test.ts
git commit -m "feat(layplux): add EditorAreaManager as black-box container"
```

---

### Task 5: StatusBarManager + FocusManager + LayoutPersistence

**Files:**
- Create: `src/layplux/managers/status-bar-manager.ts`
- Create: `src/layplux/managers/focus-manager.ts`
- Create: `src/layplux/managers/layout-persistence.ts`
- Create: `src/layplux/__tests__/status-bar-manager.test.ts`
- Create: `src/layplux/__tests__/focus-manager.test.ts`
- Create: `src/layplux/__tests__/layout-persistence.test.ts`

- [ ] **Step 1: 写 StatusBarManager 测试**

`src/layplux/__tests__/status-bar-manager.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { StatusBarManager } from '../managers/status-bar-manager'
import type { StatusWidgetConfig } from '../types'

function createWidget(
  overrides?: Partial<StatusWidgetConfig>,
): StatusWidgetConfig {
  return {
    id: 'test-widget',
    position: 'left',
    factory: () => ({} as any),
    ...overrides,
  }
}

describe('StatusBarManager', () => {
  it('register adds widget', () => {
    const mgr = new StatusBarManager()
    const d = mgr.register(createWidget())
    expect(mgr.getWidgets()).toHaveLength(1)
    expect(d.dispose).toBeDefined()
  })

  it('throws on duplicate id', () => {
    const mgr = new StatusBarManager()
    mgr.register(createWidget({ id: 'w1' }))
    expect(() => mgr.register(createWidget({ id: 'w1' }))).toThrow(
      'already registered',
    )
  })

  it('dispose removes widget', () => {
    const mgr = new StatusBarManager()
    const d = mgr.register(createWidget())
    d.dispose()
    expect(mgr.getWidgets()).toHaveLength(0)
  })

  it('widgets are grouped by position', () => {
    const mgr = new StatusBarManager()
    mgr.register(createWidget({ id: 'a', position: 'left' }))
    mgr.register(createWidget({ id: 'b', position: 'right' }))
    mgr.register(createWidget({ id: 'c', position: 'left' }))

    const left = mgr.getWidgetsByPosition('left')
    const right = mgr.getWidgetsByPosition('right')
    const center = mgr.getWidgetsByPosition('center')

    expect(left).toHaveLength(2)
    expect(right).toHaveLength(1)
    expect(center).toHaveLength(0)
  })
})
```

- [ ] **Step 2: 写 FocusManager 测试**

`src/layplux/__tests__/focus-manager.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { FocusManager } from '../managers/focus-manager'

describe('FocusManager', () => {
  it('starts with null focus', () => {
    const mgr = new FocusManager()
    expect(mgr.currentFocus).toBeNull()
  })

  it('requestFocus sets current focus', () => {
    const mgr = new FocusManager()
    mgr.requestFocus('editor')
    expect(mgr.currentFocus).toBe('editor')
  })

  it('requestFocus for tool window', () => {
    const mgr = new FocusManager()
    mgr.requestFocus('toolWindow:project')
    expect(mgr.currentFocus).toBe('toolWindow:project')
  })

  it('handleEscape from tool window jumps to editor', () => {
    const mgr = new FocusManager()
    mgr.requestFocus('toolWindow:terminal')
    const result = mgr.handleEscape()
    expect(mgr.currentFocus).toBe('editor')
    expect(result).toBe('editor')
  })

  it('handleEscape from editor stays on editor', () => {
    const mgr = new FocusManager()
    mgr.requestFocus('editor')
    const result = mgr.handleEscape()
    expect(mgr.currentFocus).toBe('editor')
    expect(result).toBeNull()
  })

  it('handleEscape from statusBar jumps to editor', () => {
    const mgr = new FocusManager()
    mgr.requestFocus('statusBar')
    const result = mgr.handleEscape()
    expect(mgr.currentFocus).toBe('editor')
  })

  it('onChange fires on focus change', () => {
    const mgr = new FocusManager()
    const cb = vi.fn()
    mgr.onChange(cb)
    mgr.requestFocus('editor')
    expect(cb).toHaveBeenCalledWith('editor')
  })
})
```

- [ ] **Step 3: 写 LayoutPersistence 测试**

`src/layplux/__tests__/layout-persistence.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LayoutPersistence } from '../managers/layout-persistence'
import type { LayoutState } from '../types'

describe('LayoutPersistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('serialize returns layout state', () => {
    const lp = new LayoutPersistence()
    const state = lp.serialize()
    expect(state.version).toBe(1)
    expect(Array.isArray(state.toolWindows)).toBe(true)
  })

  it('restore and serialize round-trip', () => {
    const lp = new LayoutPersistence()
    const original: LayoutState = {
      version: 1,
      toolWindows: [
        { id: 'project', anchor: 'left', type: 'docked', visible: true },
        { id: 'terminal', anchor: 'bottom', type: 'docked', visible: false },
      ],
    }
    lp.restore(original)
    const serialized = lp.serialize()
    expect(serialized.toolWindows).toEqual(original.toolWindows)
  })

  it('save to localStorage and load', () => {
    const lp = new LayoutPersistence()
    const state: LayoutState = {
      version: 1,
      toolWindows: [
        { id: 'project', anchor: 'left', type: 'docked', visible: true },
      ],
    }
    lp.save()
    lp.restore(state)

    const lp2 = new LayoutPersistence()
    const loaded = lp2.load()
    expect(loaded).not.toBeNull()
    expect(loaded!.toolWindows).toHaveLength(1)
  })

  it('set updates a specific tool window state', () => {
    const lp = new LayoutPersistence()
    lp.setToolWindowState({ id: 'project', anchor: 'left', type: 'docked', visible: true })
    const state = lp.serialize()
    expect(state.toolWindows).toHaveLength(1)
    expect(state.toolWindows[0]!.id).toBe('project')
  })

  it('setToolWindowState replaces existing entry with same id', () => {
    const lp = new LayoutPersistence()
    lp.setToolWindowState({ id: 'project', anchor: 'left', type: 'docked', visible: true })
    lp.setToolWindowState({ id: 'project', anchor: 'left', type: 'sliding', visible: false })
    const state = lp.serialize()
    expect(state.toolWindows).toHaveLength(1)
    expect(state.toolWindows[0]!.type).toBe('sliding')
    expect(state.toolWindows[0]!.visible).toBe(false)
  })
})
```

- [ ] **Step 4: 运行测试确认失败**

```bash
npx vitest run src/layplux/__tests__/status-bar-manager.test.ts
npx vitest run src/layplux/__tests__/focus-manager.test.ts
npx vitest run src/layplux/__tests__/layout-persistence.test.ts
```
Expected: all FAIL

- [ ] **Step 5: 实现三个 Manager**

`src/layplux/managers/status-bar-manager.ts`:

```typescript
import type { StatusWidgetConfig, Disposable } from '../types'

interface WidgetEntry {
  config: StatusWidgetConfig
}

export class StatusBarManager {
  private widgets = new Map<string, WidgetEntry>()

  register(config: StatusWidgetConfig): Disposable {
    if (this.widgets.has(config.id)) {
      throw new Error(`[StatusBarManager] Widget "${config.id}" already registered`)
    }
    this.widgets.set(config.id, { config })
    return {
      dispose: () => this.widgets.delete(config.id),
    }
  }

  getWidgets(): StatusWidgetConfig[] {
    return [...this.widgets.values()].map((e) => e.config)
  }

  getWidgetsByPosition(position: 'left' | 'center' | 'right'): StatusWidgetConfig[] {
    return this.getWidgets().filter((w) => w.position === position)
  }
}
```

`src/layplux/managers/focus-manager.ts`:

```typescript
import type { FocusRegion } from '../types'

type FocusCallback = (focus: FocusRegion | null) => void

export class FocusManager {
  private _currentFocus: FocusRegion | null = null
  private listeners: FocusCallback[] = []

  get currentFocus(): FocusRegion | null {
    return this._currentFocus
  }

  requestFocus(target: FocusRegion): void {
    this._currentFocus = target
    this.notify()
  }

  /** 返回新的焦点区域，或 null 表示不需要跳转 */
  handleEscape(): FocusRegion | 'editor' | null {
    if (this._currentFocus === 'editor') {
      return null
    }
    if (this._currentFocus?.startsWith('toolWindow:')) {
      this.requestFocus('editor')
      return 'editor'
    }
    // statusBar or null → jump to editor
    this.requestFocus('editor')
    return 'editor'
  }

  onChange(cb: FocusCallback): () => void {
    this.listeners.push(cb)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb)
    }
  }

  private notify(): void {
    for (const cb of this.listeners) {
      cb(this._currentFocus)
    }
  }
}
```

`src/layplux/managers/layout-persistence.ts`:

```typescript
import type { LayoutState, ToolWindowLayoutState } from '../types'

const STORAGE_KEY = 'layplux-layout'

export class LayoutPersistence {
  private layout: LayoutState = {
    version: 1,
    toolWindows: [],
  }

  serialize(): LayoutState {
    return {
      ...this.layout,
      toolWindows: [...this.layout.toolWindows],
    }
  }

  restore(state: LayoutState): void {
    this.layout = {
      version: state.version,
      toolWindows: [...state.toolWindows],
    }
  }

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.layout))
    } catch {
      // localStorage not available (SSR, sandboxed iframe)
    }
  }

  load(): LayoutState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as LayoutState
    } catch {
      return null
    }
  }

  setToolWindowState(state: ToolWindowLayoutState): void {
    const idx = this.layout.toolWindows.findIndex((tw) => tw.id === state.id)
    if (idx === -1) {
      this.layout.toolWindows.push(state)
    } else {
      this.layout.toolWindows[idx] = state
    }
  }
}
```

- [ ] **Step 6: 运行测试确认通过**

```bash
npx vitest run src/layplux/__tests__/status-bar-manager.test.ts
npx vitest run src/layplux/__tests__/focus-manager.test.ts
npx vitest run src/layplux/__tests__/layout-persistence.test.ts
```
Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add src/layplux/managers/status-bar-manager.ts src/layplux/managers/focus-manager.ts src/layplux/managers/layout-persistence.ts
git add src/layplux/__tests__/status-bar-manager.test.ts src/layplux/__tests__/focus-manager.test.ts src/layplux/__tests__/layout-persistence.test.ts
git commit -m "feat(layplux): add StatusBarManager, FocusManager, LayoutPersistence"
```

---

### Task 6: Layplux 类

**Files:**
- Create: `src/layplux/layplux.ts`
- Create: `src/layplux/__tests__/layplux.test.ts`

- [ ] **Step 1: 写测试**

`src/layplux/__tests__/layplux.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { Layplux } from '../layplux'

describe('Layplux', () => {
  it('creates all six managers', () => {
    const layplux = new Layplux()
    expect(layplux.toolWindowManager).toBeDefined()
    expect(layplux.actionManager).toBeDefined()
    expect(layplux.editorAreaManager).toBeDefined()
    expect(layplux.statusBarManager).toBeDefined()
    expect(layplux.focusManager).toBeDefined()
    expect(layplux.layoutPersistence).toBeDefined()
  })

  it('registerToolWindow delegates to ToolWindowManager', () => {
    const layplux = new Layplux()
    const handle = layplux.registerToolWindow({
      id: 'tw',
      anchor: 'left',
      title: 'Test',
      factory: () => ({} as any),
    })
    expect(handle.id).toBe('tw')
    expect(handle.state).toBe('disabled')
  })

  it('registerAction delegates to ActionManager', () => {
    const layplux = new Layplux()
    const d = layplux.registerAction({
      id: 'action',
      text: 'Test',
      update: () => ({ enabled: true, visible: true }),
      actionPerformed: () => {},
    })
    expect(layplux.actionManager.getAction('action')).toBeDefined()
    d.dispose()
  })

  it('registerEditorProvider delegates to EditorAreaManager', () => {
    const layplux = new Layplux()
    const d = layplux.registerEditorProvider({
      id: 'editor',
      factory: () => ({} as any),
    })
    expect(layplux.editorAreaManager.activeProviderId).toBe('editor')
    d.dispose()
    expect(layplux.editorAreaManager.activeProviderId).toBeNull()
  })

  it('registerStatusWidget delegates to StatusBarManager', () => {
    const layplux = new Layplux()
    const d = layplux.registerStatusWidget({
      id: 'widget',
      position: 'left',
      factory: () => ({} as any),
    })
    expect(layplux.statusBarManager.getWidgets()).toHaveLength(1)
    d.dispose()
    expect(layplux.statusBarManager.getWidgets()).toHaveLength(0)
  })

  it('destroy cleans up', () => {
    const layplux = new Layplux()
    layplux.registerToolWindow({
      id: 'tw',
      anchor: 'left',
      title: 'Test',
      factory: () => ({} as any),
    })
    layplux.registerAction({
      id: 'action',
      text: 'Test',
      update: () => ({ enabled: true, visible: true }),
      actionPerformed: () => {},
    })
    layplux.destroy()
    expect(layplux.actionManager.getAction('action')).toBeUndefined()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/layplux/__tests__/layplux.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现 Layplux 类**

`src/layplux/layplux.ts`:

```typescript
import { ToolWindowManager } from './managers/tool-window-manager'
import { ActionManager } from './managers/action-manager'
import { EditorAreaManager } from './managers/editor-area-manager'
import { StatusBarManager } from './managers/status-bar-manager'
import { FocusManager } from './managers/focus-manager'
import { LayoutPersistence } from './managers/layout-persistence'
import type {
  ToolWindowConfig,
  ToolWindowHandle,
  ActionConfig,
  EditorProviderConfig,
  StatusWidgetConfig,
  Disposable,
} from './types'

export class Layplux {
  readonly toolWindowManager: ToolWindowManager
  readonly actionManager: ActionManager
  readonly editorAreaManager: EditorAreaManager
  readonly statusBarManager: StatusBarManager
  readonly focusManager: FocusManager
  readonly layoutPersistence: LayoutPersistence

  constructor() {
    this.toolWindowManager = new ToolWindowManager()
    this.actionManager = new ActionManager()
    this.editorAreaManager = new EditorAreaManager()
    this.statusBarManager = new StatusBarManager()
    this.focusManager = new FocusManager()
    this.layoutPersistence = new LayoutPersistence()
  }

  registerToolWindow(config: ToolWindowConfig): ToolWindowHandle {
    return this.toolWindowManager.register(config)
  }

  registerAction(config: ActionConfig): Disposable {
    return this.actionManager.register(config)
  }

  registerEditorProvider(config: EditorProviderConfig): Disposable {
    this.editorAreaManager.setContent(config.id, config.factory)
    return {
      dispose: () => this.editorAreaManager.clear(),
    }
  }

  registerStatusWidget(config: StatusWidgetConfig): Disposable {
    return this.statusBarManager.register(config)
  }

  destroy(): void {
    this.actionManager.dispose()
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/layplux/__tests__/layplux.test.ts`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/layplux/layplux.ts src/layplux/__tests__/layplux.test.ts
git commit -m "feat(layplux): add Layplux composition root class"
```

---

### Task 7: useLayplux composable + 导出

**Files:**
- Create: `src/layplux/composables/use-layplux.ts`
- Modify: `src/layplux/layplux.ts` (add index export)
- Create: `src/layplux/index.ts`

- [ ] **Step 1: 写 composable**

`src/layplux/composables/use-layplux.ts`:

```typescript
import { inject, provide, type InjectionKey } from 'vue'
import { Layplux } from '../layplux'

const LAYPLUX_KEY: InjectionKey<Layplux> = Symbol('layplux')

export function provideLayplux(layplux: Layplux): void {
  provide(LAYPLUX_KEY, layplux)
}

export function useLayplux(): Layplux {
  const layplux = inject(LAYPLUX_KEY)
  if (!layplux) {
    throw new Error(
      '[useLayplux] Layplux instance not found. Did you call provideLayplux() in a parent component?',
    )
  }
  return layplux
}
```

- [ ] **Step 2: 写 index.ts 统一导出**

`src/layplux/index.ts`:

```typescript
export { Layplux } from './layplux'
export { ToolWindowManager } from './managers/tool-window-manager'
export { ActionManager } from './managers/action-manager'
export { EditorAreaManager } from './managers/editor-area-manager'
export { StatusBarManager } from './managers/status-bar-manager'
export { FocusManager } from './managers/focus-manager'
export { LayoutPersistence } from './managers/layout-persistence'
export { provideLayplux, useLayplux } from './composables/use-layplux'
export * from './types'
```

- [ ] **Step 3: 更新 src/index.ts 导出**

`src/index.ts` → 修改为:

```typescript
export * from './plugin'
export * from './layplux'
```

- [ ] **Step 4: 验证编译**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/layplux/composables/use-layplux.ts src/layplux/index.ts src/index.ts
git commit -m "feat(layplux): add useLayplux composable and module exports"
```

---

### Task 8: TSX 渲染组件

**Files:**
- Create: `src/layplux/components/glass-pane.tsx`
- Create: `src/layplux/components/stripe.tsx`
- Create: `src/layplux/components/tool-window-decorator.tsx`
- Create: `src/layplux/components/editor-area.tsx`
- Create: `src/layplux/components/status-bar.tsx`
- Create: `src/layplux/components/layplux-host.tsx`

- [ ] **Step 1: 实现 GlassPane**

`src/layplux/components/glass-pane.tsx`:

```tsx
import { defineComponent } from 'vue'

export const GlassPane = defineComponent({
  name: 'GlassPane',
  setup() {
    return () => (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      />
    )
  },
})
```

- [ ] **Step 2: 实现 Stripe**

`src/layplux/components/stripe.tsx`:

```tsx
import { defineComponent, type PropType } from 'vue'
import { useLayplux } from '../composables/use-layplux'
import type { ToolWindowAnchor } from '../types'

export const Stripe = defineComponent({
  name: 'Stripe',
  props: {
    anchor: {
      type: String as PropType<ToolWindowAnchor>,
      required: true,
    },
  },
  setup(props) {
    const layplux = useLayplux()
    const twm = layplux.toolWindowManager

    const isVertical = props.anchor !== 'bottom'

    return () => {
      const windows = twm.getWindowsByAnchor(props.anchor)

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: isVertical ? 'column' : 'row',
            flexShrink: 0,
            [isVertical ? 'width' : 'height']: '40px',
            backgroundColor: '#2b2d30',
            borderRight: props.anchor === 'left' ? '1px solid #1e1f22' : undefined,
            borderLeft: props.anchor === 'right' ? '1px solid #1e1f22' : undefined,
            borderTop: props.anchor === 'bottom' ? '1px solid #1e1f22' : undefined,
          }}
        >
          {windows.map((win) => {
            const isActive = win.visible
            const state = win.state

            return (
              <button
                key={win.config.id}
                title={`${win.config.title}${win.errorMessage ? ` - ${win.errorMessage}` : ''}`}
                disabled={state === 'disabled'}
                onClick={() => layplux.toolWindowManager.toggle(win.config.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isVertical ? '40px' : undefined,
                  height: isVertical ? '40px' : undefined,
                  padding: '4px',
                  border: 'none',
                  background: isActive ? '#43454a' : 'transparent',
                  color: state === 'error' ? '#e05252' : isActive ? '#fff' : '#8c8c8c',
                  cursor: state === 'disabled' ? 'not-allowed' : 'pointer',
                  opacity: state === 'disabled' ? 0.4 : 1,
                  flexShrink: 0,
                }}
              >
                {win.config.icon ? (
                  <win.config.icon />
                ) : (
                  <span style={{ fontSize: '12px', writingMode: isVertical ? 'vertical-rl' : undefined }}>
                    {win.config.title.slice(0, 2)}
                  </span>
                )}
                {state === 'disabled' && (
                  <span
                    style={{
                      position: 'absolute',
                      width: '12px',
                      height: '12px',
                      border: '2px solid #8c8c8c',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      )
    }
  },
})
```

- [ ] **Step 3: 实现 ToolWindowDecorator**

`src/layplux/components/tool-window-decorator.tsx`:

```tsx
import { defineComponent, ref, type PropType } from 'vue'
import { useLayplux } from '../composables/use-layplux'
import type { ToolWindowConfig, ToolWindowAnchor } from '../types'

export const ToolWindowDecorator = defineComponent({
  name: 'ToolWindowDecorator',
  props: {
    windowId: { type: String, required: true },
    anchor: { type: String as PropType<ToolWindowAnchor>, required: true },
  },
  setup(props) {
    const layplux = useLayplux()
    const contentRef = ref<HTMLElement>()

    return () => {
      const entry = layplux.toolWindowManager.getWindow(props.windowId)
      if (!entry || !entry.visible) return null

      const isVertical = props.anchor !== 'bottom'
      const titleBarHeight = '28px'

      return (
        <div
          ref={contentRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            [isVertical ? 'width' : 'height']: '280px',
            backgroundColor: '#2b2d30',
            borderRight: props.anchor === 'left' ? '1px solid #1e1f22' : undefined,
            borderLeft: props.anchor === 'right' ? '1px solid #1e1f22' : undefined,
            borderTop: props.anchor === 'bottom' ? '1px solid #1e1f22' : undefined,
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {/* Title bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: titleBarHeight,
              padding: '0 8px',
              backgroundColor: '#3c3f41',
              borderBottom: '1px solid #1e1f22',
              cursor: 'default',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            {entry.config.icon && <entry.config.icon />}
            <span style={{ flex: 1, fontSize: '12px', marginLeft: entry.config.icon ? '6px' : 0 }}>
              {entry.config.title}
            </span>
            <button
              onClick={() => layplux.toolWindowManager.hide(props.windowId)}
              style={{
                background: 'none',
                border: 'none',
                color: '#8c8c8c',
                cursor: 'pointer',
                fontSize: '14px',
                lineHeight: 1,
                padding: '2px',
              }}
            >
              ×
            </button>
          </div>

          {/* Tabs bar (if content manager has multiple tabs) */}
          {entry.contentManager && entry.contentManager.getAllContents().length > 1 && (
            <div
              style={{
                display: 'flex',
                backgroundColor: '#3c3f41',
                borderBottom: '1px solid #1e1f22',
                flexShrink: 0,
              }}
            >
              {entry.contentManager.getAllContents().map((content) => {
                const isActive = content.id === entry.contentManager!.activeContentId
                return (
                  <button
                    key={content.id}
                    onClick={() => entry.contentManager!.setSelectedContent(content.id)}
                    style={{
                      padding: '2px 10px',
                      fontSize: '11px',
                      background: isActive ? '#2b2d30' : 'transparent',
                      border: 'none',
                      borderBottom: isActive ? '2px solid #4b6eaf' : '2px solid transparent',
                      color: isActive ? '#fff' : '#8c8c8c',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {content.displayName}
                    {content.isCloseable !== false && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          entry.contentManager!.removeContent(content.id)
                        }}
                        style={{ marginLeft: '6px', opacity: 0.6 }}
                      >
                        ×
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {entry.state === 'ready' && entry.component ? (
              <entry.component />
            ) : entry.state === 'error' ? (
              <div style={{ padding: '16px', color: '#e05252', fontSize: '13px' }}>
                <p>{entry.errorMessage ?? 'Error loading tool window'}</p>
                <button
                  onClick={() => layplux.toolWindowManager.toggle(props.windowId)}
                  style={{
                    marginTop: '8px',
                    padding: '4px 12px',
                    background: '#3c3f41',
                    border: '1px solid #555',
                    color: '#fff',
                    cursor: 'pointer',
                    borderRadius: '3px',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div style={{ padding: '16px', color: '#8c8c8c', fontSize: '13px' }}>
                Loading...
              </div>
            )}
          </div>
        </div>
      )
    }
  },
})
```

- [ ] **Step 4: 实现 EditorArea**

`src/layplux/components/editor-area.tsx`:

```tsx
import { defineComponent, ref } from 'vue'
import { useLayplux } from '../composables/use-layplux'

export const EditorArea = defineComponent({
  name: 'EditorArea',
  setup() {
    const layplux = useLayplux()
    const version = ref(0)

    layplux.editorAreaManager.onChange(() => {
      version.value++
    })

    return () => {
      const content = layplux.editorAreaManager.getContent()
      return (
        <div
          style={{
            flex: 1,
            backgroundColor: '#1e1f22',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {content ? (
            <content.component />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#555',
                fontSize: '14px',
              }}
            >
              No editor
            </div>
          )}
        </div>
      )
    }
  },
})
```

- [ ] **Step 5: 实现 StatusBar**

`src/layplux/components/status-bar.tsx`:

```tsx
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { useLayplux } from '../composables/use-layplux'

export const StatusBar = defineComponent({
  name: 'StatusBar',
  setup() {
    const layplux = useLayplux()
    const version = ref(0)
    let interval: ReturnType<typeof setInterval> | null = null

    onMounted(() => {
      interval = setInterval(() => {
        version.value++
      }, 5000)
    })

    onUnmounted(() => {
      if (interval) clearInterval(interval)
    })

    return () => {
      const left = layplux.statusBarManager.getWidgetsByPosition('left')
      const center = layplux.statusBarManager.getWidgetsByPosition('center')
      const right = layplux.statusBarManager.getWidgetsByPosition('right')

      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '24px',
            minHeight: '24px',
            backgroundColor: '#3c3f41',
            borderTop: '1px solid #1e1f22',
            fontSize: '11px',
            color: '#bbb',
            padding: '0 12px',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {left.map((w) => (
              <w.factory key={w.id} />
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            {center.map((w) => (
              <w.factory key={w.id} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {right.map((w) => (
              <w.factory key={w.id} />
            ))}
          </div>
        </div>
      )
    }
  },
})
```

- [ ] **Step 6: 实现 LaypluxHost**

`src/layplux/components/layplux-host.tsx`:

```tsx
import { defineComponent, onMounted, onUnmounted } from 'vue'
import { provideLayplux } from '../composables/use-layplux'
import { Layplux } from '../layplux'
import { GlassPane } from './glass-pane'
import { Stripe } from './stripe'
import { ToolWindowDecorator } from './tool-window-decorator'
import { EditorArea } from './editor-area'
import { StatusBar } from './status-bar'

export const LaypluxHost = defineComponent({
  name: 'LaypluxHost',
  props: {
    layplux: {
      type: Layplux,
      required: true,
    },
  },
  setup(props) {
    provideLayplux(props.layplux)

    onMounted(() => {
      // Restore layout if saved
      const saved = props.layplux.layoutPersistence.load()
      if (saved) {
        props.layplux.layoutPersistence.restore(saved)
      }
      // Attach keyboard listener
      props.layplux.actionManager.attach()
    })

    onUnmounted(() => {
      props.layplux.actionManager.detach()
    })

    return () => {
      const twm = props.layplux.toolWindowManager

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100vh',
            backgroundColor: '#1e1f22',
            color: '#fff',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Top area: left stripe + editor + right stripe */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Left Stripe */}
            <Stripe anchor="left" />

            {/* Left Tool Windows (docked, visible) */}
            {twm.getWindowsByAnchor('left')
              .filter((w) => w.visible)
              .map((w) => (
                <ToolWindowDecorator key={w.config.id} windowId={w.config.id} anchor="left" />
              ))}

            {/* Editor Area */}
            <EditorArea />

            {/* Right Tool Windows (docked, visible) */}
            {twm.getWindowsByAnchor('right')
              .filter((w) => w.visible)
              .map((w) => (
                <ToolWindowDecorator key={w.config.id} windowId={w.config.id} anchor="right" />
              ))}

            {/* Right Stripe */}
            <Stripe anchor="right" />
          </div>

          {/* Bottom area */}
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {/* Bottom Stripe */}
            <Stripe anchor="bottom" />

            {/* Bottom Tool Windows (docked, visible) */}
            {twm.getWindowsByAnchor('bottom')
              .filter((w) => w.visible)
              .map((w) => (
                <ToolWindowDecorator key={w.config.id} windowId={w.config.id} anchor="bottom" />
              ))}
          </div>

          {/* Status Bar */}
          <StatusBar />

          {/* Glass Pane (transparent overlay for drag indicators, etc.) */}
          <GlassPane />
        </div>
      )
    }
  },
})
```

- [ ] **Step 7: 验证 TypeScript 编译**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add src/layplux/components/
git commit -m "feat(layplux): add TSX rendering components"
```

---

### Task 9: 集成到 assembler

**Files:**
- Create: `src/layplux/assembler.ts`

- [ ] **Step 1: 写 Layplux assembler**

`src/layplux/assembler.ts`:

```typescript
import type { ContextApiAssembler } from '../plugin'
import { Layplux } from './layplux'

export interface LaypluxServices {
  layplux: Layplux
}

export function createLaypluxAssembler(
  layplux: Layplux,
): ContextApiAssembler<LaypluxServices> {
  return {
    assembleServices(_pluginName: string, _meta: unknown) {
      return { layplux }
    },
  }
}
```

- [ ] **Step 2: Update index.ts**

`src/layplux/index.ts` — 增加导出:

```typescript
export { createLaypluxAssembler } from './assembler'
export type { LaypluxServices } from './assembler'
```

- [ ] **Step 3: Commit**

```bash
git add src/layplux/assembler.ts
git add src/layplux/index.ts
git commit -m "feat(layplux): add assembler integration helper"
```

---

### Task 10: 端到端验证

- [ ] **Step 1: 运行全部测试**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 2: 启动 dev server 验证编译和渲染**

Run: `npx vite --host 0.0.0.0 --port 9098`
Expected: server starts, no build errors

- [ ] **Step 3: Commit (if any fixes)**

```bash
git add -A
git commit -m "chore(layplux): run full test suite and verify build"
```
