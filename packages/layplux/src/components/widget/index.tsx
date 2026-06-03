import { defineComponent, Fragment, type PropType } from 'vue';
import type { IWidget } from '../../managers';

export const WidgetView = defineComponent({
  name: 'WidgetView',
  props: {
    widget: Object as PropType<IWidget>,
  },
  setup(props) {
    return () => {
      const { widget } = props;
      return <Fragment>{widget?.renderBody()}</Fragment>;
    };
  },
});
