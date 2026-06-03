import { ref, type Ref } from 'vue';

export interface WidgetItem {
  name: string;
}

export interface IWidgetContainer<T, G> {
  add(item: T | G): T;
  get(name: string): T | null;
  getAt(index: number): T | null;
  indexOf(item: T): number;
  items: Ref<T[]>;
}

/**
 * widget container 用于管理 widget 的添加、删除、获取等操作
 * T 为 widget 的类型
 * G 为 widgetconfig 的配置类型
 */
export function useWidgetContainer<T extends WidgetItem = any, G extends WidgetItem = any>(
  handle: (item: T | G) => T,
): IWidgetContainer<T, G> {
  const maps: { [name: string]: T } = {};

  const items: Ref<T[]> = ref([]);

  function add(item: T | G): T {
    // 将config转换为widget,将创建widget的能力交给外部
    const nItem = handle(item);
    const origin = get(nItem.name);
    if (origin === nItem) {
      return origin;
    }
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

  return {
    add,
    get,
    getAt,
    indexOf,
    items,
  };
}
