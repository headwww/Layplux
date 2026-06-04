import type { App, PropType } from 'vue';
import { defineComponent } from 'vue';
import { RootPane } from './root-pane';
import type { ISkeleton } from '../managers';

const Layplux = defineComponent({
  name: 'Layplux',
  props: {
    skeleton: Object as PropType<ISkeleton>,
  },
  setup(props) {
    return () => <RootPane skeleton={props.skeleton}>Layplux</RootPane>;
  },
});

export default Object.assign(Layplux, {
  install: (app: App) => {
    app.component('Layplux', Layplux);
    return app;
  },
});
