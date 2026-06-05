// center-area.tsx

import { computed, defineComponent, Teleport, type PropType } from 'vue';
import type { ISkeleton } from '../../managers';
import { PanelView } from '../../components';

export const CenterArea = defineComponent({
  name: 'CenterArea',
  props: {
    skeleton: Object as PropType<ISkeleton>,
  },
  setup(props) {
    const isLeftVisible = computed(() => {
      return (
        props.skeleton?.leftTopArea.container.activeId.value !== null ||
        props.skeleton?.leftBottomArea.container.activeId.value !== null
      );
    });

    const isLeftTopAreaVisible = computed(() => {
      const widget = props.skeleton?.widgets.find(
        (w) => w.name === props.skeleton?.leftTopArea.container.activeId.value,
      );
      if (!widget) return false;
      return (
        widget.pane.viewMode.value === 'DockPinned' || widget.pane.viewMode.value === 'DockUnpinned'
      );
    });

    const isLeftBottomAreaVisible = computed(() => {
      const widget = props.skeleton?.widgets.find(
        (w) => w.name === props.skeleton?.leftBottomArea.container.activeId.value,
      );
      if (!widget) return false;
      return (
        widget.pane.viewMode.value === 'DockPinned' || widget.pane.viewMode.value === 'DockUnpinned'
      );
    });

    const isUndockedVisible = computed(() => {
      const widget = props.skeleton?.widgets.find(
        (w) => w.name === props.skeleton?.focusedId.value,
      );
      if (!widget) return false;
      return widget.pane.viewMode.value === 'Undock';
    });

    /**
     * 计算每个 panel widget 的 Teleport 目标锚点
     * 优先级：Undock > DockPinned/DockUnpinned（按所属 area）
     */
    function getTeleportTarget(widgetName: string): string | null {
      const sk = props.skeleton;
      if (!sk) return null;

      const widget = sk.widgets.find((w) => w.name === widgetName);
      if (!widget) return null;

      const viewMode = widget.pane.viewMode.value;

      // Undock 模式：统一传送到 undocked 锚点
      // 只有当前 focused 的 widget 才显示在 undocked 区域
      if (viewMode === 'Undock') {
        // 判断属于左侧还是右侧，分别用不同的 undocked 锚点
        if (
          sk.leftTopArea.container.items.value.some((w) => w.name === widgetName) ||
          sk.leftBottomArea.container.items.value.some((w) => w.name === widgetName)
        ) {
          return '#left-undocked-area';
        }
        if (
          sk.rightTopArea.container.items.value.some((w) => w.name === widgetName) ||
          sk.rightBottomArea.container.items.value.some((w) => w.name === widgetName)
        ) {
          return '#right-undocked-area';
        }
        return null;
      }

      // DockPinned / DockUnpinned：传送到所属 area 的锚点
      // 只有当该 area 的 activeId 是自己时，才是"激活"的目标
      if (sk.leftTopArea.container.activeId.value === widgetName) {
        return '#left-top-area';
      }
      if (sk.leftBottomArea.container.activeId.value === widgetName) {
        return '#left-bottom-area';
      }
      if (sk.rightTopArea.container.activeId.value === widgetName) {
        return '#right-top-area';
      }
      if (sk.rightBottomArea.container.activeId.value === widgetName) {
        return '#right-bottom-area';
      }

      // 未激活的 widget：传送到一个隐藏容器，保活但不显示
      return '#widget-offscreen';
    }

    return () => {
      if (!props.skeleton) return null;

      return (
        <div class="layplux-center-area">
          {/* 离屏保活容器，未激活的 widget content 藏在这里 */}
          <div id="widget-offscreen" style="display:none;" />

          {/* 所有 panel widget 统一在这里声明 Teleport，to 动态计算 */}
          {props.skeleton.widgets
            .filter((w) => w.type === 'panel')
            .map((w) => {
              const to = getTeleportTarget(w.name);
              // to 为 null 说明锚点还没挂载（理论上不应发生），fallback 到离屏
              return (
                <Teleport defer key={w.id} to={to ?? '#widget-offscreen'}>
                  {w.renderContent()}
                </Teleport>
              );
            })}

          {/* ── 上半区：左面板 + 编辑器 + 右面板 ── */}
          <div class="layplux-center-area__main">
            {/* 左侧面板 */}
            <div class="layplux-center-area__left" v-show={isLeftVisible.value}>
              <div class="layplux-center-area__docked-panels">
                <PanelView anchor="left-top-area" v-show={isLeftTopAreaVisible.value} />
                <div class="layplux-separator" />
                <PanelView anchor="left-bottom-area" v-show={isLeftBottomAreaVisible.value} />
              </div>
              <PanelView anchor="left-undocked-area" v-show={isUndockedVisible.value} />
            </div>

            <div class="layplux-separator" />

            {/* 编辑器 */}
            <div class="layplux-center-area__editor" />
          </div>
        </div>
      );
    };
  },
});
