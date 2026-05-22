# pIntelliJ IDEA 窗口框架 —— 完整机制分析

> 本文档用于分析 IntelliJ IDEA 的 Tool Window 框架设计，为 BS 系统 Web 端的 IDE 风格布局设计提供参考。
>
> 分析日期：2026-05-20

---

## 一、总体布局模型

```
┌──────────────────────────────────────────────┐
│              TOP Stripe (Classic UI only)     │
│  ┌────────────────────────────────────────┐   │
│  │          TOP ToolWindow Pane            │   │
├──┼────────────────────────────────────┬───┤   │
│L │                                    │ R │   │
│E │                                    │ I │   │
│F │         CENTER (Editor Area)       │ G │   │
│T │                                    │ H │   │
│  │                                    │ T │   │
│S │                                    │   │   │
│t │                                    │ S │   │
│r │                                    │ t │   │
│i │                                    │ r │   │
│p │                                    │ i │   │
│e ├────────────────────────────────────┤ p │   │
│  │        BOTTOM ToolWindow Pane      │ e │   │
│  ├────────────────────────────────────┤   │   │
│  │        BOTTOM Stripe               │   │   │
│  └────────────────────────────────────┴───┘   │
└──────────────────────────────────────────────┘
```

整个窗口划分为五个区域：

- **CENTER** — 编辑器/主内容区独占，tool window 不能 dock 到这里
- **LEFT / RIGHT / BOTTOM** — tool window 可以 dock 到这三个方向
- **TOP** — Classic UI 支持此锚点，New UI（2022.2+）已移除，使用会抛 `IllegalArgumentException`

关键约束：**每侧分 primary 和 secondary 两个组，同一组内同一时间只有一个 tool window 可见。**

---

## 二、Tool Window 的五种显示模式

| 模式                    | 附着于 Stripe |  推开布局  | 自动隐藏 | 置顶 | 独立窗口 |
| ----------------------- | :-----------: | :--------: | :------: | :--: | :------: |
| **Dock Pinned**（默认） |      Yes      |    Yes     |    No    |  -   |    No    |
| **Dock Unpinned**       |      Yes      |    Yes     |   Yes    |  -   |    No    |
| **Undock**              |      Yes      | No（覆盖） |   Yes    |  -   |    No    |
| **Float**               |      No       |     No     |    No    | Yes  |    No    |
| **Window**              |      No       |     No     |    No    |  No  |   Yes    |

### 详细行为

#### Dock Pinned

- 附着在 tool window bar 上，常驻可见
- 会推开编辑器和其他 tool window，共享布局空间
- 最常见的模式，如 Project 面板

#### Dock Unpinned

- 仍然附着在 bar 上，但只在激活时可见
- 点击其他区域后自动滑回（auto-hide），变成 stripe 上的一个按钮
- 经典使用场景：快速查看但不常驻

#### Undock

- 浮动在布局之上（"upper layer"）
- 不推开任何内容，直接覆盖在编辑器或其他面板上
- 永远 auto-hide，失去焦点就消失
- 在旧版文档中被称为 "Sliding" 模式

#### Float

- 完全脱离 tool window bar
- 悬浮在所有 IDE 窗口之上（always-on-top）
- IDE 主窗口关闭时它也跟随消失
- 可以拖到另一个显示器

#### Window

- 独立的操作系统级窗口
- 不置顶，IDE 主窗口可以盖住它
- 独立生存，可任意放置到不同显示器/桌面

---

## 三、Stripe（按钮条）系统

### 3.1 结构

```
左侧 Stripe（垂直）
┌───┐
│ P │ ← 顶部按钮区域 → 激活时打开垂直 tool window（左侧）
│ r │
│ o │
│ j │
│ e │
│ c │
│ t │
├───┤ ← 分隔线
│ S │ ← 底部按钮区域 → 激活时打开水平 tool window（底部）
│ t │
│ r │
│ u │
│ c │
│ t │
│ u │
│ r │
│ e │
├───┤
│ … │ ← More Tool Windows（溢出菜单）
└───┘
```

- **上部按钮** → 打开的是垂直方向的 tool window（占左/右区域）
- **下部按钮（分隔线下方）** → 打开的是水平方向的 tool window（占底部区域）
- **"…" 按钮** → 尚未显示在任何 stripe 上的 tool window 通过此菜单打开，打开后图标出现在其默认 stripe 上
- 右侧 Stripe 的结构相同

### 3.2 每个按钮的行为

- **单击** → 展开 / 折叠对应的 tool window（toggle）
- **右键** → 上下文菜单：Hide、Move To、View Mode、Split Mode 等
- **拖拽** → 重新排序，或拖到另一侧，或拖到分隔线上方/下方来改变方向
- **双击并按住 Alt/Cmd** → 临时显示所有隐藏的 tool window bar

### 3.3 Primary vs Secondary 组

- 每侧有两个独立的组（primary / secondary）
- 同一个组内同时只能有一个 tool window 展开
- 例如：左侧 primary 组的 Project 展开时，再点 primary 组的 Structure，Project 会收起，Structure 展开
- 如果 Structure 在 secondary 组，两者可以同时可见
- 在 `plugin.xml` 中通过 `secondary="true"` 或 `secondary="false"` 声明

### 3.4 New UI 的变化

- 按钮管理迁移到 `ToolWindowPaneNewButtonManager`
- 新增溢出菜单（"…" — More Tool Windows）
- 图标需提供 16×16px 和 20×20px 两种尺寸
- 可通过右键 → **Show Tool Window Names** 显示文字标签
- **Compact Mode**：减小高度、间距和图标尺寸，适配小屏幕

---

## 四、同侧多 Tool Window 的排列方式

同一侧有多个 tool window 时，有三种排列方式（**每侧独立设置**）：

### 4.1 Tab 模式

```
┌───────────────┐
│ [Project] [Structure] [Favorites]  ← 标签页
├───────────────┤
│               │
│  当前激活的    │
│  tool window  │
│  内容         │
│               │
└───────────────┘
```

- 像浏览器标签页，同一时间只显示一个
- 点击标签切换

### 4.2 Split 模式

```
┌───────────────┐
│   Project     │
│   (权重 0.4)  │
├───────────────┤  ← JSplitPane 分隔线，可拖拽调整
│   Structure   │
│   (权重 0.6)  │
└───────────────┘
```

- 多个 tool window 同时可见
- 通过 `sideWeight` 属性控制分割比例
- 拖拽分隔线可以动态调整

### 4.3 Unsplit 模式

- 所有 tool window 恢复到单一的 tab group
- 同一时间只能看到一个

### 4.4 辅助设置

| 设置项                                    | 作用                                      |
| ----------------------------------------- | ----------------------------------------- |
| **Widescreen tool window layout**         | 限制水平 tool window 宽度，最大化垂直高度 |
| **Side-by-side layout on the left/right** | 垂直 tool window 分两列显示               |
| **Remember size for each tool window**    | 每个 tool window 记住独立宽度/高度        |

---

## 五、内容管理（Content / Tabs）

每个 tool window 内部可以有多个 Content（标签页）：

```java
// 获取内容管理器
ContentManager cm = toolWindow.getContentManager();

// 创建标签页
Content content = ContentFactory.SERVICE.getInstance()
    .createContent(myComponent, "标签名", false);

// 配置
content.setCloseable(true);
content.setDisposer(myDisposable);

// 添加和选择
cm.addContent(content);
cm.setSelectedContent(content);
```

关键特性：

- Content 可以有 closeable、disposer
- 标签页可以拖拽重新排序
- 只有当 tool window 设置 `canCloseContents=true` 时标签才能关闭
- 标签页内容通过 `ContentFactory` 创建，与具体 UI 组件解耦

---

## 六、注册机制

### 6.1 声明式注册（plugin.xml）

```xml
<extensions defaultExtensionNs="com.intellij">
    <toolWindow
        id="MyToolWindow"
        anchor="right"
        secondary="false"
        icon="/icons/myIcon.svg"
        factoryClass="com.example.MyToolWindowFactory"
        canCloseContents="true"
        conditionClass="com.example.MyCondition" />
</extensions>
```

属性一览：

| 属性               | 说明                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `id`               | 唯一标识，也用作默认标题（可通过 `toolwindow.stripe.[id]` 本地化） |
| `anchor`           | `left` / `right` / `bottom`（New UI 中 `top` 不再支持）            |
| `secondary`        | `true` = 放入次要组，`false` = 放入主要组                          |
| `icon`             | stripe 按钮和标题栏的图标                                          |
| `factoryClass`     | 实现 `ToolWindowFactory` 的类                                      |
| `canCloseContents` | 是否允许用户关闭 tool window 内的标签页                            |
| `conditionClass`   | 控制 tool window 是否对该项目可见（旧版方式）                      |

### 6.2 编程式注册

```kotlin
val tw = toolWindowManager.registerToolWindow(
    RegisterToolWindowTask(
        id = "MyDynamicWindow",
        icon = myIcon,
        component = null,
        canCloseContent = true
    )
)
tw.setToHideOnEmptyContent(true)
```

- 适用于动态创建/销毁的 tool window
- 必须在 `ToolWindowManager.invokeLater()` 中调用，否则可能抛出 `IllegalStateException`

### 6.3 ToolWindowFactory 接口

```kotlin
interface ToolWindowFactory {
    fun createToolWindowContent(project: Project, toolWindow: ToolWindow)
    fun isApplicable(project: Project): Boolean  // 2021.1+
    fun shouldBeAvailable(project: Project): Boolean
}
```

### 6.4 懒加载

**核心设计：`createToolWindowContent()` 只在用户第一次点击 stripe 按钮时才被调用。**
未使用的 tool window 不消耗内存和启动时间，大幅优化了 IDE 的启动性能。

---

## 七、拖拽系统

### 7.1 拖拽源

- tool window 的标题栏（通过 `InternalDecorator` 内置的鼠标监听器）
- 标签页（Content tab）

### 7.2 拖拽过程

1. 用户在标题栏或标签上按下鼠标并开始拖拽
2. **GlassPane 层** 覆盖整个 IDE 窗口，绘制半透明遮罩
3. 出现 **停靠提示（docking hints）**：四个边缘 + 中心区域的高亮矩形
4. 鼠标悬停在某个提示上时，显示**预览矩形**（tool window 停靠后的大小和位置）
5. 释放鼠标 → 执行停靠

### 7.3 放置目标与结果

| 放置位置                       | 结果                      |
| ------------------------------ | ------------------------- |
| **左/右/底部边缘 hint**        | dock 到对应边的 stripe    |
| **已有 panel 内部**            | 与已有 panel split        |
| **已有 panel 的 tab 区域**     | 合并为一个 tab group      |
| **拖出主窗口范围**             | 变为 Float 或 Window 模式 |
| **拖到顶部边缘**（Classic UI） | dock 到顶部               |

### 7.4 右键菜单移动

除了拖拽，也可以通过右键菜单：**Move To → Top / Left / Bottom / Right** 来移动 tool window。

### 7.5 组件重挂载（Re-parenting）

浮动和停靠切换时**不重建组件**，而是通过改变 Swing 组件的父容器实现：

- **停靠**：内容组件挂载在 `ToolWindowPane` → `InternalDecorator` → 主窗口内
- **浮动**：内容组件从主窗口移除，挂载到 `FloatingDecorator` → 独立的 `JFrame`
- 这种方式避免了重建组件的性能开销和状态丢失

---

## 八、键盘快捷键系统

### 8.1 Tool Window 快捷键

| 快捷键（Mac）        | 快捷键（Win/Linux） | 行为                                  |
| -------------------- | ------------------- | ------------------------------------- |
| `Cmd+0`              | `Alt+0`             | 激活第 0 号 tool window               |
| `Cmd+1` … `Cmd+9`    | `Alt+1` … `Alt+9`   | 激活对应编号的 tool window            |
| `Option+F12`         | `Alt+F12`           | Terminal                              |
| **按两次**以上快捷键 | 同                  | **隐藏**该 tool window（toggle 行为） |
| `Shift+Esc`          | `Shift+Escape`      | 隐藏当前激活的 tool window            |
| `Cmd+Shift+F12`      | `Ctrl+Shift+F12`    | 隐藏 / 恢复所有 tool window           |
| `F12`                | `F12`               | 跳回上一个 tool window                |
| `Esc`                | `Escape`            | 焦点从 tool window 回到编辑器         |
| `Alt+→` / `Alt+←`    | 同                  | 切换 tool window 内的标签页           |

### 8.2 Stripe 相关

| 操作                                  | 行为                               |
| ------------------------------------- | ---------------------------------- |
| 双击并按住 `Cmd`（Mac）/ `Alt`（Win） | 临时显示所有隐藏的 tool window bar |

### 8.3 内部实现

编号快捷键通过 `ActivateProjectToolWindow` action 实现。编号对应 tool window 在 stripe 上的排序位置，而非固定绑定。

自定义 tool window 如需添加快捷键，需通过 `AnAction` + `<keyboard-shortcut>` 实现。

---

## 九、事件与监听系统

### 9.1 ToolWindowManagerListener

```java
public interface ToolWindowManagerListener {
    /** tool window 的激活状态、布局发生变化时触发 */
    void stateChanged(@NotNull ToolWindowManager toolWindowManager);

    /** 某个 tool window 变为可见 / 被激活时触发 */
    void toolWindowShown(@NotNull ToolWindow toolWindow);

    /** 某个 tool window 被隐藏时触发 */
    void toolWindowHidden(@NotNull ToolWindow toolWindow);
}
```

### 9.2 注册方式

**方式一：声明式**（推荐，支持懒加载）

```xml
<projectListeners>
    <listener class="my.MyListener"
              topic="com.intellij.openapi.wm.ex.ToolWindowManagerListener"/>
</projectListeners>
```

**方式二：编程式**

```java
project.getMessageBus().connect(disposable)
    .subscribe(ToolWindowManagerListener.TOPIC, new ToolWindowManagerListener() {
        @Override
        public void stateChanged(@NotNull ToolWindowManager toolWindowManager) { /* ... */ }
        @Override
        public void toolWindowShown(@NotNull ToolWindow toolWindow) { /* ... */ }
        @Override
        public void toolWindowHidden(@NotNull ToolWindow toolWindow) { /* ... */ }
    });
```

### 9.3 消息总线（Message Bus）架构

```
Application Bus
    └── Project Bus
            ├── Module Bus
            └── ToolWindowManagerListener.TOPIC（project 级别）
```

- `ToolWindowManagerListener.TOPIC` 是 **project 级别**的 topic
- 广播方向默认 `TO_CHILDREN`
- 连接必须绑定到 `Disposable` 以自动清理防止内存泄漏
- 声明式注册的 listener 实例是**懒创建**的（第一次事件到达时才实例化）
- Listener 实现类必须是**无状态的**，且不能实现 `Disposable` 接口

---

## 十、Tool Window 生命周期状态机

```
                         registerToolWindow()
  [Unregistered] ──────────────────────────▶ [Available]
       ▲                                       │
       │  unregister / project close           │ 用户点击按钮 /
       │                                       │ Alt+Number / tw.show()
       │                                       ▼
       │                                  [Visible / Shown]
       │                                       │
       │                         tw.hide() /   │ tw.activate()
       │                         点击按钮 /     │
       │                         Shift+Esc     ▼
       │                                  [Active]
       │                                       │
       └───────────────────────────────────────┘
```

五个状态详解：

| 状态             |  Stripe 按钮  | 面板可见 | 拥有焦点 | 内容已创建  |
| ---------------- | :-----------: | :------: | :------: | :---------: |
| **Unregistered** |       -       |    -     |    -     |      -      |
| **Available**    |      Yes      |    -     |    -     | -（懒加载） |
| **Visible**      | Yes（按下态） |   Yes    |    No    |     Yes     |
| **Active**       | Yes（按下态） |   Yes    |   Yes    |     Yes     |
| **Hidden**       |      Yes      |    -     |    -     |     Yes     |

### 核心 API

```java
// 显示 tool window（异步，Runnable 在 EDT 上执行）
tw.show(() -> { /* 面板已经可见 */ });

// 显示并获得焦点
tw.activate(() -> { /* 面板已获得焦点 */ });

// 隐藏
tw.hide();
tw.hide(() -> { /* 隐藏完成后回调 */ });

// 状态查询
tw.isVisible();    // 面板是否展开
tw.isActive();     // 面板是否展开且拥有焦点
tw.isAvailable();  // stripe 按钮是否可见

// 控制可用性
tw.setAvailable(false);  // 隐藏 stripe 按钮（不可通过 UI 恢复）
tw.setToHideOnEmptyContent(true);  // 内容为空时自动隐藏

// 内容管理
tw.getContentManager();  // 获取 ContentManager
tw.setTitle("新标题");
tw.setIcon(myIcon);
```

### 重要：线程注意事项

始终使用 `ToolWindowManager.invokeLater()` 而非 `Application.invokeLater()` 来调度 tool window 相关的 EDT 任务。

---

## 十一、Editor（中央编辑区）的 Split 系统

编辑器区域有独立的 split 机制，与 tool window 系统互补。

### 11.1 Split 操作

| 操作                     | 快捷键/方式                     | 效果                          |
| ------------------------ | ------------------------------- | ----------------------------- |
| **Split Right**          | 右键 tab → Split Right          | 垂直分割，新建右侧编辑窗格    |
| **Split Down**           | 右键 tab → Split Down           | 水平分割，新建下方编辑窗格    |
| **Split and Move Right** | 右键 tab → Split and Move Right | 把当前 tab 移到新建的右侧窗格 |
| **Split and Move Down**  | 右键 tab → Split and Move Down  | 把当前 tab 移到新建的下方窗格 |
| **拖拽 tab**             | 拖到编辑区边缘                  | 自动 split                    |
| **Open in Right Split**  | Project 视图中 `Shift+Enter`    | 在右侧分割窗格中打开文件      |

### 11.2 Unsplit 操作

| 操作            | 效果                                |
| --------------- | ----------------------------------- |
| **Unsplit**     | 移除当前窗格，其 tab 合并到相邻窗格 |
| **Unsplit All** | 移除所有 split，恢复为单一编辑区    |

### 11.3 Change Splitter Orientation

- 右键 tab → **Change Splitter Orientation**
- 将水平分割转为垂直分割，反之亦然

### 11.4 窗格间导航

| 快捷键（Mac）      | 快捷键（Win/Linux） | 行为                   |
| ------------------ | ------------------- | ---------------------- |
| `Option+Tab`       | `Alt+Tab`           | Goto Next Splitter     |
| `Option+Shift+Tab` | `Alt+Shift+Tab`     | Goto Previous Splitter |

### 11.5 其他编辑区功能

| 操作                     | 效果                                               |
| ------------------------ | -------------------------------------------------- |
| **Stretch Editor**       | 将当前 split 窗格扩展到指定方向                    |
| **Equalize proportions** | 所有 split 窗格恢复等比例                          |
| **Detach tab**           | 将 tab 拖出主窗口或按 `Shift+F4`，变成独立浮动窗口 |

---

## 十二、布局持久化（workspace.xml）

### 12.1 文件位置与格式

所有 tool window 的状态序列化到 `.idea/workspace.xml`（老版本）或配置目录下的 `workspace/` XML 文件中。

### 12.2 顶层结构

```xml
<component name="ToolWindowManager">
    <!-- 1. 主窗口几何 -->
    <frame x="..." y="..." width="..." height="..." extended-state="..." />

    <!-- 2. 编辑器激活状态 -->
    <editor active="false|true" />

    <!-- 3. 布局（平铺格式 或 split 树格式） -->
    <layout>
        <!-- 方式 A: 平铺的 window_info 列表（经典格式） -->
        <window_info ... />
        <window_info ... />

        <!-- 方式 B: split/leaf 嵌套树（新版格式） -->
        <split mode="horizontal" proportion="0.3">
            <leaf ... />
            <split mode="vertical" proportion="0.6">
                <leaf ... />
                <leaf ... />
            </split>
        </split>
    </layout>
</component>
```

### 12.3 window_info 属性详解

```xml
<window_info
    id="Project"
    active="true"
    anchor="left"
    auto_hide="false"
    internal_type="DOCKED"
    type="DOCKED"
    visible="true"
    show_stripe_button="true"
    weight="0.25"
    sideWeight="0.5"
    order="0"
    side_tool="false"
    content_ui="tabs" />
```

| 属性                 | 类型   | 含义                                                                           |
| -------------------- | ------ | ------------------------------------------------------------------------------ |
| `id`                 | string | tool window 的唯一标识符                                                       |
| `active`             | bool   | 是否是当前激活的 tool window                                                   |
| `anchor`             | enum   | `left` / `right` / `bottom` / `top`（New UI 不用 top）                         |
| `auto_hide`          | bool   | 是否自动隐藏（unpinned 行为）                                                  |
| `type`               | enum   | 显示模式：`DOCKED` / `FLOATING` / `WINDOWED` / `SLIDING`                       |
| `internal_type`      | enum   | 内部运行时类型，插件不应依赖此字段                                             |
| `visible`            | bool   | 面板当前是否展开                                                               |
| `show_stripe_button` | bool   | stripe 按钮是否可见                                                            |
| **`weight`**         | float  | 占该侧的宽度/高度比例。如两个 bottom window 的 weight=0.3 和 0.7 → 按 3:7 分割 |
| **`sideWeight`**     | float  | 同侧 split 时的分配比例。0.5 = 对半分，0.6 = 上方占 60%                        |
| **`order`**          | int    | 在该侧 stripe 上的排序位置（从 0 开始）                                        |
| `side_tool`          | bool   | 是否显示为侧边工具（纤细的侧栏工具 vs 完整的 tool bar）                        |
| `content_ui`         | enum   | 内容 UI 类型：`tabs` / `combo`                                                 |

### 12.4 Split 树格式

新版 IDEA 也支持嵌套的 `<split>` / `<leaf>` 树来表示更复杂的布局：

```xml
<layout>
    <split mode="horizontal" proportion="0.3">
        <leaf id="Project" weight="0.5" />
        <split mode="vertical" proportion="0.6">
            <leaf id="Structure" weight="0.4" />
            <leaf id="Favorites" weight="0.6" />
        </split>
    </split>
</layout>
```

| 元素      | 属性                                                           | 说明                             |
| --------- | -------------------------------------------------------------- | -------------------------------- |
| `<split>` | `mode`（`"horizontal"` / `"vertical"`），`proportion`（float） | 分割容器，在子元素间分配空间     |
| `<leaf>`  | `id`（tool window ID），`weight`（float）                      | 叶子节点，引用具体的 tool window |

### 12.5 布局保存/恢复操作

| 操作                                | 快捷键/菜单位置                                |
| ----------------------------------- | ---------------------------------------------- |
| **Store Current Layout as Default** | Window → Store Current Layout as Default       |
| **Restore Default Layout**          | Window → Restore Default Layout（`Shift+F12`） |
| **命名布局管理**                    | Window → Layouts → 保存/切换多个命名布局       |

---

## 十三、New UI（2022.2+）的变化

### 13.1 主要变更

| 项目            | Classic UI               | New UI                                                  |
| --------------- | ------------------------ | ------------------------------------------------------- |
| `anchor="top"`  | 支持                     | **不再支持**，使用会抛出 `IllegalArgumentException`     |
| Stripe 按钮管理 | 旧的 `StripeButton` 组件 | `ToolWindowPaneNewButtonManager` 统一管理               |
| 初始化          | 旧有流程                 | `ToolWindowSetInitializer.createAndLayoutToolWindows()` |
| 布局存储        | 平铺 `window_info` 列表  | 支持 `<split>/<leaf>` 嵌套树 + 旧格式兼容               |
| 溢出处理        | 无（按钮全部可见）       | "…" More Tool Windows 溢出菜单                          |
| 视觉效果        | 传统 Swing 风格          | 更紧凑、更现代的视觉呈现                                |

### 13.2 Compact Mode

- 减小 toolbar 和 tool window 标题栏高度
- 缩小间距（spacings）和内边距（paddings）
- 使用更小的图标（16×16 而非 20×20）
- 适用于小屏幕设备

通过 **View → Appearance → Compact Mode** 切换。

### 13.3 图标规范

New UI 要求 tool window 图标提供**两种尺寸**：20×20px 和 16×16px。不正确的图标尺寸可能导致 stripe 上的显示异常。

### 13.4 溢出菜单的已知问题

- 溢出菜单（"…"）的状态在 IDE 重启后**不持久化**，部分 tool window 每次重启后需要重新从 "…" 中打开
- 动态 tool window（如 Find、Run、Debug）在没有内容时主动隐藏是设计行为

---

## 十四、内部组件树结构

```
JFrame（主窗口）
 └── IdeRootPane
      ├── ToolWindowStripe（左）              ← StripeButton[]
      ├── ToolWindowStripe（右）              ← StripeButton[]
      ├── ToolWindowStripe（底）              ← StripeButton[]
      ├── ToolWindowPane（左展开区 × N）       ← 可能有多个
      │    └── InternalDecorator              ← 标题栏（标题、隐藏/浮动/关闭按钮）
      │         └── ContentPanel
      │              └── JBTabsImpl           ← 标签页组件
      │                   └── 插件提供的 JComponent
      ├── ToolWindowPane（右展开区 × N）
      │    └── InternalDecorator → ContentPanel → ...
      ├── ToolWindowPane（底展开区 × N）
      │    └── InternalDecorator → ContentPanel → ...
      ├── EditorArea（中央区域）
      │    └── EditorWindow[]                 ← 多个 split 窗格
      │         └── EditorTabbedPane
      │              └── EditorImpl           ← 具体编辑器实例
      └── GlassPane                          ← 拖拽时的透明遮罩 + 停靠提示绘制层
```

关键设计点：

- **IdeRootPane** 是整个 IDE 主窗口的根容器
- **ToolWindowStripe × 3** 分别负责左、右、底部的按钮条
- **ToolWindowPane** 按需创建，通过 JSplitPane 分隔
- **InternalDecorator** 是标题栏的装饰器，内置拖拽手柄
- **FloatingDecorator**（未在上图显示）是浮动窗口的 JFrame 装饰器
- **GlassPane** 是顶层透明层，拦截拖拽事件并绘制停靠提示

---

## 十五、对 Web 端设计的启发

### 15.1 适合迁移到 Web 的机制

| 机制                | Web 可行性 | 说明                                                   |
| ------------------- | :--------: | ------------------------------------------------------ |
| 四向锚点布局        |     高     | CSS Grid 天然支持，三个 tool window 区 + 中央主内容区  |
| Stripe 按钮条       |     高     | 纯 CSS + 少量 JS 即可实现，折叠/展开 toggle            |
| Split 模式          |     高     | 现有库（Golden Layout、Dockview、Splitpanes）成熟      |
| Tab 管理            |     高     | 大量 UI 库（Ant Design Tabs 等）原生支持               |
| 懒加载内容          |     高     | Vue `defineAsyncComponent` / React `lazy` + `Suspense` |
| 注册机制            |     高     | Vue 的 `provide/inject` 或简单的 plugin registry       |
| 事件系统            |     高     | mitt / event bus / Pinia store                         |
| 布局持久化          |     高     | localStorage / IndexedDB 序列化 JSON                   |
| 自定义布局/命名布局 |     高     | 同上，支持多套布局切换                                 |

### 15.2 Web 端的主要挑战

| 挑战                              | 说明                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| **拖拽时的 GlassPane + 停靠提示** | Web 无原生 GlassPane 概念，需要用 pointer-events + overlay + 复杂 hit-test 模拟       |
| **浮动窗口**                      | 浏览器无法创建真正的独立 OS 窗口，可用 Popup/Modal 模拟或使用 `window.open`（体验差） |
| **Re-parenting 性能**             | Web 端的 DOM 移动会触发生命周期重建（尤其是 Vue/React），需用 Teleport/Portal 优化    |
| **JSplitPane 式拖拽调整大小**     | CSS `resize` 只能拖右下角，双向调整需要自己监听 pointer 事件                          |
| **全局快捷键冲突**                | 浏览器快捷键优先，如 Cmd+1~9 会被浏览器拦截，需要用户手动注册或使用不同快捷键         |
| **New UI 的溢出菜单持久化**       | Web 端更容易做（localStorage），但需要考虑默认状态和重置逻辑                          |

### 15.3 推荐的 Web 端 Docking 库

| 库                | 特点                                                           |
| ----------------- | -------------------------------------------------------------- |
| **Golden Layout** | 最接近 IDEA 模型，支持 dock/split/float/tab，有 Vue/React 封装 |
| **Dockview**      | TypeScript 原生，零依赖，高性能，Visual Studio Code 风格       |
| **Splitpanes**    | 轻量级，仅做 split pane，适合自行组合                          |
| **自定义实现**    | CSS Grid + pointer events + 状态驱动，灵活但工作量大           |

---

## 十六、总结

IDEA 的窗口框架是一套高度成熟、深度集成的 Docking 系统，核心由以下子系统构成：

1. **布局模型**：5 区域（CENTER + TOP/BOTTOM/LEFT/RIGHT），每侧 primary + secondary 两组
2. **显示模式**：Dock Pinned / Unpinned / Undock / Float / Window 五种，覆盖所有使用场景
3. **Stripe 按钮条**：上下分区，溢出菜单，拖拽排序，双尺寸图标
4. **Split 系统**：Tab / Split / Unsplit，每侧独立，JSplitPane + sideWeight 控制比例
5. **Content 管理**：ContentManager + ContentFactory，多 tab，可关闭
6. **注册系统**：声明式 + 编程式，懒加载，条件可见
7. **拖拽系统**：GlassPane + docking hints + 组件 re-parenting（不重建）
8. **键盘快捷键**：Alt/Cmd+Number 双层 toggle，Shift+Esc，F12
9. **事件系统**：ToolWindowManagerListener + 分层 MessageBus
10. **生命周期**：Unregistered → Available → Visible → Active → Hidden
11. **编辑器 Split**：Split Right/Down，Unsplit，Change Orientation
12. **布局持久化**：workspace.xml（平铺 window_info 或 split/leaf 嵌套树）
13. **New UI**：移除 top anchor，溢出菜单，Compact Mode，新 button manager

整个框架的核心设计哲学：

- **插件只提供内容，平台管理布局** — 注册机制让业务模块解耦
- **懒加载优先** — 不使用就不创建，保护启动性能
- **状态不丢失** — re-parenting 而非重建，布局持久化到文件
- **用户完全控制** — 五种模式 + 三种排列 + 拖拽 + 命名布局，自由度极高
