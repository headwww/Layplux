import { h, isVNode, cloneVNode, Text, type VNode, type Component } from 'vue';

export function createContent(
  content?: VNode | Component | string,
  extraProps: Record<string, unknown> = {},
) {
  if (content === null) return null;

  // 1. 是 VNode -> 克隆并合并属性
  if (isVNode(content)) {
    return cloneVNode(content, extraProps);
  }

  // 2. 是字符串
  if (typeof content === 'string') {
    // 如果需要附加属性，则包裹在 span 中
    if (Object.keys(extraProps).length > 0) {
      return h(content, extraProps, content);
    }
    // 否则创建纯文本节点，避免多余 DOM
    return h(Text, null, content);
  }

  // 3. 否则视为组件（对象或函数）
  return h(content as Component, extraProps);
}
