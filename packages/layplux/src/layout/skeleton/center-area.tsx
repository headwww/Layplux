import { computed, defineComponent, Teleport, type PropType } from 'vue';
import type { ISkeleton } from '../../managers';
import { PanelView } from '../../components';

export const CenterArea = defineComponent({
  name: 'CenterArea',
  props: {
    skeleton: Object as PropType<ISkeleton>,
  },
  setup(props) {
    // ─── 辅助：通过 activeId 找到对应 widget，读取 viewMode ───────────────
    function getActiveWidget(activeId: string | null) {
      if (!activeId) return null;
      return props.skeleton?.widgets.find((w) => w.name === activeId) ?? null;
    }

    // ─── 各区域可见性 ─────────────────────────────────────────────────────
    const isLeftVisible = computed(() => {
      const sk = props.skeleton;
      return (
        sk?.leftTopArea.container.activeId.value !== null ||
        sk?.leftBottomArea.container.activeId.value !== null
      );
    });

    const isLeftTopAreaVisible = computed(() => {
      const w = getActiveWidget(props.skeleton?.leftTopArea.container.activeId.value ?? null);
      return w?.pane.viewMode.value === 'DockPinned' || w?.pane.viewMode.value === 'DockUnpinned';
    });

    const isLeftBottomAreaVisible = computed(() => {
      const w = getActiveWidget(props.skeleton?.leftBottomArea.container.activeId.value ?? null);
      return w?.pane.viewMode.value === 'DockPinned' || w?.pane.viewMode.value === 'DockUnpinned';
    });

    const isUndockedVisible = computed(() => {
      const w = getActiveWidget(props.skeleton?.focusedId.value ?? null);
      // oxlint-disable-next-line no-constant-binary-expression
      return w?.pane.viewMode.value === 'Undock';
    });

    // ─── Teleport 目标 map，只在响应式依赖变化时重算 ─────────────────────
    const teleportTargets = computed(() => {
      const sk = props.skeleton;
      const map: Record<string, string> = {};
      if (!sk) return map;

      // 预先建好 widgetName -> side 的索引，避免在循环里重复 .some()
      const sideIndex = new Map<string, string>();
      sk.leftTopArea.container.items.value.forEach((w) =>
        sideIndex.set(w.name, '#left-undocked-area'),
      );
      sk.leftBottomArea.container.items.value.forEach((w) =>
        sideIndex.set(w.name, '#left-undocked-area'),
      );
      sk.rightTopArea.container.items.value.forEach((w) =>
        sideIndex.set(w.name, '#right-undocked-area'),
      );
      sk.rightBottomArea.container.items.value.forEach((w) =>
        sideIndex.set(w.name, '#right-undocked-area'),
      );

      // 预先建好 activeId -> anchor 的映射，O(1) 查找
      const dockTargets: Record<string, string> = {
        [sk.leftTopArea.container.activeId.value ?? '']: '#left-top-area',
        [sk.leftBottomArea.container.activeId.value ?? '']: '#left-bottom-area',
        [sk.rightTopArea.container.activeId.value ?? '']: '#right-top-area',
        [sk.rightBottomArea.container.activeId.value ?? '']: '#right-bottom-area',
      };
      delete dockTargets['']; // 清掉 null 产生的空 key

      sk.widgets
        .filter((w) => w.type === 'panel')
        .forEach((w) => {
          const viewMode = w.pane.viewMode.value;
          if (viewMode === 'Undock') {
            map[w.name] = sideIndex.get(w.name) ?? '#widget-offscreen';
          } else {
            map[w.name] = dockTargets[w.name] ?? '#widget-offscreen';
          }
        });

      return map;
    });

    return () => {
      if (!props.skeleton) return null;

      return (
        <div class="layplux-center-area">
          <div id="widget-offscreen" style="display:none;" />

          {props.skeleton.widgets
            .filter((w) => w.type === 'panel')
            .map((w) => (
              <Teleport
                defer
                key={w.name}
                to={teleportTargets.value[w.name] ?? '#widget-offscreen'}
              >
                {w.renderContent()}
              </Teleport>
            ))}

          <div class="layplux-center-area__main">
            <div class="layplux-center-area__left" v-show={isLeftVisible.value}>
              <div class="layplux-center-area__docked-panels">
                <PanelView anchor="left-top-area" v-show={isLeftTopAreaVisible.value} />
                <div class="layplux-separator" />
                <PanelView anchor="left-bottom-area" v-show={isLeftBottomAreaVisible.value} />
              </div>
              <PanelView anchor="left-undocked-area" v-show={isUndockedVisible.value} />
            </div>

            <div class="layplux-separator" />

            <div class="layplux-center-area__editor" />
          </div>
        </div>
      );
    };
  },
});
