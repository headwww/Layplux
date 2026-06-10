import { src, dest } from 'gulp';
import gulpSass from 'gulp-sass';
import * as sass from 'sass';
import rename from 'gulp-rename';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, '../../packages/layplux');

const sassCompiler = gulpSass(sass);

export function buildStyle() {
  return src(resolve(pkgRoot, 'src/style/layplux.scss'))
    .pipe(
      sassCompiler({
        outputStyle: 'compressed',
        includePaths: [resolve(pkgRoot, 'src/style')],
      }),
    )
    .pipe(rename('index.css'))
    .pipe(dest(resolve(pkgRoot, 'dist/style')));
}

export function copyScss() {
  return src(resolve(pkgRoot, 'src/style/**/*.scss'), {
    base: resolve(pkgRoot, 'src/style'),
  }).pipe(dest(resolve(pkgRoot, 'dist/style')));
}
