import { defineComponent, type PropType } from 'vue';
import type { IWidgetContainer } from '../../managers/widget-container';
import type { IWidget } from '../../managers/widget';

/** 追踪已渲染过的 widget，全局复用，不因 v-show 销毁 */
const renderedWidgets = new WeakMap<IWidgetContainer<any, any>, Set<string>>();

function ensureRendered(container: IWidgetContainer<any, any>, widget: IWidget) {
  let set = renderedWidgets.get(container);
  if (!set) {
    set = new Set();
    renderedWidgets.set(container, set);
  }
  if (!set.has(widget.name)) {
    set.add(widget.name);
  }
  return set;
}

export const PanelView = defineComponent({
  name: 'PanelView',
  inheritAttrs: false,
  props: {
    container: {
      type: Object as PropType<IWidgetContainer<IWidget, any>>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const c = props.container;
      const rendered = ensureRendered(c, c.items.value[0]!);

      // 每次渲染时把当前激活的加入 rendered
      const activeWidget = c.activeId.value
        ? (c.items.value.find((w) => w.name === c.activeId.value) ?? null)
        : null;
      if (activeWidget) {
        rendered.add(activeWidget.name);
      }

      return (
        <div class="layplux-panel">
          <div class="layplux-panel__body">
            {c.items.value
              .filter((w) => rendered.has(w.name))
              .map((w) => (
                <div
                  key={w.name}
                  v-show={c.activeId.value === w.name}
                  class="layplux-panel__content"
                >
                  {w.renderContent()}
                </div>
              ))}
          </div>
        </div>
      );
    };
  },
});
