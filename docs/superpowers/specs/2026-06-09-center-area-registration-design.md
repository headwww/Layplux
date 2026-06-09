# 中心区域注册式设计

> 将 centerArea 作为标准 IArea 纳入骨架系统，复用 useArea + useWidgetContainer + Teleport 保活机制，替代当前的空占位 div。

## 目标

- 中心区域支持注册多个内容（编辑器、canvas、预览等），通过 activeId 切换
- 切换时走 Teleport 保活，不销毁不重建，与现有面板系统的保活思路一致
- 不引入新概念，centerArea 只是普通的 IArea，底层机制和左右底部面板完全相同

## 架构

```
skeleton.add({ name: 'editor', area: 'centerArea', content: Editor })
skeleton.add({ name: 'preview', area: 'centerArea', content: Preview })
              │
              ▼
       centerArea.add(config)
              │
       useArea → useWidgetContainer → useWidget
              │
       container.activate('editor')   // activeId = 'editor'
       container.activate('preview')  // activeId = 'preview'，editor → offscreen
              │
              ▼
       CenterArea 组件内 Teleport
         active widget  → #center-area      (可见)
         inactive       → #center-offscreen  (保活隐藏)
```

和现有面板系统的差异仅在于渲染组件——面板用 `PanelView`（带 chrome），中心区域用 `CenterView`（无 chrome，只渲染 body）。

## 改动文件

### 1. types/config.ts

`SkeletonConfigArea` 联合类型新增 `'centerArea'`：

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
  | 'centerArea';  // 新增
```

### 2. managers/skeleton.ts

- `ISkeleton` 接口新增 `centerArea: IArea<PanelWidgetConfig, IWidget>`
- `useSkeleton()` 中创建 centerArea：

```ts
const centerArea = useArea<PanelWidgetConfig, IWidget>(
  { createContainer },
  'centerArea',
  (config, container) => createWidget(config, container),
);
```

- `add()` 方法新增 centerArea 路由：

```ts
} else if (area === 'centerArea') {
  centerArea.add(config as PanelWidgetConfig);
}
```

- `Object.assign(self, {...})` 中补上 `centerArea`

### 3. components/center-view/index.tsx（新增）

轻量渲染组件，只做 Teleport 声明，无 chrome：

```ts
props: {
  widget: Object as PropType<IWidget>,
  anchor: { type: String, required: true },
}

// 渲染：Teleport 到 anchor，渲染 widget.renderContent()
// widget 为 null 时渲染 nothing
```

不需要标题栏、tabs、下拉菜单、viewMode 切换——这些是 PanelView 的职责。

### 4. layout/skeleton/center-area.tsx

- 新增 `#center-area` 锚点 div（替换现有的空占位 `<div class="layplux-center-area__editor" />`）
- 新增 `#center-offscreen` 离屏保活容器
- 新增 center widget 的 Teleport 遍历逻辑（与现有 panel Teleport 并列，互不干扰）
- CenterArea 的 props 新增 `centerArea: IArea`（从 Skeleton 组件传入）

center widget 的 Teleport 目标计算（新增，与现有 panel teleportTargets 并列）：

```ts
const centerTargets = computed(() => {
  const activeId = props.centerArea?.container.activeId.value ?? null;
  const map: Record<string, string> = {};
  props.centerArea?.container.items.value.forEach(w => {
    map[w.name] = w.name === activeId ? '#center-area' : '#center-offscreen';
  });
  return map;
});
```

### 5. layout/skeleton/skeleton.tsx

CenterArea 组件传参增加 `centerArea`：

```tsx
<CenterArea skeleton={props.skeleton} centerArea={props.skeleton?.centerArea} />
```

## 行为定义

| 场景 | 行为 |
|---|---|
| 无 center widget 注册 | `activeId` 为 null，中心区域空白 |
| 注册多个 center widget | 全部保留在 container.items 中 |
| 激活 widget A | A Teleport 到 `#center-area`，其余在 `#center-offscreen` |
| 切换到 widget B | A 移到 `#center-offscreen`，B 移到 `#center-area`，A 的 VNode 不销毁 |
| deactivate | activeId 置 null，最后一个 widget 移入 offscreen |
| remove widget | 从 container 移除，对应 Teleport 消失 |
| remove 当前激活的 widget | activeId 不自动清空（和现有 container 行为一致），调用方应先 deactivate |
| 和 panel widget 的关系 | 互不干扰，遍历各自的 container.items |

## 非目标

- CenterView 不处理 viewMode 切换（DockPinned/DockUnpinned/Undock）。center widget 虽然底层有 pane，但 CenterView 不读取。YAGNI。
- 不支持同时显示多个 center widget。如果未来需要分屏，可以在 CenterArea 内部扩展多锚点，但当前不需要。
