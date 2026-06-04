import { defineComponent, type PropType, type Component, type VNode } from 'vue';
import { createContent } from '../../utils';

export const TitleView = defineComponent({
  name: 'TitleView',
  props: {
    icon: [String, Object, Function] as PropType<string | Component | VNode>,
    title: [String, Object, Function] as PropType<string | Component | VNode>,
    mode: {
      type: String as PropType<'icon-only' | 'stacked' | 'inline'>,
      default: 'icon-only',
    },
    /** 交互状态：idle / active / disabled / error。idle 时 hover 由 CSS :hover 处理 */
    state: {
      type: String as PropType<'idle' | 'active' | 'disabled' | 'error'>,
      default: 'idle',
    },
    /** 聚焦/选中态，独立于 state，可与任何状态叠加 */
    focused: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String as PropType<'small' | 'middle' | 'large'>,
      default: 'middle',
    },
    className: {
      type: String,
      default: '',
    },
    onClick: Function as PropType<() => void>,
  },
  setup(props) {
    return () => {
      const { icon, title, mode, state, size, focused, className, onClick } = props;
      const iconNode = icon ? createContent(icon) : null;
      const titleNode = title ? createContent(title) : null;

      const classes = [
        'title-view',
        `title-view--${mode}`,
        `title-view--${state}`,
        `title-view--${size}`,
        focused && 'title-view--focused',
        className,
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <span class={classes} onClick={onClick}>
          <span class="title-view__icon">{iconNode}</span>
          <span class="title-view__label">{titleNode}</span>
        </span>
      );
    };
  },
});
