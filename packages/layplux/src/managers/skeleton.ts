import type { InteractionWidgetConfig, PanelWidgetConfig, SkeletonConfig } from '../types';
import { useArea } from './area';
import type { IArea } from './area';
import { isWidget, useWidget, type IWidget } from './widget';
import { useWidgetContainer, type IWidgetContainer, type WidgetItem } from './widget-container';

export interface ISkeleton {
  topArea: IArea<InteractionWidgetConfig, IWidget>;
  bottomArea: IArea<InteractionWidgetConfig, IWidget>;
  leftTopArea: IArea<PanelWidgetConfig, IWidget>;
  leftBottomArea: IArea<PanelWidgetConfig, IWidget>;
  bottomLeftArea: IArea<PanelWidgetConfig, IWidget>;
  add(widget: SkeletonConfig, extraConfig?: Record<string, any>): void;
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

  // 底部状态栏
  const bottomArea = useArea<InteractionWidgetConfig, IWidget>(
    {
      createContainer,
    },
    'bottomArea',
    (config) => {
      if (isWidget(config)) {
        return config;
      }
      return useWidget(config);
    },
  );

  // 左侧顶部主区域
  const leftTopArea = useArea<PanelWidgetConfig, IWidget>(
    {
      createContainer,
    },
    'leftTopArea',
    (config) => {
      if (isWidget(config)) {
        return config;
      }
      return useWidget(config);
    },
  );

  // 左侧底部快捷区域
  const leftBottomArea = useArea<PanelWidgetConfig, IWidget>(
    {
      createContainer,
    },
    'leftBottomArea',
    (config) => {
      if (isWidget(config)) {
        return config;
      }
      return useWidget(config);
    },
  );

  // 左侧最底部快捷操作（交互型）
  const bottomLeftArea = useArea<PanelWidgetConfig, IWidget>(
    {
      createContainer,
    },
    'bottomLeftArea',
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
    } else if (area === 'bottomArea') {
      bottomArea.add(config as InteractionWidgetConfig);
    } else if (area === 'leftTopArea') {
      leftTopArea.add(config as PanelWidgetConfig);
    } else if (area === 'leftBottomArea') {
      leftBottomArea.add(config as PanelWidgetConfig);
    } else if (area === 'bottomLeftArea') {
      bottomLeftArea.add(config as PanelWidgetConfig);
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
    bottomArea,
    leftTopArea,
    leftBottomArea,
    bottomLeftArea,
    add,
    createContainer,
  };
}
