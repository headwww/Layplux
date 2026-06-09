import { createApp, type Component } from 'vue';
import App from './App.vue';
import { router } from './router';
// oxlint-disable-next-line import/no-unassigned-import
import 'layplux/scss';
// oxlint-disable-next-line import/no-unassigned-import
import './reset.scss';

const app = createApp(App as Component);
app.use(router);
app.mount('#app');
