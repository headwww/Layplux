import { build } from 'esbuild';
import { glob } from 'glob';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, '../../packages/layplux');
const srcDir = resolve(pkgRoot, 'src');

export async function buildCjs() {
  const files = await glob('src/**/*.{ts,tsx}', {
    cwd: pkgRoot,
    ignore: ['**/__tests__/**', '**/*.test.ts'],
  });

  await build({
    entryPoints: files.map((f) => resolve(pkgRoot, f)),
    outdir: resolve(pkgRoot, 'dist/cjs'),
    outbase: srcDir,
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
    jsx: 'automatic',
    jsxImportSource: 'vue',
    bundle: false,
    platform: 'browser',
    target: 'es2020',
  });
}
