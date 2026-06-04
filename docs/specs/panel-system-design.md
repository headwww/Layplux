# Layplux Panel 系统设计

## 一、核心概念

```
Panel（壳）                        Widget + Content（内核）
┌─────────────────────┐          ┌─────────────────────────┐
│ 标题栏 (title/close) │          │ IWidget 实例             │
│ 尺寸/位置            │ ←──绑定──│  ├─ config (icon, title) │
│ visible (v-show)    │          │  ├─ renderTitle()         │
│ autoHideOnBlur      │          │  ├─ renderBody()          │
│ widgets[]           │          │  └─ renderContent()       │
│ activeWidgetId      │          └─────────────────────────┘
│ createdWidgets      │
└─────────────────────┘
```

- Panel 是壳子，常驻不销毁，9 个实例
- Widget 是注册逻辑 + Content 持有者，由 Container → Area → Skeleton 管理
- Content 通过 PanelView 的 v-show 切换可见性，Vue 组件实例不销毁

## 二、已知类型（复用现有）

```typescript
// types/config.ts — 已有
PanelWidgetConfig extends WidgetBaseConfig {
  type: 'panel'
  content?: string | Component | VNode
  props?: PanelWidgetProps  // { icon, title }
}

// managers/widget.ts — 已有
interface IWidget {
  readonly id: string
  readonly name: string
  readonly config: SkeletonConfig
  renderTitle(): VNode | null      // 已有
  renderBody(): VNode | null       // 已有
  renderContent(): VNode | null    // 已有 — WidgetView 壳
}

// managers/widget-container.ts — 已有
interface IWidgetContainer<T, G> {
  add(item: T | G): T
  get(name: string): T | null
  items: Ref<T[]>
}
// 需新增：
// remove(name: string): T | null
```

## 三、新增类型

```typescript
// managers/panel-manager.ts

type PanelType = 'docked' | 'undocked'
type PanelAnchor = 'left' | 'right' | 'bottom'
type ActivateMode = 'lazy' | 'eager'

interface PanelState {
  readonly id: string
  readonly type: PanelType
  readonly anchor: PanelAnchor
  readonly teleportTarget: string         // computed: `layplux-panel-${id}`

  widgets: IWidget[]                      // 挂载到这个 Panel 的所有 Widget（tab 列表）
  activeWidgetId: string | null           // 当前显示的是哪个
  createdWidgets: Set<string>             // factory 已调过的 widget id，不重复创建

  visible: boolean                        // v-show
  autoHideOnBlur: boolean                 // docked-pinned=false  docked-unpinned/undocked=true
  activateMode: ActivateMode              // lazy: 首次 activate 才调 factory  eager: 注册时就调
}

interface PanelManager {
  // ── 绑定 ──
  registerWidget(widget: IWidget, homePanelId: string): void

  // ── 激活 / 隐藏 ──
  activate(widgetId: string): void
  hide(panelId: string): void
  toggle(widgetId: string): void

  // ── 模式切换 ──
  setMode(widgetId: string, mode: PanelType): void

  // ── 拖拽搬迁 ──
  moveWidget(widgetId: string, toPanelId: string): void

  // ── 查询 ──
  getPanel(id: string): PanelState | undefined
  findPanelByWidget(widgetId: string): PanelState | undefined
  readonly panels: PanelState[]          // 9 个，响应式数组，只读
}
```

## 四、9 个 Panel 实例

```
ID                     type       anchor       home-area
─────────────────────────────────────────────────────────
left-docked-top        docked     left         leftTopArea
left-docked-bottom     docked     left         leftBottomArea
left-bottom-quick      docked     left         bottomLeftArea
left-undocked          undocked   left         (无，POPUP 层)
right-docked-top       docked     right        rightTopArea
right-docked-bottom    docked     right        rightBottomArea
right-bottom-quick     docked     right        bottomRightArea
right-undocked         undocked   right        (无，POPUP 层)
bottom-undocked        undocked   bottom       (无，POPUP 层)
```

Area → Panel 映射（硬编码）：

```typescript
const AREA_TO_PANEL: Record<SkeletonConfigArea, string | null> = {
  leftTopArea:     'left-docked-top',
  leftBottomArea:  'left-docked-bottom',
  bottomLeftArea:  'left-bottom-quick',
  rightTopArea:    'right-docked-top',
  rightBottomArea: 'right-docked-bottom',
  bottomRightArea: 'right-bottom-quick',
  topArea:         null,   // 无面板
  bottomArea:      null,   // 无面板
}
```

## 五、Widget → Panel 绑定流程

```
skeleton.add({ name: 'project', type: 'panel', area: 'leftTopArea', ... })
  │
  ├─ 1. areaRouter 路由
  │     → leftTopArea.add(config)
  │     → container.add(config)
  │     → widget = useWidget(config)    // Widget 实例诞生
  │
  └─ 2. PanelManager 绑定
        → panelId = AREA_TO_PANEL['leftTopArea']  // 'left-docked-top'
        → panelManager.registerWidget(widget, panelId)
          → panel.widgets.push(widget)
          → 如果 activateMode === 'eager':
              panel.activeWidgetId = widget.id
              panel.createdWidgets.add(widget.id)
          → 如果 activateMode === 'lazy':
              什么都不做，等 activate()
  │
  └─ 3. Stripe 按钮已就绪
        → widget.renderTitle() 返回 WidgetTitleView
        → TitleView mode="stacked" icon="📁" title="Project"
        → 按钮出现在 leftTopArea 组件中
```

## 六、Content 生命周期

### activateMode: 'lazy'（默认）

```
skeleton.add(...)
  → widget 已创建，Panel.widgets 已包含 widget
  → Panel.createdWidgets 没有 widget.id
  → widget.renderBody() 返回 null（还没有 content）
  → PanelView: v-show 对应的 div 为空

用户点击 Stripe 按钮:
  → panelManager.activate('project')
    → panel.createdWidgets.add('project')
    → panel.activeWidgetId = 'project'
    → panel.visible = true
    → widget.renderBody() 被调用，创建 Vue 组件实例（只这一次）
    → PanelView: v-show="true" 显示内容

用户点击 close:
  → panelManager.hide('left-docked-top')
    → panel.visible = false
    → PanelView: v-show="false"
    → widget.renderBody() 的组件实例仍在，不销毁

用户再次点击按钮:
  → panelManager.activate('project')
    → panel.visible = true
    → PanelView: v-show="true"
    → 已创建的内容立刻可见，无需重建
```

### activateMode: 'eager'

```
skeleton.add(...)
  → registerWidget 时立即 panel.createdWidgets.add(widget.id)
  → widget.renderBody() 在 add 时就会被调用
  → 内容已就绪，只是 panel.visible 初始为 false
  → 首次 activate 时 v-show="true"，瞬间可见
```

### widget.renderBody() 实现细节

```typescript
// widget.ts — 改造 renderBody
function renderBody() {
  const widgetId = widget.id
  const panel = panelManager.findPanelByWidget(widgetId)
  if (!panel || !panel.createdWidgets.has(widgetId)) return null

  // content 组件内部可以拿到 widget、panel、config 等上下文
  const { content, contentProps } = config
  return createContent(content, {
    ...contentProps,
    config,
    widget,
  })
}
```

## 七、PanelView 组件（所有 Panel 共用）

```tsx
// components/panel/index.tsx  (新建)

const PanelView = defineComponent({
  props: {
    panel: Object as PropType<PanelState>,
  },
  setup(props) {
    return () => {
      const p = props.panel!
      const hasContent = p.widgets.some(w => p.createdWidgets.has(w.id))

      return (
        <div
          id={p.teleportTarget}
          class={['layplux-panel', p.visible && 'layplux-panel--visible']}
          v-show={p.visible}
        >
          {p.visible && (
            <>
              {/* 标题栏 / Tabs */}
              <div class="layplux-panel__header">
                <div class="layplux-panel__tabs">
                  {p.widgets.map(w => (
                    <button
                      key={w.id}
                      class={[
                        'layplux-panel__tab',
                        p.activeWidgetId === w.id && 'layplux-panel__tab--active',
                      ]}
                      onClick={() => panelManager.activate(w.id)}
                    >
                      {w.renderTitle()}
                    </button>
                  ))}
                </div>
                <button class="layplux-panel__close" onClick={() => panelManager.hide(p.id)}>
                  ×
                </button>
              </div>

              {/* 内容区 — v-show 切换，永不销毁 */}
              <div class="layplux-panel__body">
                {p.widgets
                  .filter(w => p.createdWidgets.has(w.id))
                  .map(w => (
                    <div
                      key={w.id}
                      v-show={p.activeWidgetId === w.id}
                      class="layplux-panel__content"
                    >
                      {w.renderBody()}
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* 空面板占位（未激活时） */}
          {!hasContent && (
            <div class="layplux-panel__empty" />
          )}
        </div>
      )
    }
  },
})
```

关键：所有 created 的 Widget 同时渲染在 DOM 中，用 `v-show` 切换可见性。切 Widget / 隐藏面板 / 切换 docked ↔ undocked，Content 的 Vue 组件实例永不销毁。

## 八、Docked / Undocked 在组件树中的位置

### Docked — Skeleton 布局流内

```tsx
// skeleton.tsx 中
<div class="layplux-skeleton__stripe">
  <div class="layplux-skeleton__stripe-top">
    <LeftTopArea area={skeleton.leftTopArea} />
    <div class="layplux-skeleton__stripe-separator" />
    <LeftBottomArea area={skeleton.leftBottomArea} />
  </div>
  <BottomLeftArea area={skeleton.bottomLeftArea} />
  
  {/* docked panel — 推挤 center */}
  <PanelView panel={skeleton.panelManager.getPanel('left-docked-top')!} />
  <PanelView panel={skeleton.panelManager.getPanel('left-docked-bottom')!} />
  <PanelView panel={skeleton.panelManager.getPanel('left-bottom-quick')!} />
</div>
```

### Undocked — LayeredManager POPUP 层

```tsx
// layered-manager.tsx 中
<div class="layered-manager">
  {/* DEFAULT_LAYER */}
  <div class="layered-manager__default">
    <Skeleton />
  </div>
  
  {/* POPUP_LAYER — undocked panel，absolute 定位 */}
  <div class="layered-manager__popup">
    <PanelView panel={pm.getPanel('left-undocked')!} />
    <PanelView panel={pm.getPanel('right-undocked')!} />
    <PanelView panel={pm.getPanel('bottom-undocked')!} />
  </div>
</div>
```

### Docked ↔ Undocked 模式切换的数据流

```
当前：Widget 'project' 在 left-docked-top 面板中，visible=true

用户切换到 undocked：
  → panelManager.setMode('project', 'undocked')
    → fromPanel = getPanel('left-docked-top')
    → toPanel   = getPanel('left-undocked')
    
    → fromPanel.widgets 移除 'project' 的 Widget
    → toPanel.widgets 加入 'project' 的 Widget
    
    → fromPanel.activeWidgetId = 下一个或 null
    → toPanel.activeWidgetId = 'project'
    
    → fromPanel.visible = (还有 activeWidget 才可见)
    → toPanel.visible = true
    
    → Widget 实例不变，只是从 docked Panel 移到了 undocked Panel
    → PanelView(undocked) 中的 dom v-show="true"
    → content 出现在 POPUP 层，overlay 在其他内容上方

用户切回 docked：
  → panelManager.setMode('project', 'docked')
    → 反向操作，回到 left-docked-top
```

## 九、拖拽搬迁流程

```
Widget 'project' 从左侧 leftTopArea 拖到右侧 rightTopArea
  │
  ├─ 1. Container 层面搬迁
  │     leftTopArea.container.remove('project')   // 新方法
  │     rightTopArea.container.add(widget)        // widget 还是同一个引用
  │
  ├─ 2. Panel 层面搬迁
  │     panelManager.moveWidget('project', 'right-docked-top')
  │       → fromPanel.widgets 移除
  │       → toPanel.widgets 加入
  │       → activeWidgetId 调整
  │
  └─ 3. Vue 响应式更新
        → 左侧 PanelView: Widget dom v-show="false"
        → 右侧 PanelView: Widget dom v-show="true"
        → IWidget 实例未变，content 组件实例未销毁
```

Container 新增 `remove` 方法：

```typescript
// widget-container.ts
function remove(name: string): T | null {
  const item = maps[name]
  if (!item) return null
  const i = items.value.indexOf(item)
  if (i > -1) items.value.splice(i, 1)
  delete maps[name]
  return item  // 返回实例引用，给目标 Container 用
}
```

## 十、与现有 Skeleton 集成

```typescript
// managers/skeleton.ts — 改造

export interface ISkeleton {
  // ... 现有 areas
  panelManager: PanelManager                     // 新增
  add(widget: SkeletonConfig): void              // 加强（自动绑定 panel）
  // ...
}

export function useSkeleton(): ISkeleton {
  const panelManager = createPanelManager()       // 创建 PanelManager
  
  // ... 现有 areas ...
  
  function add(config: SkeletonConfig) {
    // ... 现有路由 ...
    const area = config.area
    const widget = /* 对应 area 去 add */
    
    // 新增：自动绑定到 Panel
    const panelId = AREA_TO_PANEL[area]
    if (panelId) {
      panelManager.registerWidget(widget, panelId)
    }
  }
  
  return {
    // ... 现有
    panelManager,    // 暴露给组件
    add,
  }
}
```

## 十一、WidgetBaseConfig 扩展

```typescript
// types/config.ts — 在 WidgetBaseConfig 增加
interface WidgetBaseConfig {
  // ... 现有字段
  activateMode?: 'lazy' | 'eager'    // 默认 lazy
  autoHideOnBlur?: boolean           // 默认 false（docked-pinned）
}
```

## 十二、文件清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `managers/panel-manager.ts` | 新建 | PanelManager 纯逻辑 |
| `managers/widget-container.ts` | 修改 | 加 `remove` 方法 |
| `managers/widget.ts` | 修改 | `renderBody` 加 panel createdWidgets 判断 |
| `managers/skeleton.ts` | 修改 | 创建 PanelManager，add 时绑定 panel |
| `components/panel/index.tsx` | 新建 | PanelView 组件 |
| `styles/components/_panel.scss` | 新建 | Panel 样式 |
| `types/config.ts` | 修改 | WidgetBaseConfig 加 activateMode |
