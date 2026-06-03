import { defineComponent } from 'vue';
import { LayeredManager } from './layered-manager';
import { GlassOverlay } from './glass-overlay';
import { CornerGlow } from '../components';

export const RootPane = defineComponent({
  name: 'RootPane',
  setup() {
    return () => (
      <div class="layplux-root" data-theme="pink">
        <CornerGlow />
        <LayeredManager />
        <GlassOverlay />
      </div>
    );
  },
});
