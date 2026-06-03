import type { WidgetBaseConfig } from '../types';
import type { ISkeleton } from './skeleton';
import type { IWidget } from './widget';
import { type IWidgetContainer } from './widget-container';

export interface IArea<C, W> {
  add(config: C | W): W;
  container: IWidgetContainer<W, C | W>;
}

/**
 * `useArea` 只需要 skeleton 的 `createContainer` 能力，
 * 不依赖完整的 ISkeleton（避免创建时的循环依赖）。
 */
export function useArea<C extends WidgetBaseConfig = any, W extends IWidget = IWidget>(
  skeleton: Pick<ISkeleton, 'createContainer'>,
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
