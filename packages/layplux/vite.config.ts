import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue(), vueJsx()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Layplux',
      formats: ['es', 'umd'],
      fileName: (format) => `layplux.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', 'eventemitter2'],
      output: {
        globals: {
          vue: 'Vue',
          eventemitter2: 'EventEmitter2',
        },
      },
    },
  },
  test: {
    environment: 'node',
  },
});
