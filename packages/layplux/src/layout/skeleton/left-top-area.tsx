import { defineComponent, type PropType } from 'vue';
import type { IArea, IWidget } from '../../managers';
import type { PanelWidgetConfig } from '../../types';

export const LeftTopArea = defineComponent({
  name: 'LeftTopArea',
  props: {
    area: Object as PropType<IArea<PanelWidgetConfig, IWidget>>,
  },
  setup() {
    return () => {
      return <div class="layplux-left-top-area">LeftTopArea</div>;
    };
  },
});
