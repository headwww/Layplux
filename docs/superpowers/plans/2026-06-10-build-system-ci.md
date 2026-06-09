# Build System & CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up gulp + rollup build pipeline producing ESM/CJS/UMD bundles with inline declarations, compiled CSS, and GitHub Actions CI/CD.

**Architecture:** Gulp orchestrates 5 tasks (clean, build:es, build:lib, build:umd, build:styles) powered by rollup with TypeScript/Vue plugins. Two rollup passes (one for ES, one for CJS) each emit declarations into their output dirs. `vue-tsc --noEmit` for typecheck doesn't need changes — the existing tsconfig already has declaration on.

**Tech Stack:** gulp 5, rollup 4, @rollup/plugin-typescript, rollup-plugin-vue, gulp-sass, sass-embedded, del

---

### Task 1: Install devDependencies

**Files:**
- Modify: `packages/layplux/package.json`

- [ ] **Step 1: Add build dependencies**

```bash
pnpm add -D gulp@^5.0.0 del@^8.0.0 @rollup/plugin-typescript@^12.1.0 @rollup/plugin-node-resolve@^16.0.0 @rollup/plugin-commonjs@^28.0.0 rollup-plugin-vue@^6.0.0 gulp-sass@^6.0.0 sass-embedded@^1.83.0 rollup@^4.28.0 -w packages/layplux
```

- [ ] **Step 2: Verify installation**

```bash
ls /Users/shuwen/WorkSpace-Web/Layplux/node_modules/.pnpm/gulp*/node_modules/gulp/package.json
```

Expected: File exists.

- [ ] **Step 3: Commit**

```bash
git add packages/layplux/package.json pnpm-lock.yaml
git commit -m "build: add gulp + rollup build dependencies

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Create rollup.config.mjs

**Files:**
- Create: `packages/layplux/rollup.config.mjs`

- [ ] **Step 1: Create rollup config**

```js
import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import vue from 'rollup-plugin-vue'

const external = ['vue', 'eventemitter2', /^vue\//]
const plugins = [
  resolve({ extensions: ['.ts', '.tsx', '.js', '.jsx'] }),
  commonjs(),
  vue({ target: 'browser' }),
  typescript({
    tsconfig: './tsconfig.json',
    compilerOptions: {
      declaration: true,
      emitDeclarationOnly: true,
    },
  }),
]

export default [
  // ESM
  {
    input: 'src/index.ts',
    external,
    plugins,
    output: {
      dir: 'dist/es',
      format: 'esm',
      entryFileNames: '[name].mjs',
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
  },
  // CJS
  {
    input: 'src/index.ts',
    external,
    plugins: [
      ...plugins,
      typescript({
        tsconfig: './tsconfig.json',
        compilerOptions: {
          declaration: true,
          emitDeclarationOnly: true,
          declarationDir: 'dist/lib',
        },
      }),
    ],
    output: {
      dir: 'dist/lib',
      format: 'cjs',
      entryFileNames: '[name].js',
      preserveModules: true,
      preserveModulesRoot: 'src',
      exports: 'named',
    },
  },
  // UMD
  {
    input: 'src/index.ts',
    external: ['vue'],
    plugins: plugins.map(p => {
      if (p && p.name === 'vue') {
        return vue({ target: 'browser', css: true })
      }
      return p
    }),
    output: {
      file: 'dist/umd/layplux.umd.js',
      format: 'umd',
      name: 'Layplux',
      globals: { vue: 'Vue' },
      exports: 'named',
    },
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add packages/layplux/rollup.config.mjs
git commit -m "build: add rollup config for ESM/CJS/UMD output

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Create gulpfile.mjs

**Files:**
- Create: `packages/layplux/gulpfile.mjs`

- [ ] **Step 1: Create gulpfile**

```js
import gulp from 'gulp'
import { rollup } from 'rollup'
import { loadConfigFile } from 'rollup/loadConfigFile'
import { deleteAsync } from 'del'
import gulpSass from 'gulp-sass'
import * as sassEmbedded from 'sass-embedded'

const sass = gulpSass(sassEmbedded)

const paths = {
  scss: 'src/styles/**/*.scss',
  scssEntry: 'src/styles/layplux.scss',
  outStyles: 'dist',
}

// 使用外部的 rollup.config.mjs
async function runRollup() {
  const { options, warnings } = await loadConfigFile('./rollup.config.mjs')
  warnings.flush()
  for (const opts of options) {
    const bundle = await rollup(opts)
    await Promise.all(opts.output.map(bundle.write))
    await bundle.close()
  }
}

export const clean = () => deleteAsync(['dist'])

export const buildJs = (done) => {
  runRollup().then(() => done()).catch(done)
}

export const buildStyles = () =>
  gulp
    .src(paths.scssEntry)
    .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(gulp.dest(paths.outStyles))

export const copyScss = () =>
  gulp.src(paths.scss).pipe(gulp.dest(`${paths.outStyles}/scss`))

export const build = gulp.series(clean, gulp.parallel(buildJs, buildStyles, copyScss))

export const watch = () => {
  gulp.watch('src/**/*.{ts,tsx}', buildJs)
  gulp.watch(paths.scss, gulp.parallel(buildStyles, copyScss))
}

export default build
```

- [ ] **Step 2: Verify gulp build**

```bash
cd /Users/shuwen/WorkSpace-Web/Layplux/packages/layplux && npx gulp build
```

Expected: `dist/` created with es/, lib/, umd/, style.css, scss/.

- [ ] **Step 3: Verify dist structure**

```bash
ls /Users/shuwen/WorkSpace-Web/Layplux/packages/layplux/dist/es/index.mjs && \
ls /Users/shuwen/WorkSpace-Web/Layplux/packages/layplux/dist/es/index.d.ts && \
ls /Users/shuwen/WorkSpace-Web/Layplux/packages/layplux/dist/lib/index.js && \
ls /Users/shuwen/WorkSpace-Web/Layplux/packages/layplux/dist/lib/index.d.ts && \
ls /Users/shuwen/WorkSpace-Web/Layplux/packages/layplux/dist/umd/layplux.umd.js && \
ls /Users/shuwen/WorkSpace-Web/Layplux/packages/layplux/dist/style.css
```

Expected: All files exist.

- [ ] **Step 4: Commit**

```bash
git add packages/layplux/gulpfile.mjs
git commit -m "build: add gulpfile with rollup + styles pipeline

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Update package.json fields

**Files:**
- Modify: `packages/layplux/package.json`

- [ ] **Step 1: Replace scripts and add fields**

Replace the `scripts` section and add `main`, `module`, `types`, `unpkg`, `files`, `exports`:

```json
{
  "name": "layplux",
  "version": "0.0.1",
  "description": "IDE-like window system and plugin framework for the web",
  "type": "module",
  "main": "./dist/lib/index.js",
  "module": "./dist/es/index.mjs",
  "types": "./dist/es/index.d.ts",
  "unpkg": "./dist/umd/layplux.umd.js",
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/es/index.d.ts",
      "import": "./dist/es/index.mjs",
      "require": "./dist/lib/index.js",
      "default": "./dist/umd/layplux.umd.js"
    },
    "./scss": "./dist/scss/",
    "./dist/style.css": "./dist/style.css"
  },
  "scripts": {
    "dev": "gulp watch",
    "build": "gulp build",
    "lint": "oxlint src",
    "typecheck": "vue-tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepublishOnly": "gulp build"
  },
  "dependencies": {
    "eventemitter2": "^6.4.9"
  },
  "devDependencies": {
    "@rollup/plugin-commonjs": "^28.0.0",
    "@rollup/plugin-node-resolve": "^16.0.0",
    "@rollup/plugin-typescript": "^12.1.0",
    "del": "^8.0.0",
    "gulp": "^5.0.0",
    "gulp-sass": "^6.0.0",
    "rollup": "^4.28.0",
    "rollup-plugin-vue": "^6.0.0",
    "sass-embedded": "^1.83.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0",
    "vue": "^3.5.34",
    "vue-tsc": "^2.2.0"
  },
  "peerDependencies": {
    "vue": "^3.5.0"
  }
}
```

- [ ] **Step 2: Verify dist/ is gitignored**

Check that `packages/layplux/.gitignore` or root `.gitignore` includes `dist/`.

If not, add: `echo "dist/" >> packages/layplux/.gitignore`

- [ ] **Step 3: Verify `pnpm install` is clean**

```bash
pnpm install
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add packages/layplux/package.json packages/layplux/.gitignore 2>/dev/null
git commit -m "build: update package.json with dist exports and build scripts

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: Create GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create ci.yml**

```yaml
name: CI

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - run: pnpm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - run: pnpm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - run: pnpm run test

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - run: pnpm run build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions CI workflow

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: Create GitHub Actions Publish workflow

**Files:**
- Create: `.github/workflows/publish.yml`

- [ ] **Step 1: Create publish.yml**

```yaml
name: Publish

on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
          cache: pnpm
      - run: pnpm install
      - run: pnpm run build
      - run: pnpm publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/publish.yml
git commit -m "ci: add npm publish workflow on tag

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: Run full build and verify

**Files:**
- None (verification only)

- [ ] **Step 1: Clean install and build**

```bash
pnpm install && cd /Users/shuwen/WorkSpace-Web/Layplux/packages/layplux && npx gulp build
```

- [ ] **Step 2: Verify ESM output**

```bash
node -e "import('./packages/layplux/dist/es/index.mjs').then(m => console.log('ESM exports:', Object.keys(m).slice(0, 10).join(', ')))"
```

Expected: Lists exports like `Layplux, useSkeleton, ...`

- [ ] **Step 3: Verify CJS output**

```bash
node -e "const m = require('./packages/layplux/dist/lib/index.js'); console.log('CJS exports:', Object.keys(m).slice(0, 10).join(', '))"
```

Expected: Lists exports.

- [ ] **Step 4: Verify declarations exist alongside JS**

```bash
ls /Users/shuwen/WorkSpace-Web/Layplux/packages/layplux/dist/es/managers/skeleton.d.ts && \
ls /Users/shuwen/WorkSpace-Web/Layplux/packages/layplux/dist/lib/managers/skeleton.d.ts
```

Expected: Both files exist.

- [ ] **Step 5: Verify style.css**

```bash
wc -c /Users/shuwen/WorkSpace-Web/Layplux/packages/layplux/dist/style.css
```

Expected: Non-zero file size.

- [ ] **Step 6: Verify playground still works**

```bash
cd /Users/shuwen/WorkSpace-Web/Layplux/packages/playground && npx vite build 2>&1 | tail -5
```

Expected: `✓ built`.

- [ ] **Step 7: Commit any remaining changes**
