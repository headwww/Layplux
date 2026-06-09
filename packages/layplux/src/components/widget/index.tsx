import { defineComponent, Fragment, ref, type PropType } from 'vue';
import type { IWidget } from '../../managers';
import { TitleView } from '../title';
import { Tooltip } from '../tooltip';

export const WidgetView = defineComponent({
  name: 'WidgetView',
  inheritAttrs: false,
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
  inheritAttrs: false,
  props: {
    widget: Object as PropType<IWidget>,
  },

  setup(props) {
    const tooltipVisible = ref(false);

    const handleClick = () => {
      tooltipVisible.value = false;
      props.widget?.container?.toggleActive(props.widget?.name);
    };

    return () => {
      const { widget } = props;
      const tooltipTitle = (widget?.config.props?.title as string) ?? widget?.name ?? '';

      return (
        <div class="widget-title-view">
          <Tooltip
            visible={tooltipVisible.value}
            onUpdate:visible={(v: boolean) => {
              tooltipVisible.value = v;
            }}
            title={tooltipTitle}
            placement="right"
            mouseEnterDelay={500}
            getContainer={() => document.querySelector('.layplux-root') || document.body}
          >
            <TitleView
              onClick={handleClick}
              focused={widget?.focused.value}
              state={widget?.active.value ? 'active' : 'idle'}
              icon={widget?.config.props?.icon}
              title={widget?.config.props?.title}
            />
          </Tooltip>
        </div>
      );
    };
  },
});
