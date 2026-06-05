// =================================================================
// index.ts — 统一导出
// =================================================================

export * from './plugin-types';
export * from './plugin-manager';
export * from './plugin-runtime';
export * from './plugin-context';
export * from './event-bus';
export * from './sequencify';

// =================================================================
// usage-examples.ts — 三种接入场景示例
// =================================================================

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 场景 1：窗口系统（本项目）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/*
// 1-a. 定义业务服务类型
interface WindowServices {
  layout: {
    toggleSelf(): void
    navigate(path: string): void
    isVisible(id?: string): boolean
  }
}

// 1-b. 实现 assembler（注入业务服务）
const windowAssembler: ContextApiAssembler<WindowServices> = {
  assembleServices(pluginName, meta) {
    const store = useLayoutStore()   // Pinia store
    const router = useRouter()
    return {
      layout: {
        toggleSelf() {
          const slot = (meta as any).defaultSlot
          store.activatePlugin(slot, pluginName)
        },
        navigate(path: string) {
          router.push(path)
        },
        isVisible(id?: string) {
          return store.activePanels.some(p => p.pluginId === (id ?? pluginName))
        },
      },
    }
  },
}

// 1-c. 创建管理器
const windowPluginManager = new PluginManager<WindowServices>({
  assembler: windowAssembler,
  engineVersion: '1.0.0',
})

// 1-d. 定义插件
const terminalPlugin: PluginModel<WindowServices> = Object.assign(
  (ctx: PluginContext<WindowServices>) => ({
    name: 'builtin.terminal',
    setup(ctx) {
      ctx.logger.log('Terminal ready')
      const fontSize = ctx.prefs.get<number>('fontSize')  // 13

      ctx.event.onGlobal('layout:panel-activated', ({ pluginId }) => {
        if (pluginId === ctx.pluginName) ctx.event.emit('focus')
      })

      return () => { ctx.logger.log('Terminal destroyed') }
    },
    exports: {
      runCommand(cmd: string) { ctx.event.emit('execute', cmd) }
    }
  }),
  {
    pluginName: 'builtin.terminal',
    meta: {
      pluginName: 'builtin.terminal',
      eventPrefix: 'terminal',
      preferenceDeclaration: {
        fontSize: { type: 'number', default: 13, enum: [11, 12, 13, 14, 16] },
        theme:    { type: 'string', default: 'dark', enum: ['dark', 'light'] },
      },
    } satisfies PluginMeta,
  }
)

await windowPluginManager.register(terminalPlugin)
await windowPluginManager.init()
*/

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 场景 2：低代码平台（原 microcode 场景，改造后的接入方式）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/*
interface LowCodeServices {
  skeleton: SkeletonApi
  canvas: CanvasApi
  setters: SettersApi
  hotkey: HotkeyApi
}

const lowCodeAssembler: ContextApiAssembler<LowCodeServices> = {
  assembleServices(pluginName, meta) {
    return {
      skeleton: getSkeletonApi(),
      canvas:   getCanvasApi(),
      setters:  getSettersApi(),
      hotkey:   getHotkeyApi(),
    }
  },
}

import satisfies from 'semver/functions/satisfies'

const lowCodeManager = new PluginManager<LowCodeServices>({
  assembler: lowCodeAssembler,
  engineVersion: '2.3.0',
  versionChecker: (exp, version) => satisfies(version, exp, { includePrerelease: true }),
})
*/

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 场景 3：最简接入（无业务服务，纯插件生命周期管理）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/*
// 不需要任何业务服务，直接创建管理器
const simpleManager = new PluginManager({
  assembler: {
    assembleServices: () => ({})   // 空服务
  }
})

const analyticsPlugin: PluginModel = Object.assign(
  (ctx: PluginContext) => ({
    name: 'analytics',
    setup(ctx) {
      ctx.logger.log('Analytics plugin ready')
      // 通过全局事件总线收集数据
      ctx.event.onGlobal('user:action', (data) => {
        sendToServer(data)
      })
      return () => { // teardown }
    }
  }),
  { pluginName: 'analytics', meta: { pluginName: 'analytics' } }
)

await simpleManager.register(analyticsPlugin, { autoInit: true })
*/
