import { defineComponent, type PropType } from 'vue';
import type { IWidget } from '../../managers';
import type { ViewMode } from '../../managers/pane';

/**
 * PanelView — 面板壳子
 * 提供标题栏（含 viewMode 切换按钮）+ Teleport 锚点
 */
export const PanelView = defineComponent({
  name: 'PanelView',
  props: {
    /** Teleport 锚点 id */
    anchor: String,
    /** 面板标题（由外部传入当前激活 widget 的 name） */
    title: String,
    /** 当前激活的 widget，用于读写 pane.viewMode */
    widget: Object as PropType<IWidget>,
  },
  setup(props) {
    const modes: { mode: ViewMode; label: string; title: string }[] = [
      { mode: 'DockPinned', label: '📌', title: 'Dock Pinned — 固定展开' },
      { mode: 'DockUnpinned', label: '📎', title: 'Dock Unpinned — 失焦自动关闭' },
      { mode: 'Undock', label: '⧉', title: 'Undock — 悬浮在编辑器上方' },
    ];

    return () => {
      const currentMode = props.widget?.pane.viewMode.value;

      return (
        <div class="layplux-panel">
          <div class="layplux-panel__header">
            <span class="layplux-panel__title">{props.title ?? props.widget?.name}</span>
            <div class="layplux-panel__actions">
              {modes.map(({ mode, label, title }) => (
                <button
                  key={mode}
                  class={[
                    'layplux-panel__action-btn',
                    { 'layplux-panel__action-btn--active': currentMode === mode },
                  ]}
                  title={title}
                  onClick={() => props.widget?.pane.setViewMode(mode)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div id={props.anchor} class="layplux-panel__body" />
        </div>
      );
    };
  },
});
