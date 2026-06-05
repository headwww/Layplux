import { defineComponent } from 'vue';

export const PanelView = defineComponent({
  name: 'PanelView',
  props: {
    title: String,
  },
  setup(props) {
    return () => <div class="layplux-panel">{props.title}</div>;
  },
});
