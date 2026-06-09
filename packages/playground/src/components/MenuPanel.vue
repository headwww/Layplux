<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { HomeOutlined, CodeOutlined, SettingOutlined } from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();

const menus = [
  { path: '/', name: '首页', icon: HomeOutlined },
  { path: '/editor', name: '编辑器', icon: CodeOutlined },
  { path: '/settings', name: '设置', icon: SettingOutlined },
];

function navigate(path: string) {
  void router.push(path);
}
</script>

<template>
  <div class="menu-panel">
    <div
      v-for="m in menus"
      :key="m.path"
      class="menu-item"
      :class="{ 'menu-item--active': route.path === m.path }"
      @click="navigate(m.path)"
    >
      <component
        :is="m.icon"
        class="menu-item__icon"
      />
      <span>{{ m.name }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.menu-panel {
  padding: 8px;
}

.menu-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
  color: hsl(var(--layplux-foreground));
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
}

.menu-item:hover {
  background: hsl(var(--layplux-hover));
}

.menu-item--active {
  color: hsl(var(--layplux-primary));
  background: hsl(var(--layplux-primary) / 15%);
}

.menu-item__icon {
  flex-shrink: 0;
  font-size: 16px;
}
</style>
