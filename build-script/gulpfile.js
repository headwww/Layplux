import { task, series, parallel } from 'gulp';
import { rm } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, '../packages/layplux');

import { buildEsm } from './scripts/esm.mjs';
import { buildCjs } from './scripts/cjs.mjs';
import { buildUmd } from './scripts/umd.mjs';
import { buildStyle, copyScss } from './scripts/style.mjs';
import { buildTypes } from './scripts/types.mjs';

async function clean() {
  await rm(resolve(pkgRoot, 'dist'), { recursive: true, force: true });
}

task('clean', clean);
task('build-esm', buildEsm);
task('build-cjs', buildCjs);
task('build-umd', buildUmd);
task('build-style', buildStyle);
task('copy-scss', copyScss);
task('build-types', buildTypes);

task(
  'build',
  series(
    clean,
    parallel('build-esm', 'build-cjs', 'build-umd', 'build-style', 'copy-scss', 'build-types'),
  ),
);
