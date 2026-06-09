import { computed, h, type Ref, type VNode } from 'vue';
import type { InteractionWidgetAlign, SkeletonConfig, SkeletonConfigType } from '../types';
import { createContent, uniqueId } from '../utils';
import { WidgetTitleView, WidgetView } from '../components';
import type { IWidgetContainer } from './widget-container';
import type { ISkeleton } from './skeleton';
import { usePane, type IPane } from './pane';
import type { Focusable } from '../utils';

export interface IWidget {
  readonly type?: SkeletonConfigType;
  readonly id: string;
  readonly isWidget: true;
  readonly name: string;
  readonly align?: InteractionWidgetAlign;
  readonly config: SkeletonConfig;
  readonly active: Ref<boolean>;
  readonly focused: Ref<boolean>;
  readonly container?: IWidgetContainer<IWidget, any>;
  readonly pane: IPane;
  readonly focusable: Focusable;
  renderBody(): VNode | null;
  renderContent(): VNode | null;
  renderTitle(): VNode | null;
}

export function useWidget(
  config: SkeletonConfig,
  container?: IWidgetContainer<IWidget, any>,
  skeleton?: Pick<ISkeleton, 'focusedId' | 'focus' | 'blur' | 'focusTracker'>,
): IWidget {
  const { name, props, type } = config;

  const active = computed(() => container?.activeId.value === name);
  const focused = computed(() => skeleton?.focusedId.value === name);

  const id: string = uniqueId(type);
  const align = props?.align ?? 'left';
  const pane = usePane();

  // ─── Focusable 注册 ──────────────────────────────────────────────────────
  // range 初始为 () => false，PanelView 挂载后通过 focusable.setRange(el) 注入真实 DOM
  const focusable = skeleton!.focusTracker.create({
    range: (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) {
        return false;
      }
      // 当点击的是panel时，激活
      const el = document.getElementById(id);
      if (el?.contains(target)) {
        return true;
      }
      // 当class中包含layplux-resize-handle则不失去焦点
      if (target.classList.contains('layplux-resize-handle')) {
        return true;
      }
      return false;
    },

    onActive: () => {
      widget.container?.activate(name);
    },

    onBlur: () => {
      // 焦点离开 → 清除 focusedId
      skeleton!.blur();
      // DockUnpinned：失焦自动收起
      if (pane.viewMode.value === 'DockUnpinned' || pane.viewMode.value === 'Undock') {
        container?.deactivate();
      }
    },
  });

  function renderBody() {
    const { content, contentProps } = config;
    return createContent(content, { ...contentProps, config });
  }

  function renderContent() {
    return h(WidgetView, { key: id, widget });
  }

  function renderTitle() {
    return h(WidgetTitleView, { key: id, widget });
  }

  const widget: IWidget = {
    id,
    type,
    isWidget: true,
    name,
    align,
    config,
    active,
    focused,
    container,
    pane,
    focusable,
    renderBody,
    renderContent,
    renderTitle,
  };

  props?.onInit?.(widget);
  return widget;
}

export function isWidget(obj: any): obj is IWidget {
  return obj && obj.isWidget;
}
