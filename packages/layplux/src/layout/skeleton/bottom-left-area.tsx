import { defineComponent, type PropType } from 'vue';
import type { IArea, IWidget } from '../../managers';
import type { PanelWidgetConfig } from '../../types';

export const BottomLeftArea = defineComponent({
  name: 'BottomLeftArea',
  props: {
    area: Object as PropType<IArea<PanelWidgetConfig, IWidget>>,
  },
  setup(props) {
    return () => {
      const items = props.area?.container.items.value;
      if (!items || items.length === 0) return null;

      return (
        <div class="layplux-bottom-left-area">
          {items
            .slice()
            .toSorted((a, b) => {
              const i1 = a.config?.index ?? 0;
              const i2 = b.config?.index ?? 0;
              return i1 === i2 ? 0 : i1 > i2 ? 1 : -1;
            })
            .map((widget) => widget.renderTitle())}
        </div>
      );
    };
  },
});
