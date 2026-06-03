import { defineComponent } from 'vue';

export const CornerGlow = defineComponent({
  name: 'CornerGlow',
  setup() {
    return () => <div class="corner-glow" />;
  },
});
