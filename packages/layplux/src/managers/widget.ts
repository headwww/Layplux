import { h, type VNode } from 'vue';
import type { InteractionWidgetAlign, InteractionWidgetConfig, SkeletonConfig } from '../types';
import { createContent, uniqueId } from '../utils';
import { WidgetView } from '../components';

export interface IWidget {
  readonly id: string;
  readonly isWidget: true;
  readonly name: string;
  readonly align?: InteractionWidgetAlign;
  readonly config: SkeletonConfig;
  renderBody(): VNode | null;
  renderContent(): VNode | null;
}

export function useWidget(config: InteractionWidgetConfig): IWidget {
  const id: string = uniqueId('widget');
  const { name, props } = config;
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

  const widget: IWidget = {
    id,
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
