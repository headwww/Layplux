import { defineComponent, type PropType, type VNode } from 'vue';
import { createContent } from '../../utils';
import { Popup } from '../popup';

type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export const Tooltip = defineComponent({
  name: 'LaypluxTooltip',
  props: {
    title: [String, Object, Function] as PropType<string | VNode>,
    trigger: { type: String as PropType<'hover' | 'click' | 'focus'>, default: 'hover' },
    placement: { type: String as PropType<Placement>, default: 'top' },
    mouseEnterDelay: { type: Number, default: 100 },
    mouseLeaveDelay: { type: Number, default: 100 },
    visible: Boolean,
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:visible'],
  setup(props, { emit, slots }) {
    return () => (
      <Popup
        visible={props.visible}
        trigger={props.trigger}
        placement={props.placement}
        disabled={props.disabled}
        mouseEnterDelay={props.mouseEnterDelay}
        mouseLeaveDelay={props.mouseLeaveDelay}
        offset={{ y: 8 }}
        destroyOnClose={true}
        onUpdate:visible={(v: boolean) => emit('update:visible', v)}
      >
        {{
          default: () => slots.default?.(),
          content: () => {
            const hasContent = slots.content;
            const titleNode = hasContent ? slots.content?.() : createContent(props.title);

            return (
              <div class="layplux-tooltip">
                <div class="layplux-tooltip__arrow" />
                <div class="layplux-tooltip__inner">{titleNode}</div>
              </div>
            );
          },
        }}
      </Popup>
    );
  },
});
