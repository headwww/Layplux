import { ref, type Ref } from 'vue';
import type { InteractionWidgetConfig, PanelWidgetConfig, SkeletonConfig } from '../types';
import type { LaypluxLocale } from '../types/locale';
import { useArea } from './area';
import type { IArea } from './area';
import { isWidget, useWidget, type IWidget } from './widget';
import { useWidgetContainer, type IWidgetContainer, type WidgetItem } from './widget-container';
import {
  FocusTracker,
  createPluginEventBus,
  type PluginEventBus,
  getBuiltInLocale,
} from '../utils';

export interface ISkeleton {
  widgets: IWidget[];
  topArea: IArea<InteractionWidgetConfig, IWidget>;
  bottomArea: IArea<InteractionWidgetConfig, IWidget>;
  leftTopArea: IArea<PanelWidgetConfig, IWidget>;
  leftBottomArea: IArea<PanelWidgetConfig, IWidget>;
  bottomLeftArea: IArea<PanelWidgetConfig, IWidget>;
  rightTopArea: IArea<PanelWidgetConfig, IWidget>;
  rightBottomArea: IArea<PanelWidgetConfig, IWidget>;
  bottomRightArea: IArea<PanelWidgetConfig, IWidget>;
  focusedId: Ref<string | null>;
  focusTracker: FocusTracker;
  event: PluginEventBus;
  locale: Ref<LaypluxLocale>;
  setLocale(name: string): void;
  theme: Ref<'light' | 'dark' | 'system'>;
  resolveTheme(): 'light' | 'dark';
  isDark(): boolean;
  setTheme(theme: 'light' | 'dark' | 'system'): void;
  toggleFocus(id: string): void;
  focus(id: string): void;
  blur(): void;
  add(widget: SkeletonConfig, extraConfig?: Record<string, any>): void;
  createContainer<T extends IWidget = IWidget, G extends WidgetItem = SkeletonConfig>(
    name: string,
    handle: (item: T | G, container: IWidgetContainer<T, T | G>) => T,
  ): IWidgetContainer<T, T | G>;
}

export function useSkeleton(): ISkeleton {
  const widgets: IWidget[] = [];

  const self = {} as ISkeleton;

  const containers = new Map<string, IWidgetContainer<any, any>>();

  const focusTracker = new FocusTracker();
  const event = createPluginEventBus('skeleton');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const locale = ref<LaypluxLocale>(getBuiltInLocale('zh-CN'));

  function setLocale(name: string) {
    locale.value = getBuiltInLocale(name);
  }

  const theme = ref<'light' | 'dark' | 'system'>('system');
  const systemDark = ref(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  );

  function resolveTheme(): 'light' | 'dark' {
    if (theme.value === 'system') {
      return systemDark.value ? 'dark' : 'light';
    }
    return theme.value;
  }

  function isDark(): boolean {
    return resolveTheme() === 'dark';
  }

  function setTheme(t: 'light' | 'dark' | 'system') {
    theme.value = t;
  }

  // 监听系统主题变化
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      systemDark.value = e.matches;
    });
  }

  // 顶部工具栏
  const topArea = useArea<InteractionWidgetConfig, IWidget>(
    {
      createContainer,
    },
    'topArea',
    (config, container) => createWidget(config, container),
  );

  // 底部状态栏
  const bottomArea = useArea<InteractionWidgetConfig, IWidget>(
    {
      createContainer,
    },
    'bottomArea',
    (config, container) => createWidget(config, container),
  );

  // 左侧顶部主区域
  const leftTopArea = useArea<PanelWidgetConfig, IWidget>(
    {
      createContainer,
    },
    'leftTopArea',
    (config, container) => createWidget(config, container),
  );

  // 左侧底部快捷区域
  const leftBottomArea = useArea<PanelWidgetConfig, IWidget>(
    {
      createContainer,
    },
    'leftBottomArea',
    (config, container) => createWidget(config, container),
  );

  // 右侧顶部主区域
  const rightTopArea = useArea<PanelWidgetConfig, IWidget>(
    { createContainer },
    'rightTopArea',
    (config, container) => createWidget(config, container),
  );

  // 右侧底部区域
  const rightBottomArea = useArea<PanelWidgetConfig, IWidget>(
    { createContainer },
    'rightBottomArea',
    (config, container) => createWidget(config, container),
  );

  // 右侧最底部快捷操作
  const bottomRightArea = useArea<PanelWidgetConfig, IWidget>(
    { createContainer },
    'bottomRightArea',
    (config, container) => createWidget(config, container),
  );

  // 左侧最底部快捷操作（交互型）
  const bottomLeftArea = useArea<PanelWidgetConfig, IWidget>(
    {
      createContainer,
    },
    'bottomLeftArea',
    (config, container) => createWidget(config, container),
  );

  function createWidget(
    config: SkeletonConfig | IWidget,
    container: IWidgetContainer<IWidget, any>,
  ): IWidget {
    if (isWidget(config)) {
      return config;
    }
    const widget = useWidget(config, container, self);
    widgets.push(widget);
    event.emitGlobal('skeleton:widget-added', { widget });
    return widget;
  }

  const focusedId = ref<string | null>(null);

  function toggleFocus(id: string) {
    if (focusedId.value === id) {
      blur();
    } else {
      focus(id);
    }
  }

  function focus(id: string) {
    focusedId.value = id;
    event.emitGlobal('skeleton:focus-changed', { focusedId: id });
  }

  function blur() {
    focusedId.value = null;
    event.emitGlobal('skeleton:focus-changed', { focusedId: null });
  }

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
    } else if (area === 'rightTopArea') {
      rightTopArea.add(config as PanelWidgetConfig);
    } else if (area === 'rightBottomArea') {
      rightBottomArea.add(config as PanelWidgetConfig);
    } else if (area === 'bottomRightArea') {
      bottomRightArea.add(config as PanelWidgetConfig);
    }
  }

  function createContainer<T extends IWidget = IWidget, G extends WidgetItem = SkeletonConfig>(
    name: string,
    handle: (item: T | G, container: IWidgetContainer<T, T | G>) => T,
  ): IWidgetContainer<T, T | G> {
    const container = useWidgetContainer<T, T | G>(handle, self);
    containers.set(name, container);
    return container;
  }

  // 4. 填充 self 的真正属性
  Object.assign(self, {
    widgets,
    topArea,
    bottomArea,
    leftTopArea,
    leftBottomArea,
    rightTopArea,
    rightBottomArea,
    bottomRightArea,
    bottomLeftArea,
    focusedId,
    focusTracker,
    event,
    locale,
    setLocale,
    theme,
    resolveTheme,
    isDark,
    setTheme,
    toggleFocus,
    focus,
    blur,
    add,
    createContainer,
  });

  return self;
}
