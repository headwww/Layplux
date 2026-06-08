import { computed, defineComponent, ref, Teleport, type PropType } from 'vue';
import type { ISkeleton } from '../../managers';
import { PanelView } from '../../components';

export const CenterArea = defineComponent({
  name: 'CenterArea',
  props: {
    skeleton: Object as PropType<ISkeleton>,
  },
  setup(props) {
    // ─── 面板尺寸状态 ─────────────────────────────────────────────────────
    const leftWidth = ref(240);
    const rightWidth = ref(240);
    const bottomHeight = ref(200);

    // 上下 / 左右内部分割比例 (0~1)
    const leftSplitRatio = ref(0.5);
    const rightSplitRatio = ref(0.5);
    const bottomSplitRatio = ref(0.5);

    // ─── 通用拖拽 ─────────────────────────────────────────────────────────
    function startDrag(e: MouseEvent, axis: 'x' | 'y', onMove: (delta: number) => void) {
      e.preventDefault();
      const startPos = axis === 'x' ? e.clientX : e.clientY;
      const onMouseMove = (ev: MouseEvent) =>
        onMove((axis === 'x' ? ev.clientX : ev.clientY) - startPos);
      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    // 左侧整体宽度
    function dragLeftWidth(e: MouseEvent) {
      const base = leftWidth.value;
      startDrag(e, 'x', (d) => {
        leftWidth.value = Math.max(160, Math.min(600, base + d));
      });
    }
    // 右侧整体宽度（向左拖拽变宽，delta 取反）
    function dragRightWidth(e: MouseEvent) {
      const base = rightWidth.value;
      startDrag(e, 'x', (d) => {
        rightWidth.value = Math.max(160, Math.min(600, base - d));
      });
    }
    // 底部整体高度（向上拖拽变高，delta 取反）
    function dragBottomHeight(e: MouseEvent) {
      const base = bottomHeight.value;
      startDrag(e, 'y', (d) => {
        bottomHeight.value = Math.max(80, Math.min(600, base - d));
      });
    }
    // 左侧内部上下分割
    function dragLeftSplit(e: MouseEvent, totalHeight: number) {
      const base = leftSplitRatio.value;
      startDrag(e, 'y', (d) => {
        leftSplitRatio.value = Math.max(0.15, Math.min(0.85, base + d / totalHeight));
      });
    }
    // 右侧内部上下分割
    function dragRightSplit(e: MouseEvent, totalHeight: number) {
      const base = rightSplitRatio.value;
      startDrag(e, 'y', (d) => {
        rightSplitRatio.value = Math.max(0.15, Math.min(0.85, base + d / totalHeight));
      });
    }
    // 底部内部左右分割
    function dragBottomSplit(e: MouseEvent, totalWidth: number) {
      const base = bottomSplitRatio.value;
      startDrag(e, 'x', (d) => {
        bottomSplitRatio.value = Math.max(0.15, Math.min(0.85, base + d / totalWidth));
      });
    }

    // ─── 辅助 ─────────────────────────────────────────────────────────────
    function getActiveWidget(activeId: string | null) {
      if (!activeId) return null;
      return props.skeleton?.widgets.find((w) => w.name === activeId) ?? null;
    }

    function isDocked(activeId: string | null) {
      const mode = getActiveWidget(activeId)?.pane.viewMode.value;
      return mode === 'DockPinned' || mode === 'DockUnpinned';
    }

    // ─── 各侧 active widget ───────────────────────────────────────────────
    const leftTopWidget = computed(() =>
      getActiveWidget(props.skeleton?.leftTopArea.container.activeId.value ?? null),
    );
    const leftBottomWidget = computed(() =>
      getActiveWidget(props.skeleton?.leftBottomArea.container.activeId.value ?? null),
    );
    const rightTopWidget = computed(() =>
      getActiveWidget(props.skeleton?.rightTopArea.container.activeId.value ?? null),
    );
    const rightBottomWidget = computed(() =>
      getActiveWidget(props.skeleton?.rightBottomArea.container.activeId.value ?? null),
    );
    const bottomLeftWidget = computed(() =>
      getActiveWidget(props.skeleton?.bottomLeftArea.container.activeId.value ?? null),
    );
    const bottomRightWidget = computed(() =>
      getActiveWidget(props.skeleton?.bottomRightArea.container.activeId.value ?? null),
    );

    // ─── 各面板 docked 可见性 ─────────────────────────────────────────────
    const isLeftTopVisible = computed(() =>
      isDocked(props.skeleton?.leftTopArea.container.activeId.value ?? null),
    );
    const isLeftBottomVisible = computed(() =>
      isDocked(props.skeleton?.leftBottomArea.container.activeId.value ?? null),
    );
    const isRightTopVisible = computed(() =>
      isDocked(props.skeleton?.rightTopArea.container.activeId.value ?? null),
    );
    const isRightBottomVisible = computed(() =>
      isDocked(props.skeleton?.rightBottomArea.container.activeId.value ?? null),
    );
    const isBottomLeftVisible = computed(() =>
      isDocked(props.skeleton?.bottomLeftArea.container.activeId.value ?? null),
    );
    const isBottomRightVisible = computed(() =>
      isDocked(props.skeleton?.bottomRightArea.container.activeId.value ?? null),
    );

    // 整侧可见（有任意一个 docked 就显示侧栏容器）
    const isLeftVisible = computed(() => isLeftTopVisible.value || isLeftBottomVisible.value);
    const isRightVisible = computed(() => isRightTopVisible.value || isRightBottomVisible.value);
    const isBottomVisible = computed(() => isBottomLeftVisible.value || isBottomRightVisible.value);

    // ─── Undocked widget（每侧独立，从 focusedId 里找） ───────────────────
    function makeUndockedWidget(side: 'left' | 'right' | 'bottom') {
      return computed(() => {
        const sk = props.skeleton;
        const w = getActiveWidget(sk?.focusedId.value ?? null);
        if (!w || w.pane.viewMode.value !== 'Undock') return null;
        const areaMap = {
          left: [sk?.leftTopArea, sk?.leftBottomArea],
          right: [sk?.rightTopArea, sk?.rightBottomArea],
          bottom: [sk?.bottomLeftArea, sk?.bottomRightArea],
        } as const;
        const belongs = areaMap[side].some((a) =>
          a?.container.items.value.some((i) => i.name === w.name),
        );
        return belongs ? w : null;
      });
    }
    const leftUndockedWidget = makeUndockedWidget('left');
    const rightUndockedWidget = makeUndockedWidget('right');
    const bottomUndockedWidget = makeUndockedWidget('bottom');

    const isLeftUndockedVisible = computed(() => leftUndockedWidget.value !== null);
    const isRightUndockedVisible = computed(() => rightUndockedWidget.value !== null);
    const isBottomUndockedVisible = computed(() => bottomUndockedWidget.value !== null);

    // ─── Teleport 目标 map ────────────────────────────────────────────────
    const teleportTargets = computed(() => {
      const sk = props.skeleton;
      const map: Record<string, string> = {};
      if (!sk) return map;

      // widgetName -> undocked 锚点
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
      sk.bottomLeftArea.container.items.value.forEach((w) =>
        sideIndex.set(w.name, '#bottom-undocked-area'),
      );
      sk.bottomRightArea.container.items.value.forEach((w) =>
        sideIndex.set(w.name, '#bottom-undocked-area'),
      );

      // activeId -> docked 锚点
      const dockTargets: Record<string, string> = {
        [sk.leftTopArea.container.activeId.value ?? '']: '#left-top-area',
        [sk.leftBottomArea.container.activeId.value ?? '']: '#left-bottom-area',
        [sk.rightTopArea.container.activeId.value ?? '']: '#right-top-area',
        [sk.rightBottomArea.container.activeId.value ?? '']: '#right-bottom-area',
        [sk.bottomLeftArea.container.activeId.value ?? '']: '#bottom-left-area',
        [sk.bottomRightArea.container.activeId.value ?? '']: '#bottom-right-area',
      };
      delete dockTargets[''];

      sk.widgets
        .filter((w) => w.type === 'panel')
        .forEach((w) => {
          map[w.name] =
            w.pane.viewMode.value === 'Undock'
              ? (sideIndex.get(w.name) ?? '#widget-offscreen')
              : (dockTargets[w.name] ?? '#widget-offscreen');
        });

      return map;
    });

    // ─── 内部分割高度 / 宽度（CSS calc 字符串） ───────────────────────────
    const leftTopHeight = computed(() => `calc((100% - 4px) * ${leftSplitRatio.value})`);
    const leftBottomHeight = computed(() => `calc((100% - 4px) * ${1 - leftSplitRatio.value})`);
    const rightTopHeight = computed(() => `calc((100% - 4px) * ${rightSplitRatio.value})`);
    const rightBottomHeight = computed(() => `calc((100% - 4px) * ${1 - rightSplitRatio.value})`);
    const bottomLeftWidth = computed(() => `calc((100% - 4px) * ${bottomSplitRatio.value})`);
    const bottomRightWidth = computed(() => `calc((100% - 4px) * ${1 - bottomSplitRatio.value})`);

    return () => {
      if (!props.skeleton) return null;
      const sk = props.skeleton;

      const leftBoth = isLeftTopVisible.value && isLeftBottomVisible.value;
      const rightBoth = isRightTopVisible.value && isRightBottomVisible.value;
      const bottomBoth = isBottomLeftVisible.value && isBottomRightVisible.value;

      return (
        <div class="layplux-center-area">
          {/* 离屏保活容器 */}
          <div id="widget-offscreen" style="display:none;" />
          {/* 所有 panel widget Teleport 声明 */}
          {sk.widgets
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

          {/* ── Undocked 浮动面板，absolute 定位，不参与 flex 布局 ── */}
          {/* 左侧 undocked：手柄贴右边缘 */}
          <div
            class="layplux-panel--undocked layplux-panel--undocked-left"
            v-show={isLeftUndockedVisible.value}
            style={{ width: `${leftWidth.value}px` }}
          >
            <PanelView anchor="left-undocked-area" widget={leftUndockedWidget.value ?? undefined} />
            <div
              class="layplux-resize-handle layplux-resize-handle--x layplux-resize-handle--edge-right"
              onMousedown={dragLeftWidth}
            />
          </div>

          {/* 右侧 undocked：手柄贴左边缘 */}
          <div
            class="layplux-panel--undocked layplux-panel--undocked-right"
            v-show={isRightUndockedVisible.value}
            style={{ width: `${rightWidth.value}px` }}
          >
            <div
              class="layplux-resize-handle layplux-resize-handle--x layplux-resize-handle--edge-left"
              onMousedown={dragRightWidth}
            />
            <PanelView
              anchor="right-undocked-area"
              widget={rightUndockedWidget.value ?? undefined}
            />
          </div>

          {/* 底部 undocked：手柄贴上边缘 */}
          <div
            class="layplux-panel--undocked layplux-panel--undocked-bottom"
            v-show={isBottomUndockedVisible.value}
            style={{ height: `${bottomHeight.value}px` }}
          >
            <div
              class="layplux-resize-handle layplux-resize-handle--y layplux-resize-handle--edge-top"
              onMousedown={dragBottomHeight}
            />
            <PanelView
              anchor="bottom-undocked-area"
              widget={bottomUndockedWidget.value ?? undefined}
            />
          </div>

          {/* ── 主区域（flex row）：左侧 + 编辑器 + 右侧 ── */}
          <div class="layplux-center-area__main">
            {/* 左侧 docked 面板列 */}
            <div
              class="layplux-center-area__left"
              v-show={isLeftVisible.value}
              style={{ width: `${leftWidth.value}px` }}
            >
              <div class="layplux-center-area__docked-panels">
                <PanelView
                  anchor="left-top-area"
                  widget={leftTopWidget.value ?? undefined}
                  v-show={isLeftTopVisible.value}
                  style={leftBoth ? { height: leftTopHeight.value, flex: 'none' } : {}}
                />
                {leftBoth && (
                  <div
                    class="layplux-resize-handle layplux-resize-handle--y"
                    onMousedown={(e: MouseEvent) =>
                      dragLeftSplit(
                        e,
                        (e.currentTarget as HTMLElement).closest(
                          '.layplux-center-area__docked-panels',
                        )!.clientHeight,
                      )
                    }
                  />
                )}
                <PanelView
                  anchor="left-bottom-area"
                  widget={leftBottomWidget.value ?? undefined}
                  v-show={isLeftBottomVisible.value}
                  style={leftBoth ? { height: leftBottomHeight.value, flex: 'none' } : {}}
                />
              </div>
            </div>

            {/* 左侧宽度拖拽手柄 */}
            {isLeftVisible.value && (
              <div
                class="layplux-resize-handle layplux-resize-handle--x"
                onMousedown={dragLeftWidth}
              />
            )}

            {/* 编辑器 */}
            <div class="layplux-center-area__editor" />

            {/* 右侧宽度拖拽手柄 */}
            {isRightVisible.value && (
              <div
                class="layplux-resize-handle layplux-resize-handle--x"
                onMousedown={dragRightWidth}
              />
            )}

            {/* 右侧 docked 面板列 */}
            <div
              class="layplux-center-area__right"
              v-show={isRightVisible.value}
              style={{ width: `${rightWidth.value}px` }}
            >
              <div class="layplux-center-area__docked-panels">
                <PanelView
                  anchor="right-top-area"
                  widget={rightTopWidget.value ?? undefined}
                  v-show={isRightTopVisible.value}
                  style={rightBoth ? { height: rightTopHeight.value, flex: 'none' } : {}}
                />
                {rightBoth && (
                  <div
                    class="layplux-resize-handle layplux-resize-handle--y"
                    onMousedown={(e: MouseEvent) =>
                      dragRightSplit(
                        e,
                        (e.currentTarget as HTMLElement).closest(
                          '.layplux-center-area__docked-panels',
                        )!.clientHeight,
                      )
                    }
                  />
                )}
                <PanelView
                  anchor="right-bottom-area"
                  widget={rightBottomWidget.value ?? undefined}
                  v-show={isRightBottomVisible.value}
                  style={rightBoth ? { height: rightBottomHeight.value, flex: 'none' } : {}}
                />
              </div>
            </div>
          </div>

          {/* 底部高度拖拽手柄 */}
          {isBottomVisible.value && (
            <div
              class="layplux-resize-handle layplux-resize-handle--y layplux-resize-handle--bottom-edge"
              onMousedown={dragBottomHeight}
            />
          )}

          {/* ── 底部 docked 面板行 ── */}
          <div
            class="layplux-center-area__bottom"
            v-show={isBottomVisible.value}
            style={{ height: `${bottomHeight.value}px` }}
          >
            <PanelView
              anchor="bottom-left-area"
              widget={bottomLeftWidget.value ?? undefined}
              v-show={isBottomLeftVisible.value}
              style={bottomBoth ? { width: bottomLeftWidth.value, flex: 'none' } : {}}
            />
            {bottomBoth && (
              <div
                class="layplux-resize-handle layplux-resize-handle--x"
                onMousedown={(e: MouseEvent) =>
                  dragBottomSplit(
                    e,
                    (e.currentTarget as HTMLElement).closest('.layplux-center-area__bottom')!
                      .clientWidth,
                  )
                }
              />
            )}
            <PanelView
              anchor="bottom-right-area"
              widget={bottomRightWidget.value ?? undefined}
              v-show={isBottomRightVisible.value}
              style={bottomBoth ? { width: bottomRightWidth.value, flex: 'none' } : {}}
            />
          </div>
        </div>
      );
    };
  },
});
