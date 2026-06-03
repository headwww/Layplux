import { defineComponent, Fragment, type PropType } from 'vue';
import type { IWidget } from '../../managers';
import { TitleView } from '../title';

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

export const WidgetTitleView = defineComponent({
  name: 'WidgetTitleView',
  props: {
    widget: Object as PropType<IWidget>,
  },
  setup(props) {
    return () => {
      const { widget } = props;

      return (
        <div class="widget-title-view">
          <TitleView icon={widget?.config.props?.icon} title={widget?.config.props?.title} />
        </div>
      );
    };
  },
});
