# 主题系统

Layplux 的主题系统有两个独立维度：亮暗模式 + 主题色。

## 亮暗模式

```ts
skeleton.setTheme('dark')  // 'light' | 'dark' | 'system'
```

- `light`：浅色模式
- `dark`：暗色模式
- `system`：跟随系统（监听 `prefers-color-scheme`）

## 主题色

通过 `data-theme` 属性切换主题色：

```ts
skeleton.setThemeName('blue')
```

渲染为 `<div class="layplux-root" data-theme="blue">`。

## 自定义主题色

### JS 方式

```ts
skeleton.registerTheme('ocean', {
  '--layplux-primary': '200 80% 50%',
  '--layplux-accent': '200 5% 20%',
  '--layplux-border': '200 10% 30%',
})
skeleton.setThemeName('ocean')
```

### CSS 方式

```css
.layplux-root[data-theme='ocean'] {
  --layplux-primary: 200 80% 50%;
}

.layplux-root.dark[data-theme='ocean'] {
  --layplux-primary: 200 80% 60%;
}
```

## CSS 变量参考

| 变量 | 用途 |
|------|------|
| `--layplux-background` | 主背景色 |
| `--layplux-foreground` | 主文字色 |
| `--layplux-primary` | 主色调 |
| `--layplux-accent` | 强调色 |
| `--layplux-border` | 边框色 |
| `--layplux-hover` | 悬停色 |
| `--layplux-muted` | 弱化背景 |
| `--layplux-muted-foreground` | 弱化文字 |
| `--layplux-radius` | 圆角 |
