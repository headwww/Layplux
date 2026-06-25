# ISkeleton API

ISkeleton 是 Layplux 的核心接口，管理所有区域和 Widget。

## 创建

```ts
import { useSkeleton } from 'layplux'

// 基础用法
const skeleton = useSkeleton()

// 传入初始状态（从本地存储恢复）
const saved = JSON.parse(localStorage.getItem('layplux-state') || '{}')
const skeleton = useSkeleton({ initialState: saved })
```

### SkeletonOptions

| 属性 | 类型 | 说明 |
|------|------|------|
| `initialState` | `Partial<SkeletonState>` | 初始面板状态，用于恢复会话 |

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `widgets` | `IWidget[]` | 所有已注册的 Widget |
| `focusedId` | `Ref<string \| null>` | 当前聚焦的 Widget 名称 |
| `focusTracker` | `FocusTracker` | 焦点追踪器 |
| `event` | `PluginEventBus` | 全局事件总线 |
| `locale` | `Ref<LaypluxLocale>` | 当前语言包 |
| `theme` | `Ref<'light' \| 'dark' \| 'system'>` | 亮暗模式 |
| `themeName` | `Ref<string>` | 当前主题名 |
| `leftWidth` | `Ref<number>` | 左侧面板宽度 (px)，默认 340 |
| `rightWidth` | `Ref<number>` | 右侧面板宽度 (px)，默认 340 |
| `bottomHeight` | `Ref<number>` | 底部面板高度 (px)，默认 300 |
| `leftSplitRatio` | `Ref<number>` | 左侧上下分割比例 (0~1)，默认 0.5 |
| `rightSplitRatio` | `Ref<number>` | 右侧上下分割比例 (0~1)，默认 0.5 |
| `bottomSplitRatio` | `Ref<number>` | 底部左右分割比例 (0~1)，默认 0.5 |

## 方法

### add(config)

向指定区域添加 Widget。

```ts
skeleton.add({
  name: 'explorer',
  type: 'panel',
  area: 'leftTopArea',
  content: h(MyComponent),
})
```

### setLocale(name)

切换语言。

```ts
skeleton.setLocale('en-US')
```

### setTheme(theme)

切换亮暗模式。

```ts
skeleton.setTheme('dark') // 'light' | 'dark' | 'system'
```

### setThemeName(name)

切换主题色。

```ts
skeleton.setThemeName('blue')
```

### registerTheme(name, vars)

注册自定义主题色（JS 方式）。

```ts
skeleton.registerTheme('blue', {
  '--layplux-primary': '200 80% 50%',
  '--layplux-accent': '200 5% 20%',
})
```

### getState()

获取当前完整面板状态的快照。

```ts
const state = skeleton.getState()
// {
//   leftWidth: 340,
//   rightWidth: 340,
//   bottomHeight: 300,
//   leftSplitRatio: 0.5,
//   rightSplitRatio: 0.5,
//   bottomSplitRatio: 0.5,
//   viewModes: { explorer: 'DockPinned', terminal: 'DockUnpinned' },
//   activeIds: { leftTopArea: 'explorer', bottomLeftArea: 'terminal' },
// }
```

## 状态持久化

Layplux 不自行序列化状态，而是通过事件通知使用者，由使用者决定存储方案。

```ts
import { useSkeleton } from 'layplux'

// 1. 恢复上次状态
const saved = JSON.parse(localStorage.getItem('layplux-state') || '{}')
const skeleton = useSkeleton({ initialState: saved })

// 2. 监听状态变更，自行序列化
skeleton.event.onGlobal('skeleton:state-changed', (state) => {
  localStorage.setItem('layplux-state', JSON.stringify(state))
})
```

### SkeletonState 类型

```ts
interface SkeletonState {
  leftWidth: number
  rightWidth: number
  bottomHeight: number
  leftSplitRatio: number
  rightSplitRatio: number
  bottomSplitRatio: number
  viewModes: Record<string, ViewMode>
  activeIds: Record<string, string | null>
}
```

### 防抖行为

- 面板尺寸/分割比例变化：`skeleton:state-changed` 防抖 300ms 后触发
- 视图模式、激活状态变化：即时触发

### 合并逻辑

`initialState` 中的字段按以下规则合并：

1. 存在的字段覆盖默认值
2. 不存在的字段使用内置默认值
3. `viewModes` / `activeIds` 中不存在的 widget key 自动忽略

## 区域

```ts
skeleton.leftTopArea       // IArea<PanelWidgetConfig, IWidget>
skeleton.rightTopArea      // IArea<PanelWidgetConfig, IWidget>
skeleton.centerArea        // IArea<CenterWidgetConfig, IWidget>
skeleton.topArea           // IArea<InteractionWidgetConfig, IWidget>
skeleton.bottomArea        // IArea<InteractionWidgetConfig, IWidget>
```

### centerArea

中心区域用于放置编辑器、Canvas、预览等内容，与左右面板机制完全一致，区别在于：

- 使用 `CenterView` 渲染，无标题栏、tabs 等 chrome
- 单选模式，同一时间只显示一个 Widget
- Teleport 保活，切换不销毁

```ts
skeleton.add({
  name: 'editor',
  type: 'panel',
  area: 'centerArea',
  content: h(MyEditor),
})

skeleton.centerArea.container.activate('editor')
```
