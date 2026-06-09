# VitePress 技术文档站点设计

> 在 `packages/docs` 新建 VitePress 项目，为 Layplux 提供技术文档。

## 目标

- 提供完整的 Layplux 使用文档（快速开始、API、组件、特性）
- 部署为静态站点，可托管到 GitHub Pages / 自有域名
- 中英双语支持（先做中文，后续加 i18n）

## 项目结构

```
packages/docs/
  package.json              # 依赖 vitepress
  .vitepress/
    config.ts               # 侧边栏、导航、主题配置
  index.md                  # 首页 Hero
  guide/
    getting-started.md       # 安装、最小示例
    core-concepts.md         # Skeleton/Widget/Panel/Area 概念
  api/
    skeleton.md              # ISkeleton API
    widget.md                # IWidget API
    pane.md                  # IPane API
  components/
    panel-view.md            # PanelView 组件
    dropdown.md              # Dropdown 系列
    tooltip-popup.md         # Tooltip & Popup
  features/
    theme.md                 # 亮暗切换 + 主题色
    i18n.md                  # 国际化
    events.md                # 事件系统
  architecture.md            # 架构设计
  plugin.md                  # 插件系统（预留）
```

## 导航结构

- 指南：快速开始 / 核心概念
- API：Skeleton / Widget / Pane
- 组件：PanelView / Dropdown / Tooltip & Popup
- 特性：主题 / 国际化 / 事件
- 架构
- 插件（WIP）

## 首页

Hero 区域：标题 Layplux、副标题、快速开始按钮 + GitHub 链接
Features 区域：布局管理、主题系统、事件总线、国际化

## 技术栈

- VitePress v1.x
- pnpm workspace 依赖 layplux（playground 本地引用）

## 不在此范围

- 英文版本文档（后续）
- 文档搜索集成（后续）
- GitHub Pages 部署（后续 CI）
