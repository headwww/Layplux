import type { App } from 'vue';
import { defineComponent } from 'vue';
import { RootPane } from './root-pane';

const Layplux = defineComponent({
  name: 'Layplux',
  setup() {
    return () => <RootPane>Layplux</RootPane>;
  },
});

export default Object.assign(Layplux, {
  install: (app: App) => {
    app.component('Layplux', Layplux);
    return app;
  },
});
