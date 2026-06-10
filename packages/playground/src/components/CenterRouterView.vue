<!--
 * @Author: shuwen 1243889238@qq.com
 * @Date: 2026-06-10 00:21:22
 * @LastEditors: shuwen 1243889238@qq.com
 * @LastEditTime: 2026-06-10 11:16:37
 * @FilePath: /Layplux/packages/playground/src/components/CenterRouterView.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="center-router-view">
    <RouterView />
  </div>
</template>

<style scoped lang="scss">
.center-router-view {
  height: 100%;
  overflow: auto;
}
</style>
