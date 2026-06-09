<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{ event: any }>();

const msgs = ref<Array<{ text: string; time: string }>>([]);
const count = ref(0);

function addMsg(text: string) {
  msgs.value = [{ text, time: new Date().toLocaleTimeString() }, ...msgs.value.slice(0, 49)];
}

onMounted(() => {
  props.event?.onGlobal('widget:*:focus', (p: any) => addMsg(`[focus] ${p.widget.name}`));
  props.event?.onGlobal('widget:*:blur', (p: any) => addMsg(`[blur] ${p.widget.name}`));
  props.event?.onGlobal('widget:*:view-mode-changed', (p: any) => addMsg(`[mode] ${p.widget.name} → ${p.mode}`));
  props.event?.onGlobal('panel:*:menu-click', (p: any) => addMsg(`[menu] ${p.widget.name} → ${p.key}`));
  props.event?.onGlobal('panel:*:minimize', (p: any) => addMsg(`[minimize] ${p.widget.name}`));
  props.event?.onGlobal('custom:debug', (p: any) => addMsg(`[custom] cross-panel → count=${p.count}`));
});

function sendEvent() {
  count.value++;
  props.event?.emitGlobal('custom:debug', { count: count.value });
}
</script>

<template>
  <div class="panel-content ide-panel">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px;border-bottom:1px solid hsl(var(--layplux-border))">
      <span style="font-size:12px;font-weight:600;color:#e5c07b">⚡ Event Debug</span>
      <button
        class="ide-btn"
        style="padding:2px 8px;font-size:11px"
        @click="sendEvent"
      >
        Send ({{ count }})
      </button>
    </div>
    <div style="max-height:calc(100% - 40px);padding:4px 0;overflow-y:auto">
      <div
        v-if="msgs.length === 0"
        style="padding:12px;font-size:11px;color:hsl(var(--layplux-muted-foreground))"
      >
        Waiting for events...
      </div>
      <div
        v-for="(m, i) in msgs"
        :key="i"
        style="padding:2px 8px;font-family:monospace;font-size:10px;border-bottom:1px solid hsl(var(--layplux-border))"
      >
        <span style="margin-right:8px;color:hsl(var(--layplux-muted-foreground))">{{ m.time }}</span>
        {{ m.text }}
      </div>
    </div>
  </div>
</template>
