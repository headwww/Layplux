import { defineComponent } from 'vue';

export const PanelView = defineComponent({
  name: 'PanelView',
  props: {
    title: String,
  },
  setup() {
    return () => <div class="layplux-panel"></div>;
  },
});
