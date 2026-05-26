# Layplux 窗口系统设计

## 概述

Layplux = Layout + Plugin + X，是一个面向对象的 IDEA 风格窗口 UI 组件系统。Layplux 作为上下文服务注入到现有插件系统中，插件通过 `ctx.layplux` 注册 tool window、action、status widget 等内容，TSX 渲染层读取状态并渲染布局壳子。

## 整体架构

```
PluginManager (已有)
  │
  └─ assembler.assembleServices(pluginName, meta)
       └─ return { layplux: laypluxInstance, ... }
            │
            └─ 插件 ctx.layplux.registerXxx(...) 贡献内容

Layplux (纯逻辑 class)
  ├─ ToolWindowManager
  ├─ ActionManager
  ├─ EditorAreaManager
  ├─ StatusBarManager
  ├─ FocusManager
  └─ LayoutPersistence

<LaypluxHost> (TSX 渲染壳子)
  └─ Stripe / Editor / StatusBar / GlassPane
```

## Layplux 类

```typescript
class Layplux {
  readonly toolWindowManager: ToolWindowManager
  readonly editorAreaManager: EditorAreaManager
  readonly actionManager: ActionManager
  readonly statusBarManager: StatusBarManager
  readonly focusManager: FocusManager
  readonly layoutPersistence: LayoutPersistence

  constructor(options?: LaypluxOptions)

  // 扩展点注册
  registerToolWindow(config: ToolWindowConfig): ToolWindowHandle
  registerEditorProvider(config: EditorProviderConfig): Disposable
  registerAction(config: ActionConfig): Disposable
  registerStatusWidget(config: StatusWidgetConfig): Disposable

  destroy(): void
}
```

## 模块设计

### 1. ToolWindowManager

管理所有 tool window 的注册、激活、隐藏、anchor、type、split 状态。

**ToolWindowConfig:**

```typescript
interface ToolWindowConfig {
  id: string
  anchor: 'left' | 'right' | 'bottom'
  title: string
  icon?: Component
  type?: 'docked' | 'sliding' | 'undocked'
  isSplit?: boolean
  factory: () => Component | Promise<Component>
}
```

**ToolWindowHandle —— 异步就绪控制:**

```
register → disabled → enable() → enabled → (用户点击) → factory 执行 → ready
               ↓          ↓                       ↓
             error()    error()                  error()
```

```typescript
interface ToolWindowHandle {
  enable(): void       // 按钮变为可交互
  disable(): void      // 按钮灰显 + loading
  error(message: string): void  // 错误标记 + 错误信息
  activate(): void     // 程序化展开 + 聚焦
  hide(): void         // 程序化隐藏
  dispose(): void      // 注销
}
```

**ToolWindow 内部 tab 管理:**

```typescript
interface ContentInfo {
  id: string
  displayName: string
  component: Component
  isCloseable?: boolean
  preferredFocusableElement?: HTMLElement
  actions?: ActionConfig[]
}

interface ToolWindowApi {
  activate(id: string): void
  hide(id: string): void
  toggle(id: string): void
  setType(id: string, type: 'docked' | 'sliding' | 'undocked'): void
  addContent(toolWindowId: string, content: ContentInfo): Disposable
  setSelectedContent(toolWindowId: string, contentId: string): void
  getContentManager(toolWindowId: string): ContentManager
}
```

Stripe 按钮状态映射:

| 状态 | stripe 按钮 | 点击行为 | 内容区 |
|---|---|---|---|
| disabled | 灰显 + spinner | 不响应 | 无 |
| enabled | 正常可点击 | 触发 factory | loading skeleton |
| ready | 激活态高亮 | 切换激活/隐藏 | 显示内容 |
| error | 错误标记 | 点击重试 | 错误信息 + 重试 |

### 2. ActionManager

对标 IDEA 的 `AnAction` 模型。

**ActionConfig:**

```typescript
interface ActionConfig {
  id: string
  text: string
  description?: string
  icon?: Component
  keyboard?: KeyboardShortcut | KeyboardShortcut[]
  group?: string

  // 高频调用，用于设置 enabled/visible/icon/text
  update: (ctx: ActionContext) => { enabled: boolean; visible: boolean; text?: string; icon?: Component }

  // 用户触发时执行
  actionPerformed: (ctx: ActionContext) => void
}

interface KeyboardShortcut {
  modifier: 'ctrl' | 'alt' | 'shift' | 'meta'
  key: string
}

interface ActionContext {
  getData<T>(key: DataKey<T>): T | undefined
  readonly layplux: Layplux
  readonly focusComponent: string
}
```

**ActionManager 核心职责:**
- 注册 action → id→action 映射
- 注册快捷键 → keydown 匹配 → 优先消费（对标 IdeEventQueue）
- 有 `contenteditable` 元素的 keydown 不拦截
- 空闲时批量调用 `update()` → 更新 UI 状态

### 3. EditorAreaManager

Editor 区域是黑盒容器，注册组件自己管理内部的 tab 和分屏。

```typescript
interface EditorProviderConfig {
  id: string
  factory: () => Component
}

interface EditorAreaManager {
  setContent(factory: () => Component): void
  readonly activeProviderId: string | null
}
```

### 4. StatusBarManager

三段式状态栏，widget 按 left / center / right 排列。

```typescript
interface StatusWidgetConfig {
  id: string
  position: 'left' | 'center' | 'right'
  factory: () => Component
  update?: () => void
}

interface StatusBarManager {
  readonly widgets: StatusWidgetConfig[]
}
```

### 5. FocusManager

跨区域焦点跟踪与 Escape 回跳。

```typescript
type FocusRegion = 'editor' | `toolWindow:${string}` | 'statusBar'

interface FocusManager {
  readonly currentFocus: FocusRegion | null
  requestFocus(target: FocusRegion): void

  // Escape 行为:
  //   ToolWindow → 跳回 Editor
  //   Popup → 关闭 Popup
  handleEscape(): void
}
```

### 6. LayoutPersistence

布局状态序列化与恢复。

```typescript
interface ToolWindowState {
  id: string
  anchor: 'left' | 'right' | 'bottom'
  type: 'docked' | 'sliding' | 'undocked'
  visible: boolean
  splitProportion?: number
}

interface LayoutState {
  version: number
  toolWindows: ToolWindowState[]
  stripes: StripeState[]
  statusBar: StatusBarWidgetState[]
}

interface LayoutPersistence {
  serialize(): LayoutState
  restore(state: LayoutState): void
  onLayoutChange(): void
}
```

存储方式：`localStorage`，布局变化时 debounce 自动保存，`<LaypluxHost>` 挂载时恢复。

## 使用示例

```typescript
const layplux = new Layplux()

const appPlugin: PluginModel<{ layplux: Layplux }> = Object.assign(
  (ctx) => ({
    name: 'app',
    setup(ctx) {
      // 注册 tool window（按钮立即出现，但 disabled）
      const tw = ctx.layplux.registerToolWindow({
        id: 'database',
        anchor: 'left',
        title: 'Database',
        icon: DatabaseIcon,
        factory: () => <DatabasePanel />,
      })

      // 异步就绪
      connectToDatabase()
        .then(() => tw.enable())
        .catch((e) => tw.error(`连接失败: ${e.message}`))

      // 注册 action
      ctx.layplux.registerAction({
        id: 'terminal.toggle',
        text: 'Toggle Terminal',
        keyboard: { modifier: 'ctrl', key: '`' },
        update: () => ({ enabled: true, visible: true }),
        actionPerformed: () => {
          ctx.layplux.toolWindowManager.toggle('terminal')
        },
      })

      // 注册 status widget
      ctx.layplux.registerStatusWidget({
        id: 'encoding',
        position: 'right',
        factory: () => <span>UTF-8</span>,
      })

      return () => { /* teardown */ }
    },
  }),
  { meta: { pluginName: 'app' } },
)
```

TSX 渲染：

```tsx
const App = () => {
  const layplux = useLayplux()  // provide/inject

  return (
    <LaypluxHost layplux={layplux}>
      {/* LaypluxHost 内部渲染:
          - IdeGlassPane (透明覆盖层)
          - Stripe left
          - EditorArea (黑盒容器)
          - Stripe right
          - Bottom stripe + content
          - StatusBar
      */}
    </LaypluxHost>
  )
}
```
