<script setup lang="ts">
import {
  FolderOutlined,
  SearchOutlined,
  BgColorsOutlined,
  GlobalOutlined,
} from '@ant-design/icons-vue';

const cards = [
  { icon: FolderOutlined, title: '项目浏览器', desc: '通过左侧面板浏览和管理项目文件' },
  { icon: SearchOutlined, title: '快速搜索', desc: '使用 Ctrl+P 快速搜索项目中的文件' },
  { icon: BgColorsOutlined, title: '主题系统', desc: '在亮色、暗色和自定义主题之间切换' },
  { icon: GlobalOutlined, title: '国际化', desc: '内置中英文国际化支持' },
];
</script>

<template>
  <div class="page-welcome">
    <div class="welcome-hero">
      <h1>欢迎使用 Layplux</h1>
      <p>灵活的 IDE 风格布局框架 for Vue 3</p>
    </div>
    <div class="welcome-grid">
      <div
        v-for="card in cards"
        :key="card.title"
        class="welcome-card"
      >
        <component
          :is="card.icon"
          class="welcome-card__icon"
        />
        <h3>{{ card.title }}</h3>
        <p>{{ card.desc }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-welcome {
  padding: 32px 40px;
  color: hsl(var(--layplux-foreground));
  /* stylelint-disable-next-line order/properties-order */
  height: 100%;
  overflow: auto;
}

.welcome-hero {
  margin-bottom: 32px;
}

.welcome-hero h1 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
}

.welcome-hero p {
  margin: 0;
  font-size: 14px;
  color: hsl(var(--layplux-muted-foreground));
}

.welcome-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.welcome-card {
  padding: 20px;
  border: 1px solid hsl(var(--layplux-border));
  border-radius: 8px;
  /* stylelint-disable-next-line order/properties-order */
  background: hsl(var(--layplux-accent));
}

.welcome-card__icon {
  font-size: 24px;
}

.welcome-card h3 {
  margin: 8px 0 4px;
  font-size: 14px;
  font-weight: 600;
}

.welcome-card p {
  margin: 0;
  font-size: 12px;
  color: hsl(var(--layplux-muted-foreground));
  /* stylelint-disable-next-line order/properties-order */
  line-height: 1.5;
}
</style>
