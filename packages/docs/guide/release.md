# 发布指南

本文档介绍 Layplux 项目的开发流程、CI/CD 和发布新版本的操作步骤。

## 分支策略

- `master` — 主分支，始终保持可发布状态
- 功能开发在本地特性分支进行，完成后通过 PR 合并到 `master`

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式，commitlint 会在提
交时自动检查：

| 类型 | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `chore` | 构建/依赖/工具链 |
| `refactor` | 重构（无功能变更） |
| `style` | 代码格式（不影响逻辑） |
| `test` | 测试相关 |

```bash
feat: 添加 Popup 组件的 destroyOnClose 支持
fix: 修复 Skeleton resize 时面板闪烁问题
chore: 升级 esbuild 到 0.25
```

## 本地开发

```bash
# 安装依赖（根目录）
pnpm install

# 启动 playground 开发环境
pnpm dev

# 启动文档开发环境
pnpm -C packages/docs dev

# 运行测试
pnpm test

# 运行 lint
pnpm lint

# 本地构建验证
pnpm build
```

## CI 自动检查

每次 push 到 `master` 或提交 Pull Request 时，GitHub Actions 自动运行：

| 检查项 | 说明 |
|--------|------|
| Oxlint + ESLint | 代码规范 |
| vue-tsc | TypeScript 类型检查 |
| gulp build | ESM / CJS / UMD / CSS / 类型声明 全量构建 |
| 产物验证 | 检查 dist 目录完整 |

工作流文件：[`.github/workflows/ci.yml`](https://github.com/headwww/Layplux/blob/master/.github/workflows/ci.yml)

## 发布新版本

### 前置条件（仅首次）

在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中添加 `NPM_TOKEN`：

1. 登录 [npmjs.com](https://www.npmjs.com)，进入 **Access Tokens**
2. 创建 **Automation** 类型的 token
3. 将 token 添加到 GitHub Actions Secrets，名称为 `NPM_TOKEN`

### 操作步骤

**1. 确保代码已合并到 master**

```bash
git checkout master
git pull origin master
```

**2. 本地构建验证**

```bash
pnpm build
```

**3. 更新版本号**

```bash
cd packages/layplux

# 语义化版本规则：
pnpm version patch   # 0.0.1 → 0.0.2  修复 bug
pnpm version minor   # 0.0.1 → 0.1.0  新增功能
pnpm version major   # 0.0.1 → 1.0.0  破坏性变更
```

`pnpm version` 会自动：
- 更新 `packages/layplux/package.json` 的 `version` 字段
- 创建对应的 git commit
- 创建 `v0.0.2` 格式的 git tag

**4. 推送代码和 tag**

```bash
git push origin master
git push origin v0.0.2  # 替换为实际版本号
```

**5. 等待 CI 自动发布**

推送 tag 后，GitHub Actions 自动触发 Release Workflow：

```
安装依赖 → 构建产物 → 发布到 npm → 创建 GitHub Release
```

工作流文件：[`.github/workflows/release.yml`](https://github.com/headwww/Layplux/blob/master/.github/workflows/release.yml)

**6. 验证发布结果**

```bash
# 查看 npm 版本
npm view layplux version

# 在项目中验证
npm install layplux@latest
```

### 手动发布（CI 不可用时）

```bash
pnpm build
cd packages/layplux
npm publish
```

## 版本号规则

项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

```
主版本号.次版本号.修订号  （MAJOR.MINOR.PATCH）

MAJOR — 不兼容的 API 修改
MINOR — 向下兼容的功能新增
PATCH — 向下兼容的问题修复
```

当前为 0.x 阶段，API 可能变动，minor 版本也可能包含不兼容变更。

## 产物说明

每次构建生成以下产物，全部包含在 npm 包的 `dist/` 目录：

| 产物 | 路径 | 用途 |
|------|------|------|
| ESM | `dist/esm/` | 现代打包工具（Vite、webpack） |
| CJS | `dist/cjs/` | Node.js `require()` |
| UMD | `dist/umd/index.js` | CDN / `<script>` 标签 |
| 类型声明 | `dist/types/` | TypeScript 类型提示 |
| 编译后 CSS | `dist/style/index.css` | 直接引入样式 |
| SCSS 源码 | `dist/style/` | 下游项目 `@use` |
