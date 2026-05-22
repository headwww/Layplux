import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    // port: 9099,
    port: 9098,
    open: true, // 自动打开浏览器
  },
});
