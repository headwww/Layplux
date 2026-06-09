# 构建系统 & CI/CD 设计

> 用 gulp + rollup 搭建 Layplux 的构建、声明文件生成、样式编译和 CI/CD 流水线。

## 目标

- ESM / CJS / UMD 三种格式产物
- 声明文件和 JS 产物同目录存放
- SCSS 编译为 CSS + 原始 SCSS 双输出
- GitHub Actions CI/CD 自动 lint、typecheck、test、build、publish

---

## 产物结构

```
dist/
├── es/                          ES Module
│   ├── index.mjs                +  index.d.ts
│   ├── managers/
│   │   ├── skeleton.mjs         +  skeleton.d.ts
│   │   ├── widget.mjs           +  widget.d.ts
│   │   └── ...
│   ├── components/
│   │   └── ...
│   ├── layout/
│   │   └── ...
│   ├── utils/
│   │   └── ...
│   ├── types/
│   │   └── ...
│   └── locales/
│       └── ...
│
├── lib/                         CommonJS
│   └── ...（镜像 es/，.mjs→.js）
│
├── umd/
│   └── layplux.umd.js            UMD 单文件
│
├── style.css                    编译后完整 CSS
└── scss/                        原始 SCSS（复制）
    └── ...
```

## package.json 字段

```json
{
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
  }
}
```

`files` 只包含 `dist`，源码不发布。

---

## 构建工具链

### 依赖

```json
{
  "devDependencies": {
    "gulp": "^5",
    "@rollup/plugin-typescript": "^12",
    "@rollup/plugin-node-resolve": "^16",
    "@rollup/plugin-commonjs": "^28",
    "rollup-plugin-vue": "^6",
    "gulp-sass": "^6",
    "sass-embedded": "^1",
    "vue-tsc": "^2",
    "rollup": "^4",
    "del": "^7"
  }
}
```

### gulp + rollup 架构

```
gulp build
├── clean               del dist/
├── build:es            rollup → dist/es/
│     preserveModules: true, format: 'esm'
│     plugins: resolve, commonjs, typescript(declaration, declarationDir), vue
├── build:lib           rollup → dist/lib/
│     preserveModules: true, format: 'cjs'
│     plugins: 同上（declarationDir 指向 dist/lib/）
├── build:umd           rollup → dist/umd/layplux.umd.js
│     format: 'umd', name: 'Layplux', globals: { vue: 'Vue' }
│     plugins: resolve, commonjs, typescript, vue, terser
├── build:styles        gulp-sass 编译 scss → dist/style.css
│     复制 src/styles/ → dist/scss/
└── build:types         vue-tsc --emitDeclarationOnly --declarationDir dist/es
                        复制 .d.ts 到 dist/lib/（或 rollup 双跑）
```

### 声明文件策略

两种做法选一：

**方案：rollup 跑两遍**（推荐）

```js
// gulpfile 中
function buildES() {
  return rollup({
    input: 'src/index.ts',
    preserveModules: true,
    plugins: [typescript({ declaration: true, declarationDir: 'dist/es' }), ...],
    output: { dir: 'dist/es', format: 'esm', entryFileNames: '[name].mjs' },
  })
}

function buildLib() {
  return rollup({
    input: 'src/index.ts',
    preserveModules: true,
    plugins: [typescript({ declaration: true, declarationDir: 'dist/lib' }), ...],
    output: { dir: 'dist/lib', format: 'cjs', entryFileNames: '[name].js' },
  })
}
```

两遍 rollup 各自生成 `.d.ts` 到各自的目录下。声明文件天然和 JS 产物同目录。

### style.css 入口

```scss
// src/styles/layplux.scss 作为 rollup 侧处理
// umd 中 import './styles/layplux.scss' 由 rollup 注入 CSS
// 同时 gulp-sass 独立编译一份到 dist/style.css
```

## CI/CD

### GitHub Actions — CI（push/PR 触发）

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout
      - uses: pnpm/action-setup
      - run: pnpm install
      - run: pnpm run lint           # oxlint + stylelint
      - run: pnpm run typecheck      # vue-tsc --noEmit

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout
      - uses: pnpm/action-setup
      - run: pnpm install
      - run: pnpm run test           # vitest run

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout
      - uses: pnpm/action-setup
      - run: pnpm install
      - run: pnpm run build          # gulp build
```

### CD — Publish（tag 触发）

```yaml
# .github/workflows/publish.yml
name: Publish

on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout
      - uses: pnpm/action-setup
      - run: pnpm install
      - run: pnpm run build
      - run: pnpm publish --no-git-checks
    env:
      NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## package.json scripts

```json
{
  "scripts": {
    "dev": "gulp watch",
    "build": "gulp build",
    "lint": "oxlint src && stylelint src/styles/**/*.scss",
    "typecheck": "vue-tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepublishOnly": "gulp build"
  }
}
```

## 改动文件汇总

| 文件 | 操作 |
|---|---|
| `packages/layplux/gulpfile.mjs` | 新增 — gulp 任务编排 |
| `packages/layplux/rollup.config.mjs` | 新增 — rollup 插件配置 |
| `packages/layplux/package.json` | 修改 — scripts / main / module / types / exports / files |
| `.github/workflows/ci.yml` | 新增 — CI 流水线 |
| `.github/workflows/publish.yml` | 新增 — CD 发布流水线 |
| `packages/layplux/tsconfig.json` | 修改 — 确认 declaration 配置 |

## 非目标

- 不做 SSR bundle（Node 端可直接用 CJS/ESM）
- 不做 visual regression test
- 不做 changelog 自动生成（后续再加）
