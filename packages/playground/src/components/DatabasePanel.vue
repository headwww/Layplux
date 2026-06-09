<script setup lang="ts">
import { Input } from 'ant-design-vue';
import { ConsoleSqlOutlined } from '@ant-design/icons-vue';

const tables = [
  { name: 'users', rows: '1.2M', cols: 18, color: '#61afef' },
  { name: 'orders', rows: '856K', cols: 24, color: '#e5c07b' },
  { name: 'products', rows: '42K', cols: 12, color: '#98c379' },
  { name: 'categories', rows: '128', cols: 6, color: '#c678dd' },
  { name: 'reviews', rows: '2.1M', cols: 10, color: '#e06c75' },
  { name: 'payments', rows: '980K', cols: 16, color: '#56b6c2' },
];
</script>

<template>
  <div class="panel-content ide-panel">
    <Input
      placeholder="SQL query..."
      size="small"
    >
      <template #prefix>
        <ConsoleSqlOutlined />
      </template>
    </Input>
    <div style="padding:4px 8px;margin-top:4px;font-size:11px;font-weight:600;color:hsl(var(--layplux-muted-foreground));text-transform:uppercase">
      Tables
    </div>
    <div
      v-for="t in tables"
      :key="t.name"
      class="ide-hover"
      style="display:flex;align-items:center;justify-content:space-between;padding:3px 8px;font-size:12px;cursor:pointer;border-radius:3px"
    >
      <span style="display:flex;gap:6px;align-items:center">
        <span :style="{ width:'8px',height:'8px',borderRadius:'50%',background:t.color,display:'inline-block' }" />
        {{ t.name }}
      </span>
      <span style="font-size:10px;color:hsl(var(--layplux-muted-foreground))">{{ t.rows }} · {{ t.cols }} cols</span>
    </div>
  </div>
</template>
