<script setup lang="ts">
import { onMounted } from 'vue';
import { laypluxPlugins } from './src';

onMounted(async () => {
  await laypluxPlugins.init();
});
</script>

<template>
  <div class="layplux-app">
    <div class="layplux-workspace">
      <!-- 窗口框架渲染区，后续由 Skeleton 接管 -->
    </div>
  </div>
</template>

<style scoped>
.layplux-app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.layplux-workspace {
  width: 100%;
  height: 100%;
}
</style>
