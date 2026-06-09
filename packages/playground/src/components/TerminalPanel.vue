<script setup lang="ts">
const logs = [
  { text: '> pnpm install', color: '#98c379' },
  { text: 'Packages: +186', color: '#56b6c2' },
  { text: 'Done in 3.2s', color: '#abb2bf' },
  { text: '' },
  { text: '> npx vue-tsc --noEmit', color: '#98c379' },
  { text: '✓ Type-check passed (0 errors)', color: '#abb2bf' },
  { text: '' },
  { text: '> vite dev', color: '#98c379' },
  { text: 'VITE v8.0.14  ready in 1124 ms', color: '#56b6c2' },
  { text: '➜  Local:   http://localhost:5173/', color: '#61afef' },
];
</script>

<template>
  <div
    class="panel-content ide-panel"
    style="font-family:'JetBrains Mono',monospace"
  >
    <div style="display:flex;gap:12px;padding:4px 8px;font-size:11px;border-bottom:1px solid hsl(var(--layplux-border))">
      <span style="color:#98c379">● Terminal</span>
      <span style="color:hsl(var(--layplux-muted-foreground))">master</span>
    </div>
    <div style="padding:8px">
      <div
        v-for="(l, i) in logs"
        :key="i"
        :style="{ padding:'1px 0',fontSize:12,color:l.color || 'transparent',lineHeight:'18px' }"
      >
        {{ l.text || '&nbsp;' }}
      </div>
    </div>
  </div>
</template>
