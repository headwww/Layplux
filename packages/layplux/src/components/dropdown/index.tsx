import {
  defineComponent,
  provide,
  inject,
  type PropType,
  type InjectionKey,
  type VNode,
} from 'vue';
import { Popup } from '../popup';
import { ChevronRightIcon } from '../icon';

type Placement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';

const DROPDOWN_CLOSE: InjectionKey<() => void> = Symbol('dropdown-close');
const DROPDOWN_ON_CLICK: InjectionKey<((key: string) => void) | undefined> =
  Symbol('dropdown-on-click');

export const Dropdown = defineComponent({
  name: 'LaypluxDropdown',
  props: {
    visible: Boolean,
    trigger: { type: String as PropType<'hover' | 'click' | 'contextmenu'>, default: 'click' },
    placement: { type: String as PropType<Placement>, default: 'bottom-start' },
    disabled: { type: Boolean, default: false },
    destroyOnClose: { type: Boolean, default: true },
    onClick: Function as PropType<(key: string) => void>,
    getContainer: { type: Function as PropType<() => HTMLElement> },
  },
  emits: ['update:visible'],
  setup(props, { emit, slots }) {
    const closeDropdown = () => {
      emit('update:visible', false);
    };

    provide(DROPDOWN_CLOSE, closeDropdown);
    provide(DROPDOWN_ON_CLICK, props.onClick);

    return () => (
      <Popup
        visible={props.visible}
        trigger={props.trigger}
        placement={props.placement}
        disabled={props.disabled}
        destroyOnClose={props.destroyOnClose}
        getContainer={props.getContainer}
        onUpdate:visible={(v: boolean) => emit('update:visible', v)}
      >
        {{
          default: () => slots.default?.(),
          content: () => <div class="layplux-dropdown">{slots.overlay?.()}</div>,
        }}
      </Popup>
    );
  },
});

export const DropdownMenu = defineComponent({
  name: 'LaypluxDropdownMenu',
  setup(_props, { slots }) {
    return () => <div class="layplux-dropdown-menu">{slots.default?.()}</div>;
  },
});

export const DropdownItem = defineComponent({
  name: 'LaypluxDropdownItem',
  props: {
    eventKey: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    danger: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    const closeDropdown = inject(DROPDOWN_CLOSE);
    const onItemClick = inject(DROPDOWN_ON_CLICK);

    const handleClick = () => {
      if (props.disabled) return;
      onItemClick?.(props.eventKey);
      closeDropdown?.();
    };

    return () => (
      <div
        class={[
          'layplux-dropdown-menu__item',
          props.disabled && 'layplux-dropdown-menu__item--disabled',
          props.danger && 'layplux-dropdown-menu__item--danger',
        ]}
        onClick={handleClick}
      >
        {slots.default?.()}
      </div>
    );
  },
});

export const DropdownDivider = defineComponent({
  name: 'LaypluxDropdownDivider',
  setup() {
    return () => <div class="layplux-dropdown-menu__divider" />;
  },
});

export const DropdownSubmenu = defineComponent({
  name: 'LaypluxDropdownSubmenu',
  props: {
    title: { type: String },
    icon: Object as PropType<VNode>,
    disabled: { type: Boolean, default: false },
    getContainer: { type: Function as PropType<() => HTMLElement> },
  },
  setup(props, { slots }) {
    const closeParent = inject(DROPDOWN_CLOSE);
    const onParentClick = inject(DROPDOWN_ON_CLICK);

    if (closeParent) {
      provide(DROPDOWN_CLOSE, closeParent);
    }

    const handleClick = (key: string) => {
      onParentClick?.(key);
      closeParent?.();
    };
    provide(DROPDOWN_ON_CLICK, handleClick);

    return () => (
      <Popup
        trigger="hover"
        placement="right-start"
        offset={{ x: 4, y: 0 }}
        mouseEnterDelay={150}
        mouseLeaveDelay={100}
        destroyOnClose={true}
        disabled={props.disabled}
        getContainer={props.getContainer}
      >
        {{
          default: () => (
            <div
              class={[
                'layplux-dropdown-menu__item',
                'layplux-dropdown-menu__item--submenu',
                props.disabled && 'layplux-dropdown-menu__item--disabled',
              ]}
            >
              {props.icon}
              <span>{props.title}</span>
              <ChevronRightIcon size={12} class="layplux-dropdown-menu__submenu-arrow" />
            </div>
          ),
          content: () => <div class="layplux-dropdown">{slots.default?.()}</div>,
        }}
      </Popup>
    );
  },
});
