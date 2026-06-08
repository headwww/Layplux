import {
  defineComponent,
  ref,
  watch,
  nextTick,
  onMounted,
  onUnmounted,
  Teleport,
  type PropType,
} from 'vue';

type Trigger = 'hover' | 'click' | 'focus' | 'contextmenu' | 'manual';

type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

interface Position {
  top: number;
  left: number;
}

function computePosition(
  triggerRect: DOMRect,
  popupW: number,
  popupH: number,
  placement: Placement,
  offsetX: number,
  offsetY: number,
): { position: Position; placement: Placement } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const PADDING = 8;

  let top = 0;
  let left = 0;

  const [main, align] = placement.split('-') as [string, string | undefined];

  // Vertical placements
  if (main === 'bottom') {
    top = triggerRect.bottom + offsetY;
    if (align === 'start') left = triggerRect.left + offsetX;
    else if (align === 'end') left = triggerRect.right - popupW + offsetX;
    else left = triggerRect.left + triggerRect.width / 2 - popupW / 2 + offsetX;

    // Flip to top if not enough space
    if (top + popupH > vh - PADDING) {
      top = triggerRect.top - popupH - offsetY;
      placement = align ? (`top-${align}` as Placement) : 'top';
    }
  } else if (main === 'top') {
    top = triggerRect.top - popupH - offsetY;
    if (align === 'start') left = triggerRect.left + offsetX;
    else if (align === 'end') left = triggerRect.right - popupW + offsetX;
    else left = triggerRect.left + triggerRect.width / 2 - popupW / 2 + offsetX;

    // Flip to bottom if not enough space
    if (top < PADDING) {
      top = triggerRect.bottom + offsetY;
      placement = align ? (`bottom-${align}` as Placement) : 'bottom';
    }
  }
  // Horizontal placements
  else if (main === 'right') {
    left = triggerRect.right + offsetY;
    if (align === 'start') top = triggerRect.top + offsetX;
    else if (align === 'end') top = triggerRect.bottom - popupH + offsetX;
    else top = triggerRect.top + triggerRect.height / 2 - popupH / 2 + offsetX;

    if (left + popupW > vw - PADDING) {
      left = triggerRect.left - popupW - offsetY;
      placement = align ? (`left-${align}` as Placement) : 'left';
    }
  } else if (main === 'left') {
    left = triggerRect.left - popupW - offsetY;
    if (align === 'start') top = triggerRect.top + offsetX;
    else if (align === 'end') top = triggerRect.bottom - popupH + offsetX;
    else top = triggerRect.top + triggerRect.height / 2 - popupH / 2 + offsetX;

    if (left < PADDING) {
      left = triggerRect.right + offsetY;
      placement = align ? (`right-${align}` as Placement) : 'right';
    }
  }

  // Clamp to viewport
  top = Math.max(PADDING, Math.min(top, vh - popupH - PADDING));
  left = Math.max(PADDING, Math.min(left, vw - popupW - PADDING));

  return { position: { top, left }, placement };
}

export const Popup = defineComponent({
  name: 'LaypluxPopup',
  props: {
    visible: Boolean,
    trigger: { type: String as PropType<Trigger>, default: 'hover' },
    placement: { type: String as PropType<Placement>, default: 'bottom' },
    offset: { type: Object as PropType<{ x?: number; y?: number }>, default: () => ({ y: 4 }) },
    mouseEnterDelay: { type: Number, default: 100 },
    mouseLeaveDelay: { type: Number, default: 100 },
    disabled: { type: Boolean, default: false },
    destroyOnClose: { type: Boolean, default: true },
    getContainer: { type: Function as PropType<() => HTMLElement>, default: () => document.body },
  },
  emits: ['update:visible'],
  setup(props, { emit, slots }) {
    const triggerRef = ref<HTMLElement>();
    const popupRef = ref<HTMLElement>();
    const position = ref<Position>({ top: 0, left: 0 });
    const currentPlacement = ref<Placement>(props.placement);
    // Whether the popup DOM should exist
    const mounted = ref(false);
    // Whether the popup is in its visible animation state
    const animatingIn = ref(false);

    let enterTimer: ReturnType<typeof setTimeout> | null = null;
    let leaveTimer: ReturnType<typeof setTimeout> | null = null;
    let leaveAnimationTimer: ReturnType<typeof setTimeout> | null = null;

    const clearTimers = () => {
      if (enterTimer) {
        clearTimeout(enterTimer);
        enterTimer = null;
      }
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
      }
      if (leaveAnimationTimer) {
        clearTimeout(leaveAnimationTimer);
        leaveAnimationTimer = null;
      }
    };

    const updatePosition = () => {
      if (!triggerRef.value || !popupRef.value) return;
      const triggerRect = triggerRef.value.getBoundingClientRect();
      const popupRect = popupRef.value.getBoundingClientRect();
      const { x: ox = 0, y: oy = 0 } = props.offset;

      const result = computePosition(
        triggerRect,
        popupRect.width,
        popupRect.height,
        props.placement,
        ox,
        oy,
      );
      position.value = result.position;
      currentPlacement.value = result.placement;
    };

    const show = () => {
      if (props.disabled) return;
      clearTimers();

      enterTimer = setTimeout(() => {
        mounted.value = true;
        emit('update:visible', true);

        void nextTick(() => {
          updatePosition();
          // Trigger enter animation
          requestAnimationFrame(() => {
            animatingIn.value = true;
          });
        });
      }, props.mouseEnterDelay);
    };

    const hide = (immediate = false) => {
      clearTimers();

      const delay = immediate ? 0 : props.mouseLeaveDelay;
      leaveTimer = setTimeout(() => {
        animatingIn.value = false;

        // Wait for CSS transition to finish before removing DOM
        leaveAnimationTimer = setTimeout(() => {
          mounted.value = false;
          emit('update:visible', false);
        }, 200); // Match CSS transition duration
      }, delay);
    };

    const toggle = () => {
      if (mounted.value && animatingIn.value) {
        hide(true);
      } else {
        clearTimers();
        show();
      }
    };

    // Sync external visible changes
    watch(
      () => props.visible,
      (v) => {
        if (v && !mounted.value) show();
        else if (!v && mounted.value) hide(true);
      },
    );

    // Sync external placement changes
    watch(
      () => props.placement,
      (p) => {
        currentPlacement.value = p;
      },
    );

    const onResize = () => {
      if (mounted.value && animatingIn.value) updatePosition();
    };

    onMounted(() => {
      window.addEventListener('resize', onResize);
      window.addEventListener('scroll', onResize, true);
      document.addEventListener('mousedown', onClickOutside, true);
      document.addEventListener('keydown', onEsc);
    });

    onUnmounted(() => {
      clearTimers();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      document.removeEventListener('mousedown', onClickOutside, true);
      document.removeEventListener('keydown', onEsc);
    });

    // Click outside
    const onClickOutside = (e: MouseEvent) => {
      if (!mounted.value) return;

      const target = e.target as Node;
      const trigger = triggerRef.value;
      const popup = popupRef.value;

      if (trigger && trigger.contains(target)) return;
      if (popup && popup.contains(target)) return;

      if (props.trigger === 'click' || props.trigger === 'contextmenu') {
        hide(true);
      }
    };

    // ESC key
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mounted.value) {
        hide(true);
      }
    };

    // Trigger event handlers
    const onTriggerMouseEnter = () => {
      if (props.trigger === 'hover') show();
    };

    const onTriggerMouseLeave = () => {
      if (props.trigger === 'hover') hide();
    };

    const onTriggerClick = (e: MouseEvent) => {
      if (props.trigger === 'click') {
        e.stopPropagation();
        toggle();
      }
    };

    const onTriggerFocus = () => {
      if (props.trigger === 'focus') show();
    };

    const onTriggerBlur = () => {
      if (props.trigger === 'focus') hide(true);
    };

    const onTriggerContextmenu = (e: MouseEvent) => {
      if (props.trigger === 'contextmenu') {
        e.preventDefault();
        show();
      }
    };

    // Popup hover (for safe triangle)
    const onPopupMouseEnter = () => {
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
      }
    };

    const onPopupMouseLeave = () => {
      if (props.trigger === 'hover') hide();
    };

    return () => {
      const container = props.getContainer();

      return (
        <>
          {/* Trigger wrapper */}
          <span
            ref={triggerRef}
            class="layplux-popup-trigger"
            onMouseenter={onTriggerMouseEnter}
            onMouseleave={onTriggerMouseLeave}
            onClick={onTriggerClick}
            onFocus={onTriggerFocus}
            onBlur={onTriggerBlur}
            onContextmenu={onTriggerContextmenu}
          >
            {slots.default?.()}
          </span>

          {/* Popup content via Teleport */}
          {(mounted.value || !props.destroyOnClose) && (
            <Teleport to={container}>
              <div
                ref={popupRef}
                class={[
                  'layplux-portal',
                  'layplux-popup',
                  currentPlacement.value,
                  animatingIn.value && 'layplux-popup--visible',
                ]}
                style={{
                  position: 'fixed',
                  top: `${position.value.top}px`,
                  left: `${position.value.left}px`,
                  zIndex: 'var(--layplux-popup-z-index, 2000)',
                }}
                onMouseenter={onPopupMouseEnter}
                onMouseleave={onPopupMouseLeave}
              >
                {slots.content?.()}
              </div>
            </Teleport>
          )}
        </>
      );
    };
  },
});
