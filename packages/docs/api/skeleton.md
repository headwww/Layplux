# ISkeleton API

ISkeleton 是 Layplux 的核心接口，管理所有区域和 Widget。

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
