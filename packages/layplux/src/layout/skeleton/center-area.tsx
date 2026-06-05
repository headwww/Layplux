import { computed, defineComponent, type PropType } from 'vue';
import type { ISkeleton } from '../../managers';
import { PanelView } from '../../components';

/**
 * 左侧，宽度可拖拽的，整个左侧左上左下的几种模式的面吧尺寸是共享的，高度在DockPinned并且打开了左上和左下两个面板的时候是可以调整两个面板尺寸的，其他情况是固定高度
 * 右侧，宽度可拖拽的，整个右侧右上右下的几种模式的面吧尺寸是共享的，高度在DockPinned并且打开了右上和右下两个面板的时候是可以调整两个面板尺寸的，其他情况是固定高度
 * 底部，高度的逻辑等于左右两侧宽度的逻辑
 */
export const CenterArea = defineComponent({
  name: 'CenterArea',
  props: {
    skeleton: Object as PropType<ISkeleton>,
  },
  setup(props) {
    // 写一个计算属性判断整个layplux-center-area__left是否显示
    const isLeftVisible = computed(() => {
      return (
        props.skeleton?.leftTopArea.container.activeId.value !== null ||
        props.skeleton?.leftBottomArea.container.activeId.value !== null
      );
    });

    const isLeftTopAreaVisible = computed(() => {
      // 找到这个widget，判断下当前的pane的viewmode
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

    return () => {
      if (!props.skeleton) return null;
      return (
        <div class="layplux-center-area">
          {/* ── 上半区：左面板 + 编辑器 + 右面板 ── */}
          <div class="layplux-center-area__main">
            {/* 左侧面板 */}
            <div class="layplux-center-area__left" v-show={isLeftVisible.value}>
              <div class="layplux-center-area__docked-panels">
                {/* 左侧上部分面板 */}
                <PanelView v-show={isLeftTopAreaVisible.value} title="Left Top Area" />
                <div class="layplux-separator" />
                {/* 左侧下部分面板 */}
                <PanelView v-show={isLeftBottomAreaVisible.value} title="Left Bottom Area" />
              </div>
              {/* 左侧undocked面板 */}
              <PanelView v-show={isUndockedVisible.value} />
            </div>

            <div class="layplux-separator" />

            {/* 编辑器 */}
            <div class="layplux-center-area__editor" />

            {/* 右侧面板 */}
            {/* <div class="layplux-center-area__right">
              <PanelView />
              <PanelView />
            </div> */}
          </div>

          {/* ── 下半区：底部面板 ── */}
          {/* <div class="layplux-center-area__bottom">
            <PanelView />
            <PanelView />
          </div> */}
        </div>
      );
    };
  },
});
