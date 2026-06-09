<script setup lang="ts">
import {
  ThunderboltOutlined, ExperimentOutlined, ControlOutlined,
  AimOutlined, TabletOutlined,
} from '@ant-design/icons-vue';

const items = [
  { name: 'useSkeleton()', file: 'managers/skeleton.ts', icon: ThunderboltOutlined, c: '#e5c07b' },
  { name: 'createPluginEventBus', file: 'utils/event-bus.ts', icon: ExperimentOutlined, c: '#61afef' },
  { name: 'PanelView', file: 'components/panel-view/index.tsx', icon: ControlOutlined, c: '#c678dd' },
  { name: 'IWidget', file: 'managers/widget.ts', icon: AimOutlined, c: '#98c379' },
  { name: 'useWidgetContainer', file: 'managers/widget-container.ts', icon: TabletOutlined, c: '#e06c75' },
];
</script>

<template>
  <div class="panel-content ide-panel">
    <div style="padding:4px 8px;margin-top:4px;font-size:11px;font-weight:600;color:hsl(var(--layplux-muted-foreground));text-transform:uppercase">
      Favorites
    </div>
    <div
      v-for="item in items"
      :key="item.name"
      class="ide-hover"
      style="display:flex;gap:6px;align-items:center;padding:3px 8px;font-size:12px;cursor:pointer;border-radius:3px"
    >
      <component
        :is="item.icon"
        :style="{ color: item.c }"
      />
      <span>{{ item.name }}</span>
      <span style="margin-left:auto;font-size:10px;color:hsl(var(--layplux-muted-foreground))">{{ item.file }}</span>
    </div>
  </div>
</template>
