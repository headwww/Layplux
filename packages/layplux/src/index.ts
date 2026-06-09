// 组件
export { default as Layplux } from './layout/layplux';

// 核心 composable
export { useSkeleton } from './managers/skeleton';

// 核心接口类型
export type { ISkeleton, IWidget, IWidgetContainer } from './managers';
export type { IArea } from './managers/area';
export type { IPane, ViewMode } from './managers/pane';

// 配置类型
export type {
  SkeletonConfig,
  SkeletonConfigArea,
  SkeletonConfigType,
  WidgetBaseConfig,
  PanelWidgetConfig,
  PanelWidgetProps,
  InteractionWidgetConfig,
  InteractionWidgetProps,
  CenterWidgetConfig,
  CenterWidgetProps,
} from './types';

// 工具
export { createPluginEventBus } from './utils/event-bus';
export type { PluginEventBus } from './utils/event-bus';
export { FocusTracker } from './utils/focus-tracker';
