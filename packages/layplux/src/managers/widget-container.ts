import { ref, type Ref } from 'vue';

export interface WidgetItem {
  name: string;
}

export interface IWidgetContainer<T, G> {
  add(item: T | G): T;
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
  const items: Ref<T[]> = ref([]);

  function add(item: T | G): T {
    // 将config转换为widget,将创建widget的能力交给外部
    const nItem = handle(item);

    items.value.push(nItem);

    return nItem;
  }

  return {
    add,
    items,
  };
}
