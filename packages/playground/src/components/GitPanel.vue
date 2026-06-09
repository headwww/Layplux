<script setup lang="ts">
import { FileTextOutlined } from '@ant-design/icons-vue';

const staged = [
  { file: 'src/managers/skeleton.ts', type: 'M', color: '#e5c07b' },
  { file: 'src/managers/widget.ts', type: 'M', color: '#e5c07b' },
  { file: 'src/components/panel-view/index.tsx', type: 'M', color: '#e5c07b' },
  { file: 'src/types/locale.ts', type: 'A', color: '#98c379' },
  { file: 'src/locales/zh-CN.ts', type: 'A', color: '#98c379' },
  { file: 'src/locales/en-US.ts', type: 'A', color: '#98c379' },
  { file: 'src/locales/index.ts', type: 'A', color: '#98c379' },
];
</script>

<template>
  <div class="panel-content ide-panel">
    <div style="display:flex;justify-content:space-between;padding:8px;font-size:11px;border-bottom:1px solid hsl(var(--layplux-border))">
      <span>Staged Changes</span>
      <span><span style="color:#98c379">7</span> files</span>
    </div>
    <div
      v-for="f in staged"
      :key="f.file"
      class="ide-hover"
      style="display:flex;gap:6px;align-items:center;padding:3px 8px;font-size:12px;cursor:pointer;border-radius:3px"
    >
      <span :style="{ display:'inline-block',padding:'0 5px',fontSize:9,borderRadius:3,background:f.color,color:'#fff',minWidth:18,textAlign:'center',lineHeight:'16px' }">{{ f.type }}</span>
      <FileTextOutlined style="font-size:11px;color:#528bff" />
      <span style="flex:1">{{ f.file }}</span>
    </div>
    <div style="padding:8px;margin-top:8px;font-size:11px">
      <div style="margin-bottom:4px">
        Commit Message
      </div>
      <textarea
        class="ide-textarea"
        placeholder="feat: add theme support"
        style="box-sizing:border-box;width:100%;height:60px;padding:8px;font-size:12px;color:inherit;resize:vertical;background:hsl(var(--layplux-background-deep));border:1px solid hsl(var(--layplux-border));border-radius:4px"
      />
    </div>
  </div>
</template>
