# 生产就绪三件套：入口清理、错误边界、布局持久化

> 解决阻碍 Layplux 投入生产环境的三个核心问题。

## 目标

- 入口文件干净、类型安全、开源友好
- Widget 渲染错误不影响其他面板，不白屏
- 关闭浏览器后重新打开，布局状态完整恢复

---

## 一、入口文件清理

### 现状

`packages/layplux/src/layplux.ts` 存在：
- `import { type Skeleton }` —— `Skeleton` 不存在（应为 `ISkeleton`）
- `import { SkeletonConfig } from './types/widget-config'` —— 模块不存在
- `new Layplux()` class wrapper 和下面 `export default Layplux`（Vue 组件）同名冲突
- 底部残留测试代码 `layplux.addWidget({ type: 'docked-pinned' })`

### 方案

**直接删除 `layplux.ts`**，重写 `index.ts` 作为唯一入口：

```ts
// packages/layplux/src/index.ts

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

### 用户代码

```ts
import { Layplux, useSkeleton } from 'layplux'

const skeleton = useSkeleton()
skeleton.add({ name: 'explorer', type: 'panel', area: 'leftTopArea', content: h(MyPanel) })

// JSX
<Layplux :skeleton="skeleton" />
```

### 影响范围

- `src/layplux.ts` 删除
- `src/index.ts` 重写
- `package.json` exports 不需要改（已指向 `./src/index.ts`）

---

## 二、错误边界

### 现状

Widget 的 `renderBody()` 在 `WidgetView` 中直接调用。任何 widget 抛错会导致整个骨架白屏——Vue 的 errorHandler 向上冒泡到根，整个组件树卸载。

### 方案

在 `WidgetView` 组件中加 `onErrorCaptured`，每个 widget 独立错误边界。

**改动位置：** `packages/layplux/src/components/widget/index.tsx`

```tsx
import { defineComponent, Fragment, ref, onErrorCaptured, h, type PropType } from 'vue'
import type { IWidget } from '../../managers'
// ... 现有 imports

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
```

> `WidgetBaseConfig.props` 已有 `[key: string]: any` 索引签名，`errorFallback` 不需要额外类型声明。

### 扩展点

```ts
skeleton.add({
  name: 'critical-editor',
  area: 'centerArea',
  content: h(MyEditor),
  props: {
    errorFallback: MyCustomErrorUI, // 可选，接收 { error: string, widget: IWidget } props
  },
})
```

### 行为

| 场景 | 结果 |
|---|---|
| widget A renderBody 抛错 | A 区域显示错误提示，B/C/D 面板正常 |
| `errorFallback` 已设置 | 显示自定义错误 UI |
| 默认 | 显示 widget 名 + 错误消息，打在 console.error |
| 不提供 retry | widget 崩溃通常是代码 bug，retry 无意义 |

---

## 三、布局持久化

### 持久化数据结构

```ts
// packages/layplux/src/managers/persistence.ts（新增）

interface LayoutSnapshot {
  version: 1
  panels: {
    sizes: PanelSizes
    activeIds: Record<string, string | null>
    viewModes: Record<string, ViewMode>
  }
  preferences: LayoutPreferences
  extra: Record<string, Record<string, unknown>>
}

interface PanelSizes {
  leftWidth: number
  rightWidth: number
  bottomHeight: number
  leftSplitRatio: number
  rightSplitRatio: number
  bottomSplitRatio: number
}

interface LayoutPreferences {
  theme: 'light' | 'dark' | 'system'
  themeName: string
  locale: string
}

interface LayoutStorage {
  save(key: string, data: LayoutSnapshot): void
  load(key: string): LayoutSnapshot | null
}
```

### 存储适配器

内置 `createLocalStorage()`，用户可注入自定义适配器：

```ts
function createLocalStorage(): LayoutStorage {
  return {
    save(key, data) {
      localStorage.setItem(key, JSON.stringify(data))
    },
    load(key) {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    },
  }
}
```

### skeleton API 变化

**尺寸状态上提到 ISkeleton：**

当前 `leftWidth` 等是 `CenterArea` 组件局部 ref，持久化需要对外暴露。移到 `ISkeleton` 上：

```ts
interface ISkeleton {
  // ... 现有属性 ...

  // 新增：面板尺寸（CenterArea 从 skeleton 读写，不再持有局部 ref）
  panelSizes: {
    leftWidth: Ref<number>
    rightWidth: Ref<number>
    bottomHeight: Ref<number>
    leftSplitRatio: Ref<number>
    rightSplitRatio: Ref<number>
    bottomSplitRatio: Ref<number>
  }

  // 新增：持久化
  saveLayout(): void
  loadLayout(): boolean
  resetLayout(): void

  // 新增：扩展数据
  /** 写入命名空间数据到快照 extra 字段 */
  setExtra(namespace: string, data: Record<string, unknown>): void
  /** 读取命名空间数据 */
  getExtra(namespace: string): Record<string, unknown> | undefined
}
```

**useSkeleton 签名变化：**

```ts
function useSkeleton(options?: {
  persistence?: {
    key: string
    storage: LayoutStorage
  }
}): ISkeleton
```

### 自动行为

- 启动时 `loadLayout()` → 应用状态 → 渲染。如果 load 返回 null（首次使用），用默认值。
- 状态变化 watch → debounce 300ms → `saveLayout()`
- watch 的状态包括：panelSizes 全部字段、各 container 的 activeId、各 widget 的 viewMode、theme/themeName/locale

### CenterArea 适配

`CenterArea` 不再 `ref(340)` 自己持有尺寸，改为从 `skeleton.panelSizes` 读取：

```tsx
// center-area.tsx 变化
const leftWidth = computed({
  get: () => props.skeleton!.panelSizes.leftWidth.value,
  set: (v) => { props.skeleton!.panelSizes.leftWidth.value = v },
})
```

拖拽回调里 `leftWidth.value = xxx` 自动写入 skeleton，触发持久化 watch。

###扩展

业务/插件可注入自定义状态：

```ts
// 自定义存储适配器（如服务端存储）
const skeleton = useSkeleton({
  persistence: {
    key: 'my-app',
    storage: createServerStorage('/api/layout'),
  },
})

// 写入业务数据到快照
skeleton.setExtra('file-manager', { lastDir: '/src', expanded: ['components', 'utils'] })
```

### 非目标

- 不持久化 widget 注册（items）——这是应用代码决定的，每次启动重新注册
- 不持久化 focusedId——焦点是瞬态状态
- 不支持跨设备同步——扩展点提供，非内置

---

## 改动文件汇总

| 文件 | 操作 | 内容 |
|---|---|---|
| `src/layplux.ts` | 删除 | 删除整个文件 |
| `src/index.ts` | 重写 | 统一导出组件、composable、类型 |
| `src/managers/persistence.ts` | 新增 | LayoutStorage / LayoutSnapshot / createLocalStorage |
| `src/managers/skeleton.ts` | 修改 | ISkeleton 加 panelSizes + 持久化方法；useSkeleton 加 options 参数；内部实现持久化 watch/save/load 逻辑 |
| `src/components/widget/index.tsx` | 修改 | WidgetView 加 onErrorCaptured 错误边界 |
| `src/layout/skeleton/center-area.tsx` | 修改 | 尺寸 ref 改为从 skeleton.panelSizes 读写 |
