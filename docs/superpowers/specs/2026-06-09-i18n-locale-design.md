# 国际化 (i18n) 方案设计

> 通过 provide/inject 下发 locale 对象，零依赖，内置中英文，支持自定义扩展。

## 目标

- PanelView 等组件中的硬编码中文替换为国际化文案
- 不依赖第三方 i18n 库（零依赖方案）
- 内置 `zh-CN`（默认）和 `en-US` 两个语言包
- 支持用户自定义或覆盖任意字段
- 可桥接 vue-i18n（用户在外部 watch 联动即可）

## 架构

```
ISkeleton.locale (Ref<LaypluxLocale>)
       │
  RootPane: provide('layplux-locale', locale)
       │
  PanelView / 其他组件: inject('layplux-locale')
       │
  locale.value.panel.viewMode → 渲染对应语言文案
```

## Locale 接口

```ts
export interface LaypluxLocale {
  panel: {
    viewMode: string;
    dockPinned: string;
    dockUnpinned: string;
    undock: string;
    help: string;
    more: string;
    minimize: string;
  };
}
```

后续扩展其他模块（dialog、interaction 等）时追加字段。

## 内置语言包

项目提供两个语言包文件：

```
src/locales/
  zh-CN.ts    # 中文（默认）
  en-US.ts    # 英文
  index.ts    # getBuiltInLocale(name: string): LaypluxLocale
```

后续用户可 PR 贡献其他语种（ja、ko 等）。

## 改动文件

### 1. types/locale.ts（新建）

定义 `LaypluxLocale` 接口。

### 2. locales/zh-CN.ts、en-US.ts、index.ts（新建）

语言包数据 + `getBuiltInLocale()` 工厂函数。

### 3. managers/skeleton.ts

- `ISkeleton` 新增 `locale: Ref<LaypluxLocale>` 和 `setLocale(name: string)`
- `useSkeleton` 中初始化 `locale`，默认 `zh-CN`

### 4. layout/root-pane.tsx

- `provide('layplux-locale', skeleton.locale)`

### 5. components/panel-view/index.tsx

- `inject('layplux-locale')` 获取 locale，缺失时 fallback 为 `getBuiltInLocale('zh-CN')`
- 替换所有硬编码中文为 `locale.value.panel.xxx`

### 6. utils/index.ts

- 导出 locale 相关类型和函数

## 用户使用

```ts
const sk = useSkeleton();

// 切换语言
sk.setLocale('en-US');

// 自定义/覆盖
sk.locale.value = {
  ...sk.locale.value,
  panel: { ...sk.locale.value.panel, minimize: 'Collapse' },
};
```

## 不在此范围

- 组件库外层的应用级国际化
- 与 vue-i18n 的自动桥接
- 日期/数字格式化
- RTL 支持
