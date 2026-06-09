import { defineComponent, provide, type PropType } from 'vue';
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
    provide('layplux-locale', props.skeleton?.locale);
    return () => (
      <div class="layplux-root">
        <CornerGlow />
        <LayeredManager skeleton={props.skeleton} />
        <GlassOverlay />
      </div>
    );
  },
});
