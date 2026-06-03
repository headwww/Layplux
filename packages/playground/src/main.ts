/*
 * @Author: shuwen 1243889238@qq.com
 * @Date: 2026-05-27 01:14:56
 * @LastEditors: shuwen 1243889238@qq.com
 * @LastEditTime: 2026-06-03 09:30:26
 * @FilePath: /Layplux/packages/playground/src/main.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createApp, type Component } from 'vue';
import App from './App.vue';
// oxlint-disable-next-line import/no-unassigned-import
import 'layplux/scss';
// oxlint-disable-next-line import/no-unassigned-import
import './reset.scss';

const app = createApp(App as Component);
app.mount('#app');
