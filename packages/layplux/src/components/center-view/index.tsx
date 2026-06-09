import { defineComponent, Teleport, type PropType } from 'vue';
import type { IWidget } from '../../managers';

export const CenterView = defineComponent({
  name: 'CenterView',
  props: {
    widget: Object as PropType<IWidget>,
    anchor: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => {
      if (!props.widget) return null;
      return (
        <Teleport defer to={props.anchor}>
          {props.widget.renderContent()}
        </Teleport>
      );
    };
  },
});
