import { computed, h, type Ref, type VNode } from 'vue';
import type { InteractionWidgetAlign, SkeletonConfig, SkeletonConfigType } from '../types';
import { createContent, uniqueId } from '../utils';
import { WidgetTitleView, WidgetView } from '../components';
import type { IWidgetContainer } from './widget-container';
import type { ISkeleton } from './skeleton';

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
  renderBody(): VNode | null;
  renderContent(): VNode | null;
  renderTitle(): VNode | null;
}

export function useWidget(
  config: SkeletonConfig,
  container?: IWidgetContainer<IWidget, any>,
  skeleton?: Pick<ISkeleton, 'focusedId'>, // ✅ 注入 skeleton 引用
): IWidget {
  const { name, props, type } = config;
  // 容器级激活态
  const active = computed(() => container?.activeId.value === name);
  // 全局唯一 focused 态
  const focused = computed(() => skeleton?.focusedId.value === name);

  const id: string = uniqueId(type);

  const align = props ? props.align : 'left';

  function renderBody() {
    const { content, contentProps } = config;
    const body = createContent(content, {
      ...contentProps,
      config,
      // TODO 将event传递进去
    });
    return body;
  }

  function renderContent() {
    return h(WidgetView, {
      key: id,
      widget,
    });
  }

  function renderTitle() {
    return h(WidgetTitleView, {
      key: id,
      widget,
    });
  }

  // 当是面板型组件时，渲染标题，当是交互型组件时，渲染空

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
