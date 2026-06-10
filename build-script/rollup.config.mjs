import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, '../packages/layplux');

export default {
  input: resolve(pkgRoot, 'src/index.ts'),
  external: ['vue'],
  output: {
    file: resolve(pkgRoot, 'dist/umd/index.js'),
    format: 'umd',
    name: 'Layplux',
    globals: { vue: 'Vue' },
    exports: 'named',
  },
  plugins: [
    nodeResolve({ extensions: ['.ts', '.tsx'] }),
    commonjs(),
    babel({
      extensions: ['.ts', '.tsx'],
      babelHelpers: 'bundled',
    }),
  ],
};
