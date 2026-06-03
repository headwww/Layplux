import { defineComponent, type PropType } from 'vue';
import type { InteractionWidgetConfig } from '../../types';
import type { IWidget, IArea } from '../../managers';

export const BottomArea = defineComponent({
  name: 'BottomArea',
  props: {
    area: Object as PropType<IArea<InteractionWidgetConfig, IWidget>>,
  },
  setup(props) {
    return () => {
      const { area } = props;
      const left: any[] = [];
      const center: any[] = [];
      const right: any[] = [];

      area?.container.items.value
        .slice()
        .toSorted((a, b) => {
          const index1 = a.config?.index || 0;
          const index2 = b.config?.index || 0;
          return index1 === index2 ? 0 : index1 > index2 ? 1 : -1;
        })
        .forEach((item) => {
          const content = <div key={`bottom-area-${item.name}`}>{item.renderContent()}</div>;
          if (item.align === 'left') {
            left.push(content);
          } else if (item.align === 'center') {
            center.push(content);
          } else {
            right.push(content);
          }
        });

      return (
        <div class="layplux-bottom-area">
          <div class="layplux-bottom-area__left">{...left}</div>
          <div class="layplux-bottom-area__center">{...center}</div>
          <div class="layplux-bottom-area__right">{...right}</div>
        </div>
      );
    };
  },
});
