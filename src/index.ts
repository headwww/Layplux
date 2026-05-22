import { Skeleton } from './skeleton';
import {
  PluginManager,
  type ContextApiAssembler,
  definePlugin,
} from './plugin';

interface LaypluxServices {
  skeleton: Skeleton;
}

const LaypluxAssembler: ContextApiAssembler<LaypluxServices> = {
  assembleServices(_pluginName, _meta) {
    return {
      skeleton: new Skeleton(),
    };
  },
};

export const laypluxPlugins = new PluginManager<LaypluxServices>({
  assembler: LaypluxAssembler,
});

const examplePlugin = definePlugin<LaypluxServices>(
  {
    pluginName: 'builtin.terminal',
  },
  (ctx) => ({
    setup(ctx) {
      ctx.services.skeleton;
    },
    exports: {
      runCommand: (cmd: string) => ctx.event.emit('execute', cmd),
    },
  }),
);

laypluxPlugins.register(examplePlugin);

console.log(laypluxPlugins);

export * from './plugin';
export * from './skeleton';
