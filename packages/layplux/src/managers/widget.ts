import { h, type VNode } from 'vue';
import type { InteractionWidgetAlign, SkeletonConfig, SkeletonConfigType } from '../types';
import { createContent, uniqueId } from '../utils';
import { WidgetView } from '../components';

export interface IWidget {
  readonly type?: SkeletonConfigType;
  readonly id: string;
  readonly isWidget: true;
  readonly name: string;
  readonly align?: InteractionWidgetAlign;
  readonly config: SkeletonConfig;
  renderBody(): VNode | null;
  renderContent(): VNode | null;
}

export function useWidget(config: SkeletonConfig): IWidget {
  const { name, props, type } = config;

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

  // 当是面板型组件时，渲染标题，当是交互型组件时，渲染空

  const widget: IWidget = {
    id,
    type,
    isWidget: true,
    name,
    align,
    config,
    renderBody,
    renderContent,
  };
  props?.onInit?.(widget);
  return widget;
}

export function isWidget(obj: any): obj is IWidget {
  return obj && obj.isWidget;
}
