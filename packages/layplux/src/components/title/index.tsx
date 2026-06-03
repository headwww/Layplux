import { defineComponent, ref, type PropType, type Component, type VNode } from 'vue';
import { createContent } from '../../utils';

export const TitleView = defineComponent({
  name: 'TitleView',
  props: {
    /** 图标，支持 string / Component / VNode */
    icon: [String, Object, Function] as PropType<string | Component | VNode>,
    /** 标题文字，支持 string / Component / VNode */
    title: [String, Object, Function] as PropType<string | Component | VNode>,
    /** 布局模式 */
    mode: {
      type: String as PropType<'icon-only' | 'stacked' | 'inline'>,
      default: 'icon-only',
    },
    /** 交互状态 */
    state: {
      type: String as PropType<'idle' | 'hover' | 'active' | 'disabled' | 'error'>,
      default: 'idle',
    },
    /** 尺寸 */
    size: {
      type: String as PropType<'sm' | 'md'>,
      default: 'md',
    },
    /** 额外的 CSS 类名 */
    className: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const isHovered = ref(false);

    function onMouseEnter() {
      isHovered.value = true;
    }

    function onMouseLeave() {
      isHovered.value = false;
    }

    return () => {
      const { icon, title, mode, state, size, className } = props;
      const iconNode = icon ? createContent(icon) : null;
      const titleNode = title ? createContent(title) : null;

      // 当 prop.state 为 idle 且鼠标悬停时，自动升为 hover 视觉态
      const visualState = isHovered.value && state === 'idle' ? 'hover' : state;

      const classes = [
        'title-view',
        `title-view--${mode}`,
        `title-view--${visualState}`,
        `title-view--${size}`,
        className,
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <span class={classes} onMouseenter={onMouseEnter} onMouseleave={onMouseLeave}>
          <span class="title-view__icon">{iconNode}</span>
          <span class="title-view__label">{titleNode}</span>
        </span>
      );
    };
  },
});
