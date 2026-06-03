import { defineComponent, type PropType } from 'vue';
import type { IArea, IWidget } from '../../managers';
import type { PanelWidgetConfig } from '../../types';

export const RightBottomArea = defineComponent({
  name: 'RightBottomArea',
  props: {
    area: Object as PropType<IArea<PanelWidgetConfig, IWidget>>,
  },
  setup(props) {
    return () => {
      const items = props.area?.container.items.value;
      if (!items || items.length === 0) return null;

      return (
        <div class="layplux-right-bottom-area">
          {items
            .slice()
            .toSorted((a, b) => (a.config?.index ?? 0) - (b.config?.index ?? 0))
            .map((widget) => widget.renderTitle())}
        </div>
      );
    };
  },
});
