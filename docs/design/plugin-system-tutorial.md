# 插件系统使用教程

> 从零开始，覆盖所有使用场景

---

## 第一章：核心概念

在写任何代码之前，先把四个角色的关系搞清楚：

```
PluginModel          →   你写的插件"定义"，一个带 meta 属性的工厂函数
    ↓ register()
PluginRuntime        →   框架创建的插件"实例"，持有 context 和 config
    ↓ init()
PluginConfig.setup() →   你的插件初始化逻辑，接收 ctx，返回 teardown
    ↓
PluginContext         →   框架注入的 API，包含 event/prefs/logger/services
```

**最重要的一句话**：你只负责写 `PluginModel`（工厂函数）和 `PluginConfig`（setup 逻辑）。框架负责其他所有事情。

---

## 第二章：第一个插件（最小可用示例）

```typescript
import { PluginModel, PluginContext } from './plugin-system'

// 最简单的插件：只有 meta 和 setup
const helloPlugin: PluginModel = Object.assign(
  // 工厂函数：接收 ctx 和 options，返回 config
  (ctx: PluginContext) => ({
    name: 'hello',

    setup(ctx) {
      ctx.logger.log('Hello, world!')
      // 返回 teardown（可选）
      return () => {
        ctx.logger.log('Goodbye!')
      }
    },
  }),
  // 静态属性
  {
    pluginName: 'hello',
    meta: {
      pluginName: 'hello',
    },
  }
)
```

`Object.assign` 这个写法来自原版，把工厂函数本身和它的静态属性（`pluginName`、`meta`）合并在一起。后面会介绍更好的写法。

---

## 第三章：配置管理器（PluginManager）

### 3.1 最简单的管理器

```typescript
import { PluginManager } from './plugin-system'

// 不需要任何业务服务时，assembler 返回空对象
const manager = new PluginManager({
  assembler: {
    assembleServices: () => ({}),
  },
})
```

### 3.2 带业务服务的管理器（窗口系统场景）

```typescript
import { PluginManager, ContextApiAssembler } from './plugin-system'

// 第一步：定义业务服务类型
interface WindowServices {
  layout: {
    toggleSelf(): void
    navigate(path: string): void
    isVisible(id?: string): boolean
  }
}

// 第二步：实现 assembler
// assembleServices 对每个插件调用一次，可以根据 pluginName 做差异化注入
const assembler: ContextApiAssembler<WindowServices> = {
  assembleServices(pluginName, meta) {
    return {
      layout: {
        toggleSelf() {
          layoutStore.activatePlugin(
            (meta as any).defaultSlot,
            pluginName
          )
        },
        navigate(path: string) {
          router.push(path)
        },
        isVisible(id?: string) {
          return layoutStore.activePanels.some(
            p => p.pluginId === (id ?? pluginName)
          )
        },
      },
    }
  },
}

// 第三步：创建管理器
const manager = new PluginManager<WindowServices>({
  assembler,
  engineVersion: '1.0.0',
  // 可选：版本兼容性检查（需要 semver 包）
  versionChecker: (exp, version) => {
    return satisfies(version, exp, { includePrerelease: true })
  },
})
```

### 3.3 带所有配置项的管理器

```typescript
const manager = new PluginManager<WindowServices>({
  assembler,
  engineVersion: '1.0.0',
  versionChecker: (exp, ver) => satisfies(ver, exp),

  // 注册前拦截：可以对插件模型做二次加工
  // 典型用途：给所有插件统一注入某个配置项，或者在 CI 里替换组件
  pluginTransducer: async (model, ctx) => {
    if (process.env.NODE_ENV === 'test') {
      // 测试环境替换为 mock 版本
      return { ...model, pluginName: model.pluginName + '-mock' }
    }
    return model
  },

  // 上下文增强钩子：所有插件的 context 创建后都会调用
  // 典型用途：注入额外的调试工具，或给 context 挂上 i18n 实例
  enhanceContextHook: (ctx) => {
    // 注意：这里不能修改 ctx 的类型，只能挂在现有字段上
    ;(ctx as any)._debugMode = process.env.DEBUG === 'true'
  },

  // 初始偏好配置（通常从后端 API 或 localStorage 读取）
  pluginPreference: new Map([
    ['builtin.terminal', { fontSize: 14, theme: 'dark' }],
    ['builtin.explorer', { sortBy: 'name', showHidden: false }],
  ]),
})
```

---

## 第四章：定义插件（三种写法对比）

### 4.1 Object.assign 写法（原版风格，兼容性最好）

```typescript
const terminalPlugin: PluginModel<WindowServices> = Object.assign(
  (ctx: PluginContext<WindowServices>, options?: Record<string, unknown>) => ({
    name: 'builtin.terminal',
    setup(ctx) {
      const fontSize = ctx.prefs.get<number>('fontSize') // 读偏好
      ctx.logger.log(`Terminal ready, fontSize=${fontSize}`)
      return () => ctx.logger.log('Terminal destroyed')
    },
    exports: {
      runCommand(cmd: string) {
        ctx.event.emit('execute', cmd)
      },
    },
  }),
  {
    pluginName: 'builtin.terminal',
    meta: {
      pluginName: 'builtin.terminal',
      eventPrefix: 'terminal',
      preferenceDeclaration: {
        fontSize: { type: 'number' as const, default: 13 },
        theme:    { type: 'string' as const, default: 'dark' },
      },
    },
  }
)
```

### 4.2 definePlugin 辅助函数写法（推荐，类型推导更好）

直接在代码里定义一个小工具函数，不需要框架内置：

```typescript
// 在你的项目里定义一次即可
function definePlugin<TServices extends Record<string, unknown> = Record<string, unknown>>(
  meta: import('./plugin-system').PluginMeta,
  factory: (
    ctx: import('./plugin-system').PluginContext<TServices>,
    options?: Record<string, unknown>
  ) => import('./plugin-system').PluginConfig<TServices>
): import('./plugin-system').PluginModel<TServices> {
  return Object.assign(factory, {
    pluginName: meta.pluginName,
    meta,
  })
}

// 使用：简洁很多，meta 和 factory 分开，不用套 Object.assign
const terminalPlugin = definePlugin<WindowServices>(
  {
    pluginName: 'builtin.terminal',
    eventPrefix: 'terminal',
    preferenceDeclaration: {
      fontSize: { type: 'number', default: 13 },
      theme:    { type: 'string', default: 'dark' },
    },
  },
  (ctx) => ({
    name: 'builtin.terminal',
    setup(ctx) {
      ctx.logger.log('Terminal ready')
      return () => ctx.logger.log('Terminal destroyed')
    },
    exports: {
      runCommand: (cmd: string) => ctx.event.emit('execute', cmd),
    },
  })
)
```

### 4.3 类写法（适合复杂插件，setup 逻辑很长时）

```typescript
// 把 setup 逻辑抽成类，工厂函数只是个入口
class TerminalPluginImpl {
  private disposers: Array<() => void> = []

  constructor(private ctx: PluginContext<WindowServices>) {}

  init() {
    const ctx = this.ctx

    // 监听全局面板激活事件
    const unsub = ctx.event.onGlobal('layout:panel-activated', ({ pluginId }) => {
      if (pluginId === ctx.pluginName) this.onActivated()
    })
    this.disposers.push(unsub)

    // 监听其他插件发来的命令
    const unsub2 = ctx.event.onGlobal('terminal:run-command', (cmd: string) => {
      this.runCommand(cmd)
    })
    this.disposers.push(unsub2)

    ctx.logger.log('Terminal initialized')
  }

  private onActivated() {
    this.ctx.logger.log('Terminal panel activated, focusing input')
    this.ctx.event.emit('focus-input')
  }

  runCommand(cmd: string) {
    this.ctx.event.emit('execute', cmd)
  }

  destroy() {
    // 统一清理所有监听器
    this.disposers.forEach(fn => fn())
    this.disposers = []
    this.ctx.logger.log('Terminal cleanup done')
  }
}

const terminalPlugin = definePlugin<WindowServices>(
  {
    pluginName: 'builtin.terminal',
    eventPrefix: 'terminal',
    preferenceDeclaration: {
      fontSize: { type: 'number', default: 13 },
    },
  },
  (ctx) => {
    // 工厂阶段：根据 options 决定行为
    const impl = new TerminalPluginImpl(ctx)

    return {
      name: 'builtin.terminal',
      setup() {
        impl.init()
        return () => impl.destroy()  // teardown 自动配对
      },
      exports: {
        runCommand: (cmd: string) => impl.runCommand(cmd),
      },
    }
  }
)
```

---

## 第五章：偏好系统（prefs）详解

### 5.1 声明偏好

```typescript
// meta.preferenceDeclaration 是 Record<key, property>
// key 就是字段名，支持 string/number/boolean/object 四种类型
const meta = {
  pluginName: 'my-plugin',
  preferenceDeclaration: {
    // 字符串，带枚举约束
    theme: {
      type: 'string' as const,
      default: 'dark',
      enum: ['dark', 'light', 'solarized'],
      description: '主题颜色',
    },
    // 数字，带枚举约束
    fontSize: {
      type: 'number' as const,
      default: 13,
      enum: [11, 12, 13, 14, 16],
    },
    // 布尔值
    showLineNumbers: {
      type: 'boolean' as const,
      default: true,
    },
    // 对象（任意结构）
    keyBindings: {
      type: 'object' as const,
      default: { copy: 'Ctrl+C', paste: 'Ctrl+V' },
    },
  },
}
```

### 5.2 在 setup 里读写偏好

```typescript
setup(ctx) {
  // 读：类型安全，Key 必须在 declaration 里声明过
  const theme = ctx.prefs.get<string>('theme')         // 'dark'
  const fontSize = ctx.prefs.get<number>('fontSize')   // 13
  // 带默认值（覆盖 declaration 里的 default）
  const lang = ctx.prefs.get<string>('lang', 'zh-CN')  // 如果没声明会抛错

  // 写：会验证类型和枚举约束
  ctx.prefs.set('theme', 'light')     // OK
  ctx.prefs.set('fontSize', 14)       // OK
  ctx.prefs.set('theme', 'invalid')   // 抛错：不在 enum 里
  ctx.prefs.set('unknown', 'value')   // 抛错：key 未声明

  // 重置单个字段为 declaration 里的 default
  ctx.prefs.reset('theme')    // theme 恢复为 'dark'

  // 重置所有字段
  ctx.prefs.reset()
}
```

### 5.3 外部传入初始偏好值

```typescript
// 场景：从后端接口加载用户配置，在启动前注入
const userPreferences = await fetch('/api/user/preferences').then(r => r.json())

const manager = new PluginManager({
  assembler,
  pluginPreference: new Map(Object.entries(userPreferences)),
  // 例如：userPreferences = {
  //   'builtin.terminal': { fontSize: 16, theme: 'light' },
  //   'builtin.explorer': { sortBy: 'date' },
  // }
})

// 或者在管理器创建后动态设置
manager.setPreference(new Map([
  ['builtin.terminal', { fontSize: 16 }],
]))
```

---

## 第六章：事件系统详解

事件分两层：**私有事件**（插件内部）和**全局事件**（跨插件通信）。

```
私有 emitter (每插件独立)          全局 emitter (所有插件共享)
─────────────────────────         ──────────────────────────────
ctx.event.emit('data')            ctx.event.emitGlobal('layout:ready')
ctx.event.on('data', fn)          ctx.event.onGlobal('layout:*', fn)
  → 只有当前插件自己能收到            → 所有插件都能收到
  → 自动加 namespace 前缀             → 支持通配符订阅
```

### 6.1 私有事件（插件内部通信）

```typescript
// 场景：Vue 组件 和 setup 逻辑之间通信
// terminal/index.ts（插件逻辑层）
setup(ctx) {
  // 监听来自 Vue 组件的用户输入
  ctx.event.on<string>('user-input', (cmd) => {
    executeCommand(cmd)
    ctx.event.emit('output', `> ${cmd}\n result...`)
  })
}

// TerminalPanel.vue（UI 层）
const ctx = pluginManager.get('builtin.terminal')!.context
// 发送用户输入
ctx.event.emit('user-input', 'ls -la')
// 监听输出
const unsub = ctx.event.on<string>('output', (text) => {
  lines.value.push(text)
})
onUnmounted(() => unsub())  // 用返回的函数取消订阅
```

### 6.2 全局事件（跨插件通信）

```typescript
// 场景：Explorer 插件告知其他插件文件被选中了
// explorer/index.ts
setup(ctx) {
  // 发出全局事件
  ctx.event.emitGlobal('explorer:file-selected', {
    path: '/src/main.ts',
    type: 'typescript',
  })
}

// terminal/index.ts（另一个插件订阅）
setup(ctx) {
  // 订阅其他插件的全局事件
  const unsub = ctx.event.onGlobal<{ path: string; type: string }>(
    'explorer:file-selected',
    ({ path, type }) => {
      ctx.logger.log(`File selected: ${path}`)
    }
  )
  // 返回的 teardown 里清理
  return () => unsub()
}
```

### 6.3 通配符订阅（EventEmitter2 特有能力）

```typescript
setup(ctx) {
  // 订阅所有 layout 事件
  const unsub = ctx.event.onGlobal('layout:*', (payload) => {
    console.log('Layout event received:', payload)
  })

  // 订阅所有事件（调试用）
  const debugUnsub = ctx.event.onGlobal('**', (payload) => {
    console.log('[DEBUG] Event:', payload)
  })

  return () => { unsub(); debugUnsub() }
}
```

### 6.4 等待某个事件（插件依赖协调）

```typescript
// 场景：git 插件需要等 auth 插件初始化完成后再启动
// 注意：这比声明 dependencies 更松耦合——auth 插件不存在时不会报错，只是超时

setup(ctx) {
  // 异步 setup：等待 auth:ready 事件，最多等 5 秒
  const waitForAuth = ctx.event.waitForGlobal<{ token: string }>('auth:ready', 5000)

  // 不阻塞 setup 本身，让框架继续初始化其他插件
  waitForAuth
    .then(({ token }) => {
      ctx.logger.log(`Auth ready, starting git sync with token: ${token}`)
      startGitSync(token)
    })
    .catch((err) => {
      ctx.logger.warn('Auth not ready in time, git sync disabled:', err.message)
    })

  return () => stopGitSync()
}
```

### 6.5 once（一次性事件）

```typescript
setup(ctx) {
  // 只处理第一次触发
  ctx.event.once<string>('first-command', (cmd) => {
    ctx.logger.log('First command ever:', cmd)
  })

  // 全局一次性
  ctx.event.onGlobalOnce('system:shutdown', () => {
    ctx.logger.log('System is shutting down, flushing buffers...')
    flushBuffers()
  })
}
```

---

## 第七章：注册和初始化

### 7.1 标准启动流程（应用初始化时）

```typescript
// main.ts
const manager = new PluginManager({ assembler })

// 第一步：批量注册（只是声明，不执行 setup）
await manager.register(explorerPlugin)
await manager.register(terminalPlugin)
await manager.register(aiPlugin)
await manager.register(gitPlugin)

// 第二步：一次性批量初始化（DAG 自动排序）
// 如果 gitPlugin 依赖 authPlugin，框架保证 auth 先 init
await manager.init()
```

### 7.2 带依赖声明的注册

```typescript
const gitPlugin = definePlugin(
  {
    pluginName: 'builtin.git',
    // 声明依赖：auth 插件必须先于 git 初始化
    dependencies: ['builtin.auth'],
  },
  (ctx) => ({
    name: 'builtin.git',
    setup(ctx) {
      // 走到这里时，auth 插件已经 init 完成
      const authRuntime = manager.get('builtin.auth')
      const { getToken } = authRuntime!.toProxy() as { getToken: () => string }
      ctx.logger.log('Git init with auth token:', getToken())
    },
  })
)
```

### 7.3 动态注册（运行时安装插件，使用 autoInit）

```typescript
// 场景：用户在插件市场点击安装
async function installPlugin(pluginId: string) {
  // 动态加载插件包
  const { default: pluginModule } = await import(`/plugins/${pluginId}/index.js`)

  // autoInit: true ——因为批量 init 已经跑完，可以直接初始化
  await manager.register(pluginModule, {
    autoInit: true,
    options: { userId: currentUser.id },
  })

  console.log(`Plugin ${pluginId} installed and ready`)
}

// 注意：如果新插件声明了 dependencies，而依赖还未初始化，
// autoInit 会失败并进入 error 状态，不会静默跳过
```

### 7.4 带 options 的注册

```typescript
// options 会经过 preferenceDeclaration 过滤，只保留声明过的 key
await manager.register(terminalPlugin, {
  options: {
    fontSize: 16,      // 在 preferenceDeclaration 里声明了 → 保留
    theme: 'light',    // 在 preferenceDeclaration 里声明了 → 保留
    secret: 'xxx',     // 没有声明 → 被过滤掉
  },
})
```

### 7.5 覆盖已有插件（热替换场景）

```typescript
// 场景：开发环境插件热重载
await manager.register(newVersionPlugin, {
  override: true,   // 会先 destroy 旧实例，再注册新的
  autoInit: true,
})
```

---

## 第八章：访问插件暴露的 API（toProxy）

```typescript
// 插件定义时声明 exports
const calculatorPlugin = definePlugin(
  { pluginName: 'calculator' },
  (ctx) => {
    let history: number[] = []

    return {
      name: 'calculator',
      setup() {},
      exports: {
        add: (a: number, b: number) => {
          const result = a + b
          history.push(result)
          ctx.event.emitGlobal('calculator:result', result)
          return result
        },
        getHistory: () => [...history],
        clearHistory: () => { history = [] },
      },
    }
  }
)

// 外部访问：通过 toProxy() 拿到暴露的 API
const calcProxy = manager.get('calculator')?.toProxy() as {
  add(a: number, b: number): number
  getHistory(): number[]
  clearHistory(): void
}

calcProxy?.add(1, 2)        // 3
calcProxy?.getHistory()     // [3]

// 或者通过 manager.toProxy()（管理器级代理）
const plugins = manager.toProxy() as any
plugins.calculator.add(3, 4)  // 7（disabled 的插件会返回 undefined）
```

---

## 第九章：生命周期管理

### 9.1 完整生命周期流程

```
register()  → state: 'registered'
    ↓
init()      → state: 'initializing' → 'initialized'（或 'error'）
    ↓
[运行中，state 由 PluginHost.vue 更新为 visible/active/hidden]
    ↓
destroy()   → state: 'destroyed'（执行 teardown）
```

### 9.2 查看插件状态

```typescript
const runtime = manager.get('builtin.terminal')

console.log(runtime?.state)      // 'initialized'
console.log(runtime?.isInited()) // true
console.log(runtime?.initTime)   // 23.4（ms）
console.log(runtime?.error)      // undefined（或 Error 对象）
```

### 9.3 强制重新初始化

```typescript
// 场景：插件 init 失败后重试，或者配置变更需要重新初始化
const runtime = manager.get('builtin.terminal')
await runtime?.init(true)  // forceInit = true，先执行 teardown 再重新 init
```

### 9.4 禁用插件（不销毁，只屏蔽访问）

```typescript
// 禁用后 manager.toProxy().terminal 返回 undefined
// 但 manager.get('builtin.terminal') 仍然返回 runtime
manager.setDisabled('builtin.terminal', true)

// 重新启用
manager.setDisabled('builtin.terminal', false)
```

### 9.5 删除插件

```typescript
// 先 destroy（执行 teardown），再从注册表移除
await manager.delete('builtin.terminal')

manager.has('builtin.terminal')  // false
manager.get('builtin.terminal')  // undefined
```

### 9.6 销毁所有插件（应用退出时）

```typescript
// destroy()：逆序执行所有插件的 teardown，但不清空注册表
await manager.destroy()

// dispose()：destroy + 清空注册表（彻底重置）
await manager.dispose()
```

---

## 第十章：Teardown 最佳实践

`setup` 返回的函数是插件的清理入口，所有在 `setup` 里建立的连接都应该在这里清理。

```typescript
setup(ctx) {
  // 模式 1：收集 unsubscribe 函数，teardown 统一清理
  const disposers: Array<() => void> = []

  disposers.push(
    ctx.event.onGlobal('layout:panel-activated', handler1),
    ctx.event.onGlobal('system:theme-changed', handler2),
    ctx.event.on('internal-event', handler3),
  )

  // 模式 2：WebSocket / 定时器等副作用
  const ws = new WebSocket('ws://localhost:8080')
  const timer = setInterval(pollStatus, 5000)

  return () => {
    // 清理事件监听
    disposers.forEach(fn => fn())
    // 清理副作用
    ws.close()
    clearInterval(timer)
    // 清理插件私有 emitter 上所有监听器
    ctx.event.removeAllListeners()
  }
}
```

---

## 第十一章：完整示例（把所有东西串起来）

```typescript
// plugins/terminal/index.ts
import { definePlugin } from '@/utils/define-plugin'
import type { WindowServices } from '@/types'

export const terminalPlugin = definePlugin<WindowServices>(
  {
    pluginName: 'builtin.terminal',
    eventPrefix: 'terminal',
    dependencies: [],          // 无依赖
    engineVersion: '>=1.0.0',  // 最低引擎版本
    preferenceDeclaration: {
      fontSize:    { type: 'number',  default: 13,     enum: [11, 12, 13, 14, 16] },
      theme:       { type: 'string',  default: 'dark', enum: ['dark', 'light'] },
      cursorStyle: { type: 'string',  default: 'block', enum: ['block', 'bar', 'underline'] },
      scrollback:  { type: 'number',  default: 1000 },
      bellEnabled: { type: 'boolean', default: false },
    },
  },
  (ctx) => {
    // 工厂阶段：可以读 options（已经过 preference 过滤）
    // 注意：这里还不能调用 ctx.services，因为可能还没 init

    return {
      name: 'builtin.terminal',

      async setup(ctx) {
        // ── 读取偏好 ──────────────────────────────────
        const fontSize = ctx.prefs.get<number>('fontSize')!
        const theme    = ctx.prefs.get<string>('theme')!

        ctx.logger.log(`Starting with fontSize=${fontSize}, theme=${theme}`)

        // ── 初始化终端核心逻辑 ─────────────────────────
        // （实际项目里可能是 xterm.js 等）
        const disposers: Array<() => void> = []

        // ── 订阅全局事件 ───────────────────────────────
        disposers.push(
          ctx.event.onGlobal('layout:panel-activated', ({ pluginId }) => {
            if (pluginId === ctx.pluginName) {
              ctx.event.emit('focus')   // 通知 Vue 组件聚焦
            }
          }),

          // 其他插件可以向终端发送命令
          ctx.event.onGlobal('terminal:run-command', (cmd: string) => {
            ctx.event.emit('execute', cmd)
          }),

          // 主题变更时更新终端主题
          ctx.event.onGlobal('system:theme-changed', (newTheme: string) => {
            ctx.prefs.set('theme', newTheme === 'dark' ? 'dark' : 'light')
            ctx.event.emit('theme-update', ctx.prefs.get('theme'))
          })
        )

        // ── 使用业务服务 ───────────────────────────────
        ctx.services.layout.isVisible()  // 查询面板是否可见

        // ── 发布就绪事件（其他插件可以 waitForGlobal 等待）
        ctx.event.emitGlobal('terminal:ready', { version: '1.0' })

        // ── teardown ───────────────────────────────────
        return () => {
          disposers.forEach(fn => fn())
          ctx.event.removeAllListeners()
          ctx.logger.log('Terminal cleaned up')
        }
      },

      exports: {
        // 暴露给其他插件或外部代码调用的 API
        runCommand(cmd: string) {
          ctx.event.emit('execute', cmd)
        },
        focus() {
          ctx.event.emit('focus')
        },
        getPrefs() {
          return {
            fontSize: ctx.prefs.get<number>('fontSize'),
            theme:    ctx.prefs.get<string>('theme'),
          }
        },
      },
    }
  }
)
```

```typescript
// main.ts（串联整个启动流程）
import { PluginManager } from './plugin-system'
import { assembler } from './assembler'
import { terminalPlugin } from './plugins/terminal'
import { explorerPlugin } from './plugins/explorer'
import { authPlugin }     from './plugins/auth'
import { gitPlugin }      from './plugins/git'    // meta.dependencies = ['builtin.auth']

const manager = new PluginManager<WindowServices>({
  assembler,
  engineVersion: '1.0.0',
  pluginPreference: await loadUserPreferences(),  // 从后端加载
})

// 注册顺序不影响初始化顺序（DAG 会自动排序）
await manager.register(terminalPlugin)
await manager.register(gitPlugin)      // 依赖 auth
await manager.register(authPlugin)
await manager.register(explorerPlugin)

// 一次调用，框架自动按 auth → git, explorer, terminal 顺序初始化
await manager.init()

// 应用退出时
window.addEventListener('beforeunload', async () => {
  await manager.dispose()
})
```

---

## 附录：常见错误和解决方法

| 错误信息 | 原因 | 解决 |
|---------|------|------|
| `Preference key "xxx" is not declared` | prefs.get/set 了未声明的 key | 在 `preferenceDeclaration` 里声明该 key |
| `Plugin "xxx" already registered` | 重复注册同名插件 | 传 `{ override: true }` 或检查 `manager.has()` |
| `SequencifyError: Missing dependencies` | 声明了依赖但依赖插件未注册 | 先注册依赖插件，或检查 `meta.dependencies` 拼写 |
| `Plugin is in error state` | `setup()` 抛出异常 | 检查 `runtime.error`，修复后调用 `init(true)` |
| `toProxy() called before init` | 插件未初始化时就访问 API | 等 `manager.init()` 完成，或 `autoInit: true` |
| `Timeout waiting for "xxx"` | `waitForGlobal` 超时 | 增大超时时间，或检查目标事件是否真的发出 |
