```markdown
# 任务：使用 Gulp + esbuild + Rollup 构建 Vue 3 TypeScript 组件库

## 项目背景

- `packages/layplux` 是一个 Vue 3 组件库，组件使用 `.tsx`（Vue JSX）编写，无 `.vue` 单文件组件
- 样式使用 SCSS，入口文件为 `src/styles/layplux.scss`
- 源码入口为 `src/index.ts`，导出组件、composable、类型、工具函数
- 项目根 `tsconfig.json` 配置了 `jsx: "preserve"`、`jsxImportSource: "vue"`
- 包级 `tsconfig.json` 已配置 `declaration: true`、`emitDeclarationOnly: true`
- 包管理为 pnpm workspace

## 构建产物结构

保持与 `src/` 完全一致的目录结构（unbundled），不合并成单文件。
UMD 是唯一的 bundle 产物，供 CDN 使用。
```

dist/  
├── esm/ # 与 src/ 目录结构完全一致，.ts/.tsx → .mjs  
│ ├── index.mjs  
│ ├── components/  
│ └── ...  
├── cjs/ # 与 src/ 目录结构完全一致，.ts/.tsx → .cjs  
│ ├── index.cjs  
│ ├── components/  
│ └── ...  
├── umd/  
│ └── index.js # 单文件 bundle，供 CDN / unpkg 使用  
├── style/  
│ ├── index.css # 编译后的 CSS（compressed）  
│ └── layplux.scss # 原始 SCSS 源文件（供下游 SCSS 项目 @use）  
└── types/ # vue-tsc 生成，目录结构与 src/ 完全一致  
├── index.d.ts  
├── components/  
└── ...

```

## 工具分工

| 产物 | 工具 | 说明 |
|------|------|------|
| ESM（unbundled） | esbuild | 逐文件转译，`bundle: false` |
| CJS（unbundled） | esbuild | 逐文件转译，`bundle: false` |
| UMD（bundle） | Rollup | 单文件，external vue |
| 类型声明 | vue-tsc | `--declaration --emitDeclarationOnly` |
| 样式 | gulp-sass | dart-sass，compressed 输出 |
| 任务编排 | Gulp | clean → 并行执行所有子任务 |

## Gulp 任务编排

任务依赖关系如下，clean 完成后四组任务完全并行：

```

clean
└── [并行执行]
├── build-esm （esbuild，format: esm）
├── build-cjs （esbuild，format: cjs）
├── build-umd （rollup，单文件 bundle）
├── build-style （gulp-sass 编译 SCSS）
├── build-types （vue-tsc 生成 .d.ts）
└── copy-scss （原样复制 SCSS 源文件）

```

`build-esm`、`build-cjs`、`build-umd`、`build-style`、`build-types`、`copy-scss`
六个任务互相独立，无先后依赖，全部并行执行。

## esbuild 配置（ESM / CJS）

使用 glob 收集 `src/` 下所有 `.ts`、`.tsx` 文件作为 entryPoints，
每个文件独立输出，相对导入路径保持不变，仅替换扩展名。

```js
import { build } from 'esbuild'
import { glob } from 'glob'

const files = await glob('src/**/*.{ts,tsx}')

// ESM
await build({
  entryPoints: files,
  outdir: 'dist/esm',
  format: 'esm',
  outExtension: { '.js': '.mjs' },
  jsx: 'automatic',
  jsxImportSource: 'vue',
  bundle: false,          // 关键：不 bundle，保持文件结构
  splitting: false,
  platform: 'browser',
  target: 'es2020',
  external: ['vue', '@vue/*'],
})

// CJS
await build({
  entryPoints: files,
  outdir: 'dist/cjs',
  format: 'cjs',
  outExtension: { '.js': '.cjs' },
  jsx: 'automatic',
  jsxImportSource: 'vue',
  bundle: false,
  splitting: false,
  platform: 'browser',
  target: 'es2020',
  external: ['vue', '@vue/*'],
})
```

注意事项：

- `bundle: false` 是 unbundled 模式的关键，esbuild 只做语法转译，不解析依赖
- `external` 在 `bundle: false` 时实际不生效（因为根本不 bundle），保留仅作说明意图
- esbuild 原生支持 TSX，配置 `jsx: 'automatic'` + `jsxImportSource: 'vue'` 即可处理 Vue JSX，无需 Babel

## Rollup 配置（UMD）

UMD 是唯一需要 bundle 的产物，入口为 `src/index.ts`，将所有代码打成单文件。

插件顺序（不能调换）：

1. `@rollup/plugin-node-resolve` — 解析 node_modules
2. `@rollup/plugin-commonjs` — CJS 依赖转 ESM
3. `@rollup/plugin-babel` — 处理 TSX 和 TypeScript
  - presets: `['@babel/preset-typescript']`（仅类型剥离，不做 transform）
  - plugins: `['@vue/babel-plugin-jsx']`
  - extensions: `['.ts', '.tsx']`
  - babelHelpers: `'bundled'`

```js
// rollup.config.js
export default {
  input: 'src/index.ts',
  external: ['vue'],
  output: {
    file: 'dist/umd/index.js',
    format: 'umd',
    name: 'Layplux',
    globals: { vue: 'Vue' },
    exports: 'named',
  },
  plugins: [
    nodeResolve({ extensions: ['.ts', '.tsx'] }),
    commonjs(),
    babel({
      presets: ['@babel/preset-typescript'],
      plugins: ['@vue/babel-plugin-jsx'],
      extensions: ['.ts', '.tsx'],
      babelHelpers: 'bundled',
    }),
  ],
};
```

不使用 `@rollup/plugin-typescript`：它与 Babel 同时处理 transform 会冲突。
类型声明由独立的 `build-types` task 负责，Rollup 不输出任何 `.d.ts`。

## SCSS 编译配置

```js
import gulpSass from 'gulp-sass';
import * as sass from 'sass';

const sassCompiler = gulpSass(sass);

function buildStyle() {
  return src('src/styles/layplux.scss')
    .pipe(
      sassCompiler({
        outputStyle: 'compressed',
        includePaths: ['src/styles'], // 确保 @use/@forward 路径正确解析
      }),
    )
    .pipe(rename('index.css'))
    .pipe(dest('dist/style'));
}
```

## 类型声明配置

单独运行 `vue-tsc`，与 Rollup/esbuild 构建完全解耦：

```json
// packages/layplux/tsconfig.build.json（继承包级 tsconfig，覆盖输出相关字段）
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist/types",
    "declaration": true,
    "emitDeclarationOnly": true,
    "noEmit": false
  },
  "include": ["src/**/*"]
}
```

Gulp task 中执行：

```js
import { exec } from 'child_process';

function buildTypes(cb) {
  exec('vue-tsc --project tsconfig.build.json', cb);
}
```

## package.json 字段配置

```json
{
  "main": "./dist/cjs/index.cjs",
  "module": "./dist/esm/index.mjs",
  "unpkg": "./dist/umd/index.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/esm/index.mjs",
      "require": "./dist/cjs/index.cjs"
    },
    "./*": {
      "types": "./dist/types/*.d.ts",
      "import": "./dist/esm/*.mjs",
      "require": "./dist/cjs/*.cjs"
    },
    "./style": "./dist/style/index.css",
    "./style/scss": "./dist/style/layplux.scss"
  },
  "files": ["dist"]
}
```

## 依赖安装

所有构建相关依赖安装在 `packages/layplux` 本地，不装到 workspace 根：

```bash
# 运行时构建工具
pnpm add -D gulp esbuild rollup glob

# Rollup 插件（仅 UMD 使用）
pnpm add -D @rollup/plugin-node-resolve @rollup/plugin-commonjs @rollup/plugin-babel

# Babel（仅 UMD 的 Rollup 使用）
pnpm add -D @babel/core @babel/preset-typescript @vue/babel-plugin-jsx

# 样式
pnpm add -D gulp-sass sass gulp-rename

# 类型声明
pnpm add -D vue-tsc typescript
```

## 其他注意事项

- `.gitignore` 添加 `packages/layplux/dist/`
- Babel 配置写在独立的 `babel.config.js` 中，不内联在 rollup 配置里
- esbuild 不处理 `src/styles/` 下的 SCSS，样式完全由 gulp-sass 负责
- unbundled 产物中的跨文件相对导入，esbuild 会保留原始路径（不含扩展名），
消费方工具（Vite / webpack）需能解析 `.mjs` 扩展名，通常默认支持
- 如果 `src/` 中存在路径别名（如 `@/`），esbuild 需配置对应的 `paths` 映射，
或在构建前用 `tsc-alias` 替换别名为相对路径

```

```

