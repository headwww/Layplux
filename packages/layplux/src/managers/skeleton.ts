import type { InteractionWidgetConfig, SkeletonConfig } from '../types';
import { useArea } from './area';
import type { IArea } from './area';
import { isWidget, useWidget, type IWidget } from './widget';
import { useWidgetContainer, type IWidgetContainer, type WidgetItem } from './widget-container';

export interface ISkeleton {
  add(widget: SkeletonConfig, extraConfig?: Record<string, any>): void;
  topArea: IArea<InteractionWidgetConfig, IWidget>;
  createContainer<T extends IWidget = IWidget, G extends WidgetItem = SkeletonConfig>(
    name: string,
    handle: (item: T | G) => T,
  ): IWidgetContainer<T, T | G>;
}

export function useSkeleton(): ISkeleton {
  const containers = new Map<string, IWidgetContainer<any, any>>();

  // 顶部工具栏
  const topArea = useArea<InteractionWidgetConfig, IWidget>(
    {
      add,
      createContainer,
    },
    'topArea',
    (config) => {
      if (isWidget(config)) {
        return config;
      }
      return useWidget(config);
    },
  );

  function add(config: SkeletonConfig, extraConfig?: Record<string, any>): void {
    // TODO: 处理extraConfig
    if (extraConfig) {
      config = { ...config, ...extraConfig };
    }
    const { area } = config;
    if (area === 'topArea') {
      topArea.add(config as InteractionWidgetConfig);
    }
  }

  function createContainer<T extends IWidget = IWidget, G extends WidgetItem = SkeletonConfig>(
    name: string,
    handle: (item: T | G) => T,
  ): IWidgetContainer<T, T | G> {
    const container = useWidgetContainer<T, T | G>(handle);
    containers.set(name, container);
    return container;
  }

  return {
    topArea,
    add,
    createContainer,
  };
}
