import { exec } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, '../../packages/layplux');

export function buildTypes() {
  return new Promise((resolvePromise, reject) => {
    exec('vue-tsc --project tsconfig.build.json', { cwd: pkgRoot }, (err) => {
      if (err) reject(err);
      else resolvePromise();
    });
  });
}
