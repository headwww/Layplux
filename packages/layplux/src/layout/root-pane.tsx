import { computed, defineComponent, provide, type PropType } from 'vue';
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

    const rootClass = computed(() => {
      const dark = props.skeleton?.isDark();
      return ['layplux-root', dark ? 'dark' : ''].filter(Boolean);
    });

    return () => (
      <div class={rootClass.value}>
        <CornerGlow />
        <LayeredManager skeleton={props.skeleton} />
        <GlassOverlay />
      </div>
    );
  },
});
