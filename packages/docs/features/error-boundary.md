# 错误边界

每个 Widget 的渲染是独立的——一个 Widget 崩溃不会影响其他面板，整个骨架不会白屏。

## 工作原理

`WidgetView` 组件内部通过 Vue 的 `onErrorCaptured` 捕获 `renderBody()` 抛出的错误：

- 错误被捕获后，只替换该 Widget 的渲染区域
- 其他面板（左侧、右侧、底部、中心区域）继续正常工作
- 错误信息输出到 `console.error`，方便调试
- 返回 `false` 阻止错误向上冒泡到根组件

## 默认行为

Widget 崩溃时显示内联错误提示：

```
组件 "explorer" 发生错误
TypeError: Cannot read properties of undefined (reading 'name')
```

## 自定义错误 UI

通过 `props.errorFallback` 指定崩溃时的替代组件：

```ts
import { defineComponent, h } from 'vue'

const MyErrorUI = defineComponent({
  props: { error: String, widget: Object },
  setup(props) {
    return () => h('div', { style: { padding: '16px', color: 'red' } }, [
      h('strong', `面板 "${props.widget.name}" 加载失败`),
      h('p', props.error),
      h('button', { onClick: () => location.reload() }, '刷新重试'),
    ])
  },
})

skeleton.add({
  name: 'critical-editor',
  type: 'panel',
  area: 'centerArea',
  content: h(MyEditor),
  props: {
    errorFallback: MyErrorUI,
  },
})
```

## 注意事项

- 错误边界只捕获**子组件渲染期间**抛出的错误，不捕获事件处理、异步回调中的错误
- Widget 崩溃后不自动恢复——通常是代码 bug，需要修复源码
- 自定义 `errorFallback` 可自行实现重试逻辑（如重新挂载组件）
