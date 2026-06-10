import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import { glob } from 'glob';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, '../../packages/layplux');

const extensions = ['.ts', '.tsx'];

export async function buildCjs() {
  const files = await glob('src/**/*.{ts,tsx}', {
    cwd: pkgRoot,
    ignore: ['**/__tests__/**', '**/*.test.ts'],
  });

  const bundle = await rollup({
    input: files.map((f) => resolve(pkgRoot, f)),
    external: [/^vue/, 'eventemitter2'],
    onwarn(warning, warn) {
      if (warning.code === 'EMPTY_BUNDLE') return;
      warn(warning);
    },
    plugins: [
      nodeResolve({ extensions }),
      commonjs(),
      babel({
        extensions,
        babelHelpers: 'bundled',
      }),
    ],
  });

  await bundle.write({
    dir: resolve(pkgRoot, 'dist/cjs'),
    format: 'cjs',
    entryFileNames: '[name].cjs',
    preserveModules: true,
    preserveModulesRoot: resolve(pkgRoot, 'src'),
    exports: 'named',
  });

  await bundle.close();
}
