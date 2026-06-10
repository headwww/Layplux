import { statSync, readFileSync, writeFileSync } from 'fs';
import { build } from 'esbuild';
import { glob } from 'glob';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, '../../packages/layplux');
const srcDir = resolve(pkgRoot, 'src');

export async function buildEsm() {
  const files = await glob('src/**/*.{ts,tsx}', {
    cwd: pkgRoot,
    ignore: ['**/__tests__/**', '**/*.test.ts'],
  });

  await build({
    entryPoints: files.map((f) => resolve(pkgRoot, f)),
    outdir: resolve(pkgRoot, 'dist/esm'),
    outbase: srcDir,
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    jsx: 'automatic',
    jsxImportSource: 'vue',
    bundle: false,
    platform: 'browser',
    target: 'es2020',
  });

  // Post-process: add .mjs extension to bare relative imports.
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
      } catch {}
      return match.replace(importPath, importPath + '.mjs');
    });
    writeFileSync(file, content, 'utf-8');
  }
}
