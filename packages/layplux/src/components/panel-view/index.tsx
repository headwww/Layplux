import { defineComponent, type PropType } from 'vue';
import type { IWidget } from '../../managers';

/**
 * PanelView — 面板壳子
 * 只提供标题栏 + Teleport 锚点，不管理内容渲染
 */
export const PanelView = defineComponent({
  name: 'PanelView',
  props: {
    /** Teleport 锚点 id，widget content 通过 Teleport 注入到这里 */
    anchor: String,
    /** 面板标题 */
    title: String,
    widget: Object as PropType<IWidget>,
  },
  setup(props) {
    return () => (
      <div class="layplux-panel">
        <div class="layplux-panel__header">
          <button onClick={() => props.widget?.pane.setViewMode('DockPinned')}>
            切换模式：DockPinned
          </button>
          <button onClick={() => props.widget?.pane.setViewMode('DockUnpinned')}>
            切换模式：DockUnpinned
          </button>
          <button onClick={() => props.widget?.pane.setViewMode('Undock')}>切换模式：Undock</button>
          <span class="layplux-panel__title">{props.title}</span>
        </div>
        <div id={props.anchor} class="layplux-panel__body" />
      </div>
    );
  },
});
