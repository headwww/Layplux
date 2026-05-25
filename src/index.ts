// oxlint-disable no-console
import { Skeleton } from './skeleton';
import {
  PluginManager,
  type ContextApiAssembler,
  type PluginContext,
  definePlugin,
} from './plugin';
// =========================================================================
// 1. 声明业务服务
// =========================================================================

interface LaypluxServices {
  skeleton: Skeleton;
}

const LaypluxAssembler: ContextApiAssembler<LaypluxServices> = {
  assembleServices(_pluginName, _meta) {
    return { skeleton: new Skeleton() };
  },
};

// =========================================================================
// 2. 创建插件管理器
// =========================================================================

export const laypluxPlugins = new PluginManager<LaypluxServices>({
  assembler: LaypluxAssembler,
});

// =========================================================================
// 3. 定义终端插件 —— 暴露 exports
// =========================================================================

interface TerminalApi {
  runCommand(cmd: string): void;
  getCurrentDir(): string;
}

const terminalPlugin = definePlugin<LaypluxServices>({ pluginName: 'builtin.terminal' }, (ctx) => {
  let currentDir = '/home/user';

  return {
    setup() {
      console.log('[terminal] 初始化完成');
      ctx.event.on('execute', (cmd: unknown) => {
        const c = cmd as string;
        if (c.startsWith('cd ')) {
          currentDir = c.slice(3);
          console.log(`[terminal] 切换目录 → ${currentDir}`);
        } else {
          console.log(`[terminal] 执行命令 → ${c}`);
        }
      });
      return () => console.log('[terminal] 销毁');
    },
    exports: {
      runCommand(cmd: string) {
        ctx.event.emit('execute', cmd);
      },
      getCurrentDir() {
        return currentDir;
      },
    } satisfies TerminalApi,
  };
});

// =========================================================================
// 4. 定义文件浏览器插件 —— 通过 toProxy 调用终端的 exports
// =========================================================================

const explorerPlugin = definePlugin<LaypluxServices>(
  {
    pluginName: 'builtin.explorer',
    dependencies: ['builtin.terminal'], // 确保终端先初始化
  },
  (ctx: PluginContext<LaypluxServices>) => ({
    setup() {
      console.log('[explorer] 初始化完成');
      ctx.skeleton = 1; // 业务服务，直接点出来

      // 拿到终端的导出 API
      const terminal = laypluxPlugins.get('builtin.terminal')!.toProxy() as unknown as TerminalApi;

      // 直接调用，有返回值
      console.log(`[explorer] 当前目录 → ${terminal.getCurrentDir()}`);

      terminal.runCommand('mkdir new-project');
      terminal.runCommand('cd /tmp');
      console.log(`[explorer] 切换后目录 → ${terminal.getCurrentDir()}`);

      return () => console.log('[explorer] 销毁');
    },
  }),
);

// =========================================================================
// 5. 注册并启动
// =========================================================================

export async function main() {
  await laypluxPlugins.register(terminalPlugin);
  await laypluxPlugins.register(explorerPlugin);
  await laypluxPlugins.init();

  console.log('\n──── 通过 manager.toProxy() 在外部调用 ────');
  const termApi = (
    laypluxPlugins.toProxy() as Record<string, unknown> & { 'builtin.terminal': TerminalApi }
  )['builtin.terminal'];
  console.log(`外部拿到的目录 → ${termApi.getCurrentDir()}`);
}

export * from './plugin';
export * from './skeleton';
