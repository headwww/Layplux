import { ref, type Ref } from 'vue';
import type { ISkeleton } from './skeleton';

export interface WidgetItem {
  name: string;
  focusable?: any;
}

export interface IWidgetContainer<T, G> {
  add(item: T | G): T;
  get(name: string): T | null;
  getAt(index: number): T | null;
  indexOf(item: T): number;
  remove(name: string): T | null;
  items: Ref<T[]>;
  activeId: Ref<string | null>; // 替代分散在每个 widget 上的 active
  /** 激活指定 widget，互斥，其他自动关闭 */
  activate(id: string): void;
  /** 取消激活 */
  deactivate(): void;
  /** 切换激活 */
  toggleActive(id: string): void;
}

/**
 * handle 函数签名：把原始 item（config 或 widget）转换成 widget 实例。
 * 第二个参数是所属 container 的引用，方便在创建 widget 时回引。
 */
export type WidgetContainerHandle<T extends WidgetItem, G extends WidgetItem> = (
  item: T | G,
  container: IWidgetContainer<T, G>,
) => T;

/**
 * widget container 用于管理 widget 的添加、删除、获取等操作
 * T 为 widget 的类型
 * G 为 widgetconfig 的配置类型
 */
export function useWidgetContainer<T extends WidgetItem = any, G extends WidgetItem = any>(
  handle: WidgetContainerHandle<T, G>,
  skeleton: ISkeleton,
): IWidgetContainer<T, G> {
  const maps: { [name: string]: T } = {};
  const items: Ref<T[]> = ref([]);
  const activeId = ref<string | null>(null); // ✅ 单一数据源

  const self: IWidgetContainer<T, G> = {
    items,
    activeId,
    add,
    get,
    getAt,
    indexOf,
    remove,
    activate,
    deactivate,
    toggleActive,
  };

  function add(item: T | G): T {
    // 将config转换为widget,将创建widget的能力交给外部，并把 container 自身传出去
    const nItem = handle(item, self);
    const origin = get(nItem.name);
    if (origin === nItem) return origin;
    const i = origin ? items.value.indexOf(origin) : -1;
    if (i > -1) {
      items.value.splice(i, 1, nItem);
    } else {
      items.value.push(nItem);
    }
    maps[nItem.name] = nItem;
    return nItem;
  }

  function get(name: string): T | null {
    return maps[name] || null;
  }

  function getAt(index: number): T | null {
    return items.value[index] || null;
  }

  function indexOf(item: T): number {
    return items.value.indexOf(item);
  }

  function remove(name: string): T | null {
    const item = maps[name];
    if (!item) return null;
    const i = items.value.indexOf(item);
    if (i > -1) items.value.splice(i, 1);
    delete maps[name];
    skeleton.event.emitGlobal('skeleton:widget-removed', { name });
    return item;
  }

  function activate(id: string): void {
    if (!maps[id]) return;
    activeId.value = id;
    skeleton.focus(id);
    maps[id].focusable.active(); // 面板激活 → 同步焦点栈
    skeleton.event.emitGlobal(`widget:${id}:activated`, { widget: maps[id] });
  }

  function deactivate(): void {
    const current = activeId.value;
    activeId.value = null;
    skeleton.blur();
    if (current && maps[current]) {
      maps[current].focusable.suspense(); // 面板收起 → 从焦点栈移除
      skeleton.event.emitGlobal(`widget:${current}:deactivated`, { widget: maps[current] });
    }
  }

  function toggleActive(id: string): void {
    if (activeId.value === id) {
      deactivate();
    } else {
      activate(id);
    }
  }

  return self;
}
