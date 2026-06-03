import type { WidgetBaseConfig } from '../types';
import type { ISkeleton } from './skeleton';
import type { IWidget } from './widget';
import { type IWidgetContainer } from './widget-container';

export interface IArea<C, W> {
  add(config: C | W): W;
  container: IWidgetContainer<W, C | W>;
}

/**
 * 把整个容器分为不同的区域，每个区域可以包含一个或多个Widget，
 * C 是widget的配置类型
 * W 是widget的实例类型
 */
export function useArea<C extends WidgetBaseConfig = any, W extends IWidget = IWidget>(
  skeleton: Omit<ISkeleton, 'topArea'>,
  name: string,
  handle: (item: C | W) => W,
): IArea<C, W> {
  const container = skeleton.createContainer(name, handle);

  function add(config: C | W): W {
    const item = container.add(config);
    return item;
  }

  return { add, container };
}
