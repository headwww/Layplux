<script setup lang="ts">
const lines = [
  { n: 1, code: "import { defineComponent, ref } from 'vue';", hl: 'keyword' },
  { n: 2, code: "import { useSkeleton } from '../../layplux/src/managers';", hl: 'string' },
  { n: 3, code: '' },
  { n: 4, code: 'export default defineComponent({', hl: 'keyword' },
  { n: 5, code: "  name: '我的组件',", hl: 'string' },
  { n: 6, code: '  props: { event: Object },', hl: '' },
  { n: 7, code: '  setup(props) {', hl: 'keyword' },
  { n: 8, code: "    const count = ref(0);", hl: '' },
  { n: 9, code: "    props.event.emitGlobal('data:updated', { count });", hl: '' },
  { n: 10, code: '    return () => h("div", "你好");', hl: 'keyword' },
  { n: 11, code: '  },', hl: '' },
  { n: 12, code: '});', hl: '' },
];

function getColor(hl: string) {
  if (hl === 'keyword') return '#c678dd';
  if (hl === 'string') return '#98c379';
  return '#abb2bf';
}
</script>

<template>
  <div
    class="panel-content"
    style="overflow:auto;font-family:'JetBrains Mono',monospace"
  >
    <div style="display:flex;gap:8px;padding:12px 16px;border-bottom:1px solid hsl(var(--layplux-border))">
      <span style="padding:2px 8px;font-size:11px;color:#e06c75;background:rgb(224 108 117 / 15%);border-radius:3px">MyWidget.tsx</span>
      <span style="font-size:11px;color:hsl(var(--layplux-muted-foreground))">packages/layplux/src/components</span>
    </div>
    <div
      v-for="l in lines"
      :key="l.n"
      style="display:flex;height:22px;padding-left:8px;line-height:22px"
    >
      <span style="flex-shrink:0;width:36px;padding-right:12px;font-size:11px;color:#4b5263;text-align:right;user-select:none">{{ l.n }}</span>
      <span :style="{ fontSize: '12px', color: getColor(l.hl), flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">{{ l.code }}</span>
    </div>
  </div>
</template>
