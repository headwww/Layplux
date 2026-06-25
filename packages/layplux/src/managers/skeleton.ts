import { ref, type Ref } from 'vue';
import type {
  CenterWidgetConfig,
  InteractionWidgetConfig,
  PanelWidgetConfig,
  SkeletonConfig,
} from '../types';
import type { SkeletonState } from '../types/state';
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
import { injectThemeCSS } from './theme';
import type { ViewMode } from './pane';

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
  centerArea: IArea<CenterWidgetConfig, IWidget>;
  focusedId: Ref<string | null>;
  focusTracker: FocusTracker;
  event: PluginEventBus;
  locale: Ref<LaypluxLocale>;
  setLocale(name: string): void;
  theme: Ref<'light' | 'dark' | 'system'>;
  resolveTheme(): 'light' | 'dark';
  isDark(): boolean;
  setTheme(theme: 'light' | 'dark' | 'system'): void;
  readonly themeName: Ref<string>;
  setThemeName(name: string): void;
  registerTheme(name: string, vars: Record<string, string>): void;
  toggleFocus(id: string): void;
  focus(id: string): void;
  blur(): void;
  add(widget: SkeletonConfig, extraConfig?: Record<string, any>): void;
  createContainer<T extends IWidget = IWidget, G extends WidgetItem = SkeletonConfig>(
    name: string,
    handle: (item: T | G, container: IWidgetContainer<T, T | G>) => T,
  ): IWidgetContainer<T, T | G>;

  // ─── 持久化状态 ────────────────────────────────────────────────
  leftWidth: Ref<number>;
  rightWidth: Ref<number>;
  bottomHeight: Ref<number>;
  leftSplitRatio: Ref<number>;
  rightSplitRatio: Ref<number>;
  bottomSplitRatio: Ref<number>;
  getState(): SkeletonState;
  notifyStateChange(debounce?: boolean): void;
}

export interface SkeletonOptions {
  initialState?: Partial<SkeletonState>;
}

export function useSkeleton(options?: SkeletonOptions): ISkeleton {
  const { initialState } = options || {};
  const widgets: IWidget[] = [];

  const self = {} as ISkeleton;

  const containers = new Map<string, IWidgetContainer<any, any>>();

  // ─── 持久化状态 refs ────────────────────────────────────────────
  const leftWidth = ref(initialState?.leftWidth ?? 340);
  const rightWidth = ref(initialState?.rightWidth ?? 340);
  const bottomHeight = ref(initialState?.bottomHeight ?? 300);
  const leftSplitRatio = ref(initialState?.leftSplitRatio ?? 0.5);
  const rightSplitRatio = ref(initialState?.rightSplitRatio ?? 0.5);
  const bottomSplitRatio = ref(initialState?.bottomSplitRatio ?? 0.5);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function getState(): SkeletonState {
    const viewModes: Record<string, ViewMode> = {};
    widgets.forEach((w) => {
      if (w.type === 'panel') {
        viewModes[w.name] = w.pane.viewMode.value;
      }
    });

    const activeIds: Record<string, string | null> = {};
    containers.forEach((container, name) => {
      activeIds[name] = container.activeId.value;
    });

    return {
      leftWidth: leftWidth.value,
      rightWidth: rightWidth.value,
      bottomHeight: bottomHeight.value,
      leftSplitRatio: leftSplitRatio.value,
      rightSplitRatio: rightSplitRatio.value,
      bottomSplitRatio: bottomSplitRatio.value,
      viewModes,
      activeIds,
    };
  }

  function emitState() {
    event.emitGlobal('skeleton:state-changed', getState());
  }

  function notifyStateChange(debounce = false) {
    if (debounce) {
      if (debounceTimer !== null) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(emitState, 300);
    } else {
      emitState();
    }
  }

  const focusTracker = new FocusTracker();
  const event = createPluginEventBus('skeleton');

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

  const themeName = ref<string>('default');

  function setThemeName(name: string) {
    themeName.value = name;
  }

  function registerTheme(name: string, vars: Record<string, string>) {
    injectThemeCSS(name, vars);
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

  // 中心区域
  const centerArea = useArea<CenterWidgetConfig, IWidget>(
    { createContainer },
    'centerArea',
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
    } else if (area === 'centerArea') {
      centerArea.add(config as CenterWidgetConfig);
    }
  }

  function createContainer<T extends IWidget = IWidget, G extends WidgetItem = SkeletonConfig>(
    name: string,
    handle: (item: T | G, container: IWidgetContainer<T, T | G>) => T,
  ): IWidgetContainer<T, T | G> {
    const container = useWidgetContainer<T, T | G>(handle, self, name);
    containers.set(name, container);

    const initialActiveId = initialState?.activeIds?.[name];
    if (initialActiveId) {
      container.activeId.value = initialActiveId;
    }

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
    centerArea,
    focusedId,
    focusTracker,
    event,
    locale,
    setLocale,
    theme,
    resolveTheme,
    isDark,
    setTheme,
    themeName,
    setThemeName,
    registerTheme,
    toggleFocus,
    focus,
    blur,
    add,
    createContainer,
    // 持久化状态
    leftWidth,
    rightWidth,
    bottomHeight,
    leftSplitRatio,
    rightSplitRatio,
    bottomSplitRatio,
    getState,
    notifyStateChange,
  });

  return self;
}
