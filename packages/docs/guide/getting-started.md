# 快速开始

## 安装

```bash
pnpm add layplux
```

## 引入样式

```ts
// 推荐：引入 SCSS 源文件，可访问所有变量和 mixin
import 'layplux/scss';

// 或者引入编译好的 CSS
import 'layplux/scss';
```

::: tip SCSS 用户
直接 `import 'layplux/scss'` 即可在你的 SCSS 中使用 Layplux 的变量和 mixin：

```scss
@use 'layplux/scss' as layplux;
```

:::

## 最小示例

```ts
import { useSkeleton } from 'layplux';
import { h } from 'vue';

const skeleton = useSkeleton();

// 添加一个面板
skeleton.add({
  name: 'hello',
  type: 'panel',
  area: 'leftTopArea',
  content: h('div', 'Hello Layplux!'),
});
```

```vue
<template>
  <div style="width:100%;height:100vh">
    <Layplux :skeleton="skeleton" />
  </div>
</template>

<script setup>
import { Layplux } from 'layplux';
</script>
```

## 下一步

- [核心概念](/guide/core-concepts) — 理解 Skeleton / Widget / Panel / Area
- [Skeleton API](/api/skeleton) — 完整 API 参考
