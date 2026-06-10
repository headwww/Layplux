# 发布指南

本文档介绍 Layplux 项目的开发流程、CI/CD 和基于 Changesets 的版本发布流程。

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

## 发布新版本（Changesets）

项目使用 [Changesets](https://github.com/changesets/changesets) 管理版本和变更日志。不
需要手动改版本号或打 tag。

### 首次配置（仅一次）

在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中添加两个 Secrets：

| Secret | 说明 |
|--------|------|
| `NPM_TOKEN` | npm 的 Granular Access Token，给 `layplux` 包 read/write 权限 |
| `GITHUB_TOKEN` | GitHub 自动提供，无需手动配置 |

### 日常发布步骤

**1. 写完代码后，创建 changeset**

```bash
pnpm changeset
```

交互式问答：

1. 选要发布的包 → `layplux`（空格选中，回车确认）
2. 选版本类型 → `patch`（修复）/ `minor`（新功能）/ `major`（破坏性变更）
3. 输入变更说明（会出现在 CHANGELOG 中）

执行后在 `.changeset/` 目录生成一个描述本次变更的 markdown 文件。

**2. 提交代码和 changeset**

```bash
git add .
git commit -m "feat: 添加 xxx 功能"
git push
```

**3. 合并到 master**

合并 PR 或直接 push 到 master 后，GitHub Actions 自动运行 Release Workflow：

- 检测到新的 changeset → 创建一个 **"Version Packages"** PR
- 这个 PR 里自动更新了 `package.json` 版本号和 `CHANGELOG.md`
- 确认无误后，合并这个 PR

**4. 合并 PR，自动发布**

合并 "Version Packages" PR 后，Release Workflow 自动执行：

```
安装依赖 → 构建产物 → 发布到 npm → 创建 GitHub Release
```

无需手动改版本号、打 tag、或执行 `npm publish`。

### 跳过发布

如果只是修改文档、配置等不需要发布的变更，不加 changeset 即可，代码合并后不会触发发
布流程。

## npm 发布配置

### 创建 npm Token

1. 登录 [npmjs.com](https://www.npmjs.com) → 头像 → **Access Tokens** → **Generate New Token**
2. Token 类型选 **Granular Access Token**
3. Packags and scopes → 添加 `layplux`，权限选 **Read and write**
4. **Organizations 部分留空**
5. **不要勾选** "Require two-factor authentication for API and CLI"
6. 生成后复制 token，添加到 GitHub Secrets 的 `NPM_TOKEN`
7. **同时确保 npm 账户设置中** "Require two-factor authentication for writes" **已取消勾选**

## 手动发布（CI 不可用时）

```bash
pnpm build
cd packages/layplux
npm publish
```

## 版本号规则

项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

```
主版本号.次版本号.修订号  （MAJOR.MINOR.PATCH）

MAJOR — 不兼容的 API 修改  （changeset 中选 major）
MINOR — 向下兼容的功能新增  （changeset 中选 minor）
PATCH — 向下兼容的问题修复  （changeset 中选 patch）
```

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
