import { readFileSync, statSync, writeFileSync } from 'fs';
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

export async function buildEsm() {
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
    dir: resolve(pkgRoot, 'dist/esm'),
    format: 'esm',
    entryFileNames: '[name].mjs',
    preserveModules: true,
    preserveModulesRoot: resolve(pkgRoot, 'src'),
  });

  await bundle.close();

  // Post-process: ensure bare relative imports have .mjs extension
  const mjsFiles = await glob('dist/esm/**/*.mjs', { cwd: pkgRoot });
  for (const rel of mjsFiles) {
    const file = resolve(pkgRoot, rel);
    let content = readFileSync(file, 'utf-8');
    content = content.replace(/from\s+['"](\.[^'"]+)['"]/g, (match, importPath) => {
      if (/\.[a-z]+$/i.test(importPath)) return match;
      const absPath = resolve(dirname(file), importPath);
      try {
        if (statSync(absPath).isDirectory()) {
          return match.replace(importPath, importPath + '/index.mjs');
        }
      } catch {
        /* path doesn't exist */
      }
      return match.replace(importPath, importPath + '.mjs');
    });
    writeFileSync(file, content, 'utf-8');
  }
}
