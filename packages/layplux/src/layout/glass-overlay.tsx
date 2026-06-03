import { defineComponent } from 'vue';

/**
 * 玻璃面板（GlassOverlay）是Layplux中的一个重要组件，它位于整个界面的最顶层，覆盖在所有其他内容之上。
 * 这个组件的主要作用是提供一个透明的层，用于捕获用户的交互事件，例如鼠标点击、拖动等。
 * 通过玻璃面板，Layplux能够实现一些特殊的交互效果，比如拖放操作、全局事件监听等。
 * 玻璃面板就像一层透明的保护膜，既能保护底层内容，又能提供丰富的交互功能，使得用户界面更加灵活和响应式。
 */
export const GlassOverlay = defineComponent({
  name: 'GlassOverlay',
  setup() {
    return () => <div></div>;
  },
});
