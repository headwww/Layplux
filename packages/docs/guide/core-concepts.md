# 核心概念

## Skeleton（骨架）

Skeleton 是 Layplux 的核心对象，管理所有区域和 Widget 的生命周期。

```ts
import { useSkeleton } from 'layplux'
const skeleton = useSkeleton()
```

通过 `skeleton.add(config)` 向指定区域添加 Widget。

## Widget（组件）

Widget 是 Layplux 中最小的功能单元，分两种类型：

- **Panel（面板）**：可停靠、可拖动大小的面板，如文件树、终端
- **Interaction（交互组件）**：工具栏按钮、状态栏项等轻量组件

## Area（区域）

Layplux 预定义了 9 个区域：

| 区域 | 位置 | 类型 |
|------|------|------|
| `topArea` | 顶部工具栏 | Interaction |
| `bottomArea` | 底部状态栏 | Interaction |
| `leftTopArea` | 左侧上部 | Panel |
| `leftBottomArea` | 左侧下部 | Panel |
| `rightTopArea` | 右侧上部 | Panel |
| `rightBottomArea` | 右侧下部 | Panel |
| `bottomLeftArea` | 底部左侧 | Panel |
| `bottomRightArea` | 底部右侧 | Panel |
| `centerArea` | 中心区域 | Panel（无 chrome） |

## Pane（面板状态）

每个 Panel Widget 有一个 `pane` 对象，管理三种视图模式：

- `DockPinned`：停靠固定，始终可见
- `DockUnpinned`：停靠不固定，失焦自动收起
- `Undock`：取消停靠，浮动显示
