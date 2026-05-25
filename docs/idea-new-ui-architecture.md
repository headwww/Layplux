# IntelliJ IDEA New UI 窗口架构与机制

## 一、完整布局（ASCII 图）

### 1.1 结构总览

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  JFrame (IdeFrameImpl)                                                       │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │ JRootPane                                                                ││
│  │ ┌────────────────────────────────────────────────────────────────────────┐│
│  │ │ MenuBar / NewUI 汉堡菜单 (可隐藏, Ctrl+Shift+A 可随时搜索替代)         ││
│  │ ├────────────────────────────────────────────────────────────────────────┤│
│  │ │ JLayeredPane (Z轴分层容器)                                             ││
│  │ │ ┌────────────────────────────────────────────────────────────────────┐ ││
│  │ │ │ IdeRootPane (主内容区根面板)                                       │ ││
│  │ │ │ ┌────────┬────────────────────────────────────────┬────────┐       │ ││
│  │ │ │ │ LStripe│           Center Panel                │ RStripe│       │ ││
│  │ │ │ │        │                                        │        │       │ ││
│  │ │ │ │[Project]│ ┌──────────────────────────────────┐  │[Favrts]│       │ ││
│  │ │ │ │[Struct] │ │     EditorsSplitters             │  │[DB]    │       │ ││
│  │ │ │ │[Git]    │ │  ┌────────────────────────┐      │  │        │       │ ││
│  │ │ │ │         │ │  │   EditorWindow (tab组) │      │  │        │       │ ││
│  │ │ │ │  展开后  │ │  │ ┌────────────────────┐ │      │  │        │       │ ││
│  │ │ │ │         │ │  │ │ EditorTabContainer │ │      │  │        │       │ ││
│  │ │ │ │ ─────── │ │  │ │ [Foo.ts][Bar.ts]...│ │      │  │        │       │ ││
│  │ │ │ │ Project │ │  │ ├────────────────────┤ │      │  │        │       │ ││
│  │ │ │ │ 内容区  │ │  │ │                    │ │      │  │        │       │ ││
│  │ │ │ │         │ │  │ │ EditorComposite    │ │      │  │        │       │ ││
│  │ │ │ │         │ │  │ │ (Editor 文档+显示)│ │      │  │        │       │ ││
│  │ │ │ │         │ │  │ │                    │ │      │  │        │       │ ││
│  │ │ │ │         │ │  │ └────────────────────┘ │      │  │        │       │ ││
│  │ │ │ │         │ │  └────────────────────────┘      │  │        │       │ ││
│  │ │ │ │         │ │                                  │  │        │       │ ││
│  │ │ │ │         │ │  分屏后:                          │  │        │       │ ││
│  │ │ │ │         │ │  ┌─────────┬──────────────────┐  │  │        │       │ ││
│  │ │ │ │         │ │  │  Win 1  │      Win 2       │  │  │        │       │ ││
│  │ │ │ │         │ │  └─────────┴──────────────────┘  │  │        │       │ ││
│  │ │ │ │         │ └──────────────────────────────────┘  │        │       │ ││
│  │ │ │ ├────────┴────────────────────────────────────────┴────────┤       │ ││
│  │ │ │ │ Navigation Bar (新UI: 面包屑在底部)                      │       │ ││
│  │ │ │ │  src > main > com > Foo.kt                               │       │ ││
│  │ │ │ ├──────────────────────────────────────────────────────────┤       │ ││
│  │ │ │ │ Bottom Stripe + Content                                  │       │ ││
│  │ │ │ │ [Terminal│Problems│Git│Run│TODO│...]                     │       │ ││
│  │ │ │ ├──────────────────────────────────────────────────────────┤       │ ││
│  │ │ │ │ StatusBar                                                  │       │ ││
│  │ │ │ │ 🔒main  ⬡ 20:1  UTF-8  LF  Java 8  ▶ Run  [bell] [👤]    │       │ ││
│  │ │ │ └──────────────────────────────────────────────────────────┘       │ ││
│  │ │ └────────────────────────────────────────────────────────────────────┘ ││
│  │ │                                                                        ││
│  │ │ ┌─── Z轴各层 (从低到高) ────────────────────────────────────────────┐  ││
│  │ │ │ DEFAULT_LAYER                                                      │  ││
│  │ │ │   ↑ IdeRootPane 内的所有内容 (editor, tool window, stripe, ...)   │  ││
│  │ │ │ PALETTE_LAYER                                                      │  ││
│  │ │ │   ↑ 浮动工具栏, 滚动条 anchor                                      │  ││
│  │ │ │ POPUP_LAYER                                                        │  ││
│  │ │ │   ↑ JBPopup (代码补全, Search Everywhere, Find in Files, 通知)    │  ││
│  │ │ │ DRAG_LAYER                                                         │  ││
│  │ │ │   ↑ 拖拽中的半透明组件 (拖 tab 时的预览, 拖 tool window 按钮)     │  ││
│  │ │ │ MODAL_LAYER                                                        │  ││
│  │ │ │   ↑ 模态对话框 (Settings, New Project, 确认对话框)                 │  ││
│  │ │ └────────────────────────────────────────────────────────────────────┘  ││
│  │ │                                                                        ││
│  │ │ ┌─── IdeGlassPaneImpl (覆盖全部, 最顶层) ──────────────────────────┐  ││
│  │ │ │  职责: 拖拽指示线绘制, undocked遮罩, resize光标, 全局鼠标拦截   │  ││
│  │ │ └────────────────────────────────────────────────────────────────────┘  ││
│  │ └────────────────────────────────────────────────────────────────────────┘│
│  └──────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Tool Window 四种模式的切换

```
Docked (停靠)                      Sliding (滑出)
┌────────────────────┐             ┌────────────────────┐
│ [Stripe]           │             │ [Stripe]           │
│  Project ████████  │             │  Project ─┐        │
│  ████████████████  │ ←推开editor │  Structure  │       │
│  ████████████████  │             │  Git        │       │
│  ██ 内容占固定空间 ██│             │  ┌─────────┐│       │
│  ████████████████  │             │  │Popup   ││       │
│  ████████████████  │             │  │覆盖在  ││ ←覆盖editor
│                    │             │  │editor上││       │
└────────────────────┘             │  │失焦收起 ││       │
                                   │  └─────────┘│       │
                                   └─────────────┘       │

Undocked (浮动, New UI新增)        Windowed (独立窗口)
┌────────────────────┐             ┌──────────────┐  ┌────────────────────┐
│ [Stripe]           │             │ [Stripe]     │  │ 独立 OS 窗口      │
│  Project ███████████│            │  Project     │  │ ┌──────────────┐  │
│  ████████████████  │             │  Structure   │  │ │ 可拖到      │  │
│  ████████████████  │ ←作为popup  │              │  │ │ 另一个屏幕  │  │
│  ████████████████  │  挂在stripe │              │  │ └──────────────┘  │
│  ██ 半透明遮罩 ████│  按钮下方   │              │  └──────────────────┘
│  ████████████████  │             │              │
└────────────────────┘             └──────────────┘
```

### 1.3 Editor 分屏（二叉树结构）

```
单窗口:
     EditorsSplitters
          └─ EditorWindow 0
               ├─ Tab: Foo.ts
               ├─ Tab: Bar.ts
               └─ Tab: Baz.ts

垂直分屏 (Split Right):
     EditorsSplitters
          ├─ Splitter (VERTICAL)
          │    ├─ EditorWindow 0       ← 左半边
          │    │    └─ Foo.ts, Bar.ts
          │    └─ EditorWindow 1       ← 右半边
          │         └─ Baz.ts

再水平分屏 (Split Down on Win 0):
     EditorsSplitters
          ├─ Splitter (VERTICAL)
          │    ├─ Splitter (HORIZONTAL)
          │    │    ├─ EditorWindow 0   ← 左上
          │    │    │    └─ Foo.ts
          │    │    └─ EditorWindow 2   ← 左下
          │    │         └─ Bar.ts
          │    └─ EditorWindow 1        ← 右侧
          │         └─ Baz.ts
```

---

## 二、技术机制详解

### 2.1 组件树机制

核心原则：**整个 IDE 窗口只有一棵 Swing 组件树**。Tool Window 不是独立 `JFrame`，而是同一个 `JFrame` 内的 `JComponent`。

```
JFrame (JFrame 子类, IdeFrameImpl 是实现)
 └─ JRootPane (Swing 标准根容器)
     ├─ glassPane      → IdeGlassPaneImpl (透明拦截层)
     ├─ layeredPane    → JLayeredPane (Z轴管理)
     │   ├─ default    → IdeRootPane (主内容)
     │   ├─ palette    → 浮动工具栏
     │   ├─ popup      → JBPopup
     │   ├─ drag       → 拖拽预览
     │   └─ modal      → 模态对话框
     └─ contentPane    → 废弃不用, IDEA 全用 layeredPane
```

### 2.2 Stripe + Decorator 附着机制

Tool Window 的按钮和内容是分离的：

```
ToolWindowStripe
  └─ ToolWindowPane (按钮面板)
      └─ ToolWindowStripeButton × N   ← 只负责图标按钮

用户点击按钮:
  1. ToolWindowManager.activateToolWindow(id)
  2. 获取或懒创建 InternalDecorator
  3. 根据 ToolWindowType 决定如何挂载:
     ├─ DOCKED   → 插入 stripe 旁 Splitter, 推开 editor
     ├─ SLIDING  → 覆盖在 editor 上方 (popup layer)
     ├─ UNDOCKED → 作为 popup 挂在 stripe 按钮正下方
     └─ WINDOWED → 创建独立 JFrame

InternalDecorator 内部结构:
  └─ ToolWindowHeader (标题栏: tabs, gear, hide)
  └─ ToolWindowContentUi
      └─ ContentManager
          ├─ Content[0] → JComponent (当前活动tab)
          ├─ Content[1] → JComponent (后台tab)
          └─ ...
```

**关键机制**：切换模式时 `InternalDecorator` 在组件树中**移动位置**（从 Splitter 移到 JLayeredPane 的 popup 层，或移到独立 JFrame），而不是销毁重建。这意味着：
- 内容状态（展开的树节点、滚动位置等）保持不变
- 没有重新实例化的性能开销

### 2.3 Splitter 分屏机制

`EditorsSplitters` 不是简单的 `JSplitPane` 数组，而是一棵**二叉树**：

```
数据结构:
  - 叶子节点 = EditorWindow (一个 tab 组)
  - 非叶子节点 = Splitter (分割线, 含方向 HORIZONTAL/VERTICAL)

操作映射:
  Split Right  → 在二叉树中当前叶子位置插入一个 VERTICAL 分叉节点
  Split Down   → 插入一个 HORIZONTAL 分叉节点
  Unsplit      → 删除当前叶子节点的父分叉节点, 内容合并到兄弟节点
  Tabs 合并    → 把所有叶子节点的 tabs 收集到目标节点

序列化 (writeExternal):
  <splitter>
    <split vertical="true">
      <leaf>
        <file>Foo.ts</file>
        <file>Bar.ts</file>
      </leaf>
      <leaf>
        <file>Baz.ts</file>
      </leaf>
    </split>
  </splitter>
```

同一个 Splitter 机制也用于 Tool Window 区域——每个 stripe 旁边的内容区是一棵独立的 splitter 树，tool window 之间可以互相 split（把一个 tool window 拖到另一个的上面/下面/左边/右边）。

### 2.4 Glass Pane 拦截机制

`IdeGlassPaneImpl` 是覆盖整个窗口的透明 `JComponent`，承担全局可视化职责：

```
职责:
  1. 拖拽指示线      - 拖 tab/tool window 时的蓝色高亮线
  2. Undocked 遮罩    - undocked tool window 背后的半透明灰色层
  3. Resize 光标      - 全局切换光标为 resize 样式
  4. 鼠标事件拦截     - resize 操作时接管所有鼠标事件
  5. Welcome screen   - 无项目打开时的欢迎页
  6. 全局提示文字     - Zen mode / Distraction Free 模式的提示

事件流:
  MouseEvent → IdeGlassPane.preprocess()
    ├─ 在 resize 区域? → 拦截, 改为调整 Splitter 比例
    ├─ 在 drag 中?     → 拦截, 更新拖拽预览位置
    └─ 否则           → 透传给下层实际目标组件
```

### 2.5 IdeEventQueue 全局事件拦截

IDEA 替换了 AWT 默认的 `EventQueue`：

```
注册:
  Toolkit.getDefaultToolkit()
    .getSystemEventQueue()
    .push(new IdeEventQueue())

职责:
  1. 快捷键优先匹配
     KeyEvent → ActionManager 匹配 → 匹配成功则 consume, 不传递给组件

  2. Popup 关闭逻辑
     MouseEvent (点击 popup 外部) → 自动关闭所有 popup
     (比 Swing 默认更精细——某些 popup 允许点击特定区域不关闭)

  3. Idle 检测
     空闲 n 秒后 → IdeActivityTracker 标记 idle
     → 触发后台任务 (索引、代码分析、action update 循环)

  4. 双击标准化
     不同平台的 double-click 间隔不同
     IdeEventQueue 归一化为统一行为

  5. 输入法支持
     组合输入事件 (InputMethodEvent) 的预处理
```

### 2.6 焦点管理

```
AWT FocusManager
  └─ IdeFocusManager (per-project, 覆盖默认行为)

核心方法:
  requestFocus(component, forced)
    1. 确保在 EDT 上执行
    2. 如果 component 所属 tool window 是折叠的 → 先展开
    3. 如果 component 在后台 tab → 先切换到该 tab
    4. 调用 Swing 原生 requestFocusInWindow()
    5. 记录 "最后焦点" 供 Escape 回跳使用

焦点转移策略:
  焦点在 Editor  → 按 Escape → 焦点回到 Tool Window (之前活动的)
  焦点在 TW     → 按 Escape → 焦点回到 Editor
  焦点在 Popup  → 按 Escape → Popup 关闭, 焦点回到原组件
  焦点在 Dialog → 按 Escape → 等同于 Cancel 按钮

多窗口: 每个 Project 有独立的 IdeFocusManager
```

### 2.7 布局持久化

```
保存路径:
  Project 级 → .idea/workspace.xml
  IDE 级    → ~/.config/JetBrains/<product><version>/options/

保存时机:
  1. 正常关闭项目
  2. File → Manage IDE Settings → Save Current Layout as Default
  3. 自动保存 (IDE 空闲时, 防止 crash 丢失布局)

保存内容:
  UISettings.writeExternal(Element)
    ├─ 每个 ToolWindow 的状态
    │   ├─ anchor (left/right/bottom)
    │   ├─ type   (docked/sliding/undocked/windowed)
    │   ├─ isVisible / isSplit / isShowStripeButton
    │   └─ split 比例 (在 stripe 内容区的 splitter 树)
    ├─ EditorsSplitters 的完整分割树
    │   └─ 每片叶子的 file path + caret position
    ├─ 窗口尺寸和位置
    └─ Stripe 折叠状态

恢复 (项目打开时):
  LayoutRestorer.restore()
    1. 反序列化 splitters 树 → 重建 EditorWindow 结构
    2. 恢复 tool window 状态 (anchor/type/visible)
    3. 恢复文件 tabs → 重新打开文件, 跳转到上次光标位置
    4. 懒创建 tool window 内容 (只在首次激活时 new)
```

### 2.8 Action 系统

```
结构:
  ActionManager (全局单例)
    ├─ 注册所有 Action (来自 plugin.xml + 代码注册)
    ├─ ActionGroup 树 (菜单/工具栏的层级结构)
    └─ 快捷键映射 (Keymap)

Action 生命周期:
  AnAction 实例是全局单例 (一个 class 只有一个 instance)

  update(AnActionEvent)     ← 高频调用, 每帧都可能触发
    ├─ 读取 DataContext (从焦点组件向上爬组件树收集)
    ├─ 设置 presentation.enabled (灰不灰)
    ├─ 设置 presentation.visible (看不看得见)
    ├─ 设置 presentation.text / icon (可能动态变化)
    └─ ⚠️ 必须轻量, 不能做 IO

  actionPerformed(AnActionEvent)
    ← 用户实际点击或按快捷键时触发, 可以重

DataContext 机制:
  不是全局 map, 而是从焦点组件沿组件树向上查找:
    Editor → EditorComposite → EditorWindow → IdeRootPane → ...
  每层组件可以实现 DataProvider 接口提供数据:
    getData(CommonDataKeys.PROJECT.name) → project
    getData(CommonDataKeys.EDITOR.name)  → editor
    getData(CommonDataKeys.PSI_FILE.name) → psiFile
```

### 2.9 Layered Pane Z轴分层

| 层常量 | 值 | 内容 | 说明 |
|---|---|---|---|
| `DEFAULT_LAYER` | 0 | IdeRootPane (editor, tool window, stripe, statusbar) | 正常 UI |
| `PALETTE_LAYER` | 100 | 浮动工具栏, 滚动条自定义 UI | 浮动但非 popup |
| `POPUP_LAYER` | 200 | JBPopup (代码补全, Search Everywhere, Find in Files, 通知) | 轻量 popup |
| `DRAG_LAYER` | 300 | 拖拽中的半透明组件 (tab 拖拽预览, tool window 拖拽中的缩略图) | 拖拽视觉反馈 |
| `MODAL_LAYER` | 400 | 模态对话框 (Settings, New Project, 确认框) | 阻塞交互 |

**Undocked tool window** 在 New UI 中利用了这些分层——undocked 的内容放在 `POPUP_LAYER`，背后的半透明遮罩由 `IdeGlassPaneImpl` 绘制在 `DEFAULT_LAYER` 上方。

### 2.10 Content 标签页管理

Tool Window 内部的标签页系统：

```
InternalDecorator
  └─ ToolWindowContentUi
      ├─ JBTabs (标签页栏组件, 高度定制化的 JTabbedPane)
      │   ├─ Tab[0] → "Project"
      │   ├─ Tab[1] → "Packages"
      │   └─ "..."  → 溢出菜单
      └─ ContentManager
          ├─ addContent(Content)        → 添加新 tab
          ├─ removeContent(Content)     → 删除 tab
          ├─ setSelectedContent(Content)→ 切换 tab
          └─ getContents()             → 获取所有 tab

Content 属性:
  - displayName          → tab 标题
  - component            → JComponent (内容)
  - isCloseable          → 是否显示 × 关闭按钮
  - preferredFocusableComponent → 切换到此 tab 时焦点放哪
  - actions              → tab 标题栏的额外按钮
  - description          → tooltip
```

### 2.11 启动构建流程

```
IDE 启动 (无项目)
  → WelcomeFrame 显示

用户打开项目:
  1. ProjectManager.openProject(path)
  2. new IdeFrameImpl() 构造 JFrame
  3. WindowManager.allocateFrame(project, frame) 注册
  4. IdeRootPane 创建并 setContentPane()
  5. UISettings 反序列化 (workspace.xml)
  6. ToolWindowManager.init()
     ├─ 遍历 plugin.xml 注册的 toolWindow
     ├─ 为每个创建 ToolWindowStripeButton
     ├─ 恢复上次的 visible/anchor/type
     └─ ⚠️ 不创建 InternalDecorator (懒创建)
  7. EditorsSplitters 恢复
     └─ 反序列化分割树, 重新打开文件 tabs
  8. 加载 Action, 构建 toolbar/menu
  9. frame.setVisible(true)
  10. ProjectOpenActivity 执行
      └─ 索引、代码分析 (后台)
  11. 用户首次点击 tool window 按钮
      → ToolWindowFactory.createToolWindowContent() 被调用
      → InternalDecorator 实例化并挂载
```

### 2.12 Resize 机制

```
Resize 流程:
  1. 鼠标进入 stripe 边缘 4-5px 的透明 resize 区域
  2. IdeGlassPane 切换光标为 E/W/N/S resize cursor
  3. 用户按下鼠标左键
  4. IdeGlassPane 接管所有 MouseMotionEvent
     └─ 不再分发给下层组件, 避免 mouseenter/mouseleave 闪烁
  5. 实时计算 delta → 更新 Splitter 的 proportion
     └─ 触发 revalidate + repaint
  6. 用户释放鼠标
     └─ 新 proportion 写入 UISettings → 标记 dirty → 下次自动保存

关键: resize 期间 IdeGlassPane 完全接管事件,
     下层组件 (editor, tool window 内容) 完全不知道 resize 正在进行
```

### 2.13 New UI Compact Mode 实现

New UI 的三种密度不是简单的全局 scale factor：

```
Density: Default / Compact / Minimal

实现方式:
  不是 CSS zoom 或全局 scale, 而是每个组件独立响应

  UISettings.density → 每个组件通过 JBUI.scale(n) 调整:
    ├─ 图标大小:    16px → 14px → 12px (toolbar icons)
    ├─ 行高:        标准 → 紧凑 → 最小 (project view rows)
    ├─ 间距:        8px  → 6px  → 4px  (各处 margin/padding)
    ├─ Tab 高度:    32px → 28px → 24px
    └─ Stripe 宽度: 40px → 32px → 24px (折叠时)

代价: 三套间距参数, 维护成本高, 但体验精准
```

---

## 三、机制总览图

```
                 ┌─────────────────────────────┐
                 │        IdeEventQueue         │
                 │  (全局事件拦截, 快捷键优先)   │
                 └────────────┬────────────────┘
                              │ 过滤后的事件
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     JFrame (IdeFrameImpl)                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  IdeGlassPaneImpl                        │ │
│  │        (最顶层透明面板, 全局可视化 + 鼠标拦截)           │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │                  JLayeredPane                            │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │  MODAL_LAYER: 模态对话框                          │   │ │
│  │  │  DRAG_LAYER:  拖拽半透明预览                      │   │ │
│  │  │  POPUP_LAYER: JBPopup + Undocked TW               │   │ │
│  │  │  PALETTE_LAYER: 浮动工具栏                         │   │ │
│  │  │  DEFAULT_LAYER: IdeRootPane ───────────────────┐   │   │ │
│  │  │  ┌──────────┬──────────────────────┬──────────┐│   │   │ │
│  │  │  │ LStripe  │  CenterPanel         │ RStripe  ││   │   │ │
│  │  │  │          │  EditorsSplitters    │          ││   │   │ │
│  │  │  │ [icon]×N │  (二叉树分屏)        │ [icon]×N ││   │   │ │
│  │  │  │          │  EditorWindow×N      │          ││   │   │ │
│  │  │  ├──────────┴──────────────────────┴──────────┤│   │   │ │
│  │  │  │  BottomStripe + Content                     ││   │   │ │
│  │  │  │  NavBar (面包屑)                            ││   │   │ │
│  │  │  │  StatusBar                                  ││   │   │ │
│  │  │  └─────────────────────────────────────────────┘│   │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │  ActionManager   │    │ IdeFocusManager  │               │
│  │  (action树+      │    │ (per-project     │               │
│  │   keymap映射)    │    │  焦点跟踪+跳转)  │               │
│  └──────────────────┘    └──────────────────┘               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  UISettings / LayoutRestorer                         │   │
│  │  (布局序列化 → workspace.xml / 恢复时懒创建组件)    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

机制对照:
  ┌─────────────────────┬──────────────────────────────────────┐
  │ 机制                │ 一句话                               │
  ├─────────────────────┼──────────────────────────────────────┤
  │ 组件树              │ 单一 JFrame, 所有内容都是 JComponent │
  │ Stripe + Decorator  │ 按钮与内容分离, 按模式挂载到不同位置 │
  │ Splitter 二叉树     │ 分屏 = 插入节点, 合屏 = 删除节点     │
  │ Glass Pane          │ 全局透明层, 拖拽/遮罩/光标/指示线   │
  │ IdeEventQueue       │ 抢在 Swing 前处理快捷键和 popup      │
  │ LayeredPane         │ Z轴5层: default/palette/popup/drag/modal│
  │ FocusManager        │ per-project 焦点跟踪, Escape 回跳    │
  │ UISettings          │ 布局 XML 序列化, 懒恢复              │
  │ Action 系统         │ update 高频轻量, context 从组件树收集│
  │ Content 管理        │ TW 内部 tab 系统, 标题栏可定制       │
  │ Resize              │ GlassPane 接管事件, 实时调整 Splitter│
  │ Compact Mode        │ 每个组件独立三套间距参数             │
  └─────────────────────┴──────────────────────────────────────┘
```
