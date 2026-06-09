<script setup lang="ts">
import { ref, computed } from 'vue';

const content = ref(`// 编辑器页面 - 开始编写代码
import { defineComponent, ref } from 'vue';
import { useSkeleton } from '../../layplux/src/managers';

export default defineComponent({
  name: '我的组件',
  setup() {
    const count = ref(0);

    function increment() {
      count.value++;
    }

    return () => (
      <div class="my-component">
        <h1>你好 Layplux!</h1>
        <button onClick={increment}>
          计数: {count.value}
        </button>
      </div>
    );
  },
});`);

const lines = computed(() => content.value.split('\n'));
</script>

<template>
  <div class="page-editor">
    <div class="editor-tabs">
      <span class="editor-tab editor-tab--active">MyComponent.tsx</span>
      <span class="editor-tab">工具函数.ts</span>
    </div>
    <div class="editor-body">
      <div class="editor-gutter">
        <span
          v-for="(_, i) in lines"
          :key="i"
          class="editor-gutter__ln"
        >{{ i + 1 }}</span>
      </div>
      <pre class="editor-code"><code>{{ content }}</code></pre>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: hsl(var(--layplux-background));
}

.editor-tabs {
  display: flex;
  flex-shrink: 0;
  gap: 0;
  padding: 0 12px;
  background: hsl(var(--layplux-accent));
  border-bottom: 1px solid hsl(var(--layplux-border));
}

.editor-tab {
  padding: 6px 16px;
  font-size: 12px;
  color: hsl(var(--layplux-muted-foreground));
  cursor: pointer;
  border-right: 1px solid hsl(var(--layplux-border));
}

.editor-tab--active {
  color: hsl(var(--layplux-foreground));
  background: hsl(var(--layplux-background));
  border-bottom: 2px solid hsl(var(--layplux-primary));
}

.editor-body {
  display: flex;
  flex: 1;
  overflow: auto;
}

.editor-gutter {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  padding: 12px 0;
  user-select: none;
  background: hsl(var(--layplux-accent));
  border-right: 1px solid hsl(var(--layplux-border));
}

.editor-gutter__ln {
  min-width: 40px;
  padding: 0 16px 0 8px;
  font-size: 12px;
  line-height: 20px;
  color: hsl(var(--layplux-muted-foreground));
  text-align: right;
}

.editor-code {
  flex: 1;
  padding: 12px 16px;
  margin: 0;
  overflow: auto;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 20px;
  color: hsl(var(--layplux-foreground));
  white-space: pre;
}
</style>
