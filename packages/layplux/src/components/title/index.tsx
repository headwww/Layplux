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
    /** 显式状态：active / disabled / error。idle 时 hover 由 CSS :hover 处理 */
    state: {
      type: String as PropType<'idle' | 'active' | 'disabled' | 'error'>,
      default: 'idle',
    },
    size: {
      type: String as PropType<'sm' | 'md'>,
      default: 'md',
    },
    className: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    return () => {
      const { icon, title, mode, state, size, className } = props;
      const iconNode = icon ? createContent(icon) : null;
      const titleNode = title ? createContent(title) : null;

      const classes = [
        'title-view',
        `title-view--${mode}`,
        `title-view--${state}`,
        `title-view--${size}`,
        className,
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <span class={classes}>
          <span class="title-view__icon">{iconNode}</span>
          <span class="title-view__label">{titleNode}</span>
        </span>
      );
    };
  },
});
