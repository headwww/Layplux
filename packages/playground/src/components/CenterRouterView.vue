<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="center-router-view">
    111
    <RouterView />
  </div>
</template>

<style scoped lang="scss">
.center-router-view {
  height: 100%;
  overflow: auto;
}
</style>
