import { defineComponent, type PropType } from 'vue';
import { LayeredManager } from './layered-manager';
import { GlassOverlay } from './glass-overlay';
import { CornerGlow } from '../components';
import type { ISkeleton } from '../managers';

export const RootPane = defineComponent({
  name: 'RootPane',
  props: {
    skeleton: Object as PropType<ISkeleton>,
  },
  setup(props) {
    return () => (
      <div class="layplux-root" data-theme="pink">
        <CornerGlow />
        <LayeredManager skeleton={props.skeleton} />
        <GlassOverlay />
      </div>
    );
  },
});
