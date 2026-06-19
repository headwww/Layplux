import { defineComponent, type PropType } from 'vue';
import { TopArea } from './top-area';
import { BottomArea } from './bottom-area';
import { LeftTopArea } from './left-top-area';
import { LeftBottomArea } from './left-bottom-area';
import { BottomLeftArea } from './bottom-left-area';
import { RightTopArea } from './right-top-area';
import { RightBottomArea } from './right-bottom-area';
import { BottomRightArea } from './bottom-right-area';
import { type IArea, type ISkeleton, type IWidget } from '../../managers';
import type { PanelWidgetConfig } from '../../types';
import { CenterArea } from './center-area';

export const Skeleton = defineComponent({
  name: 'Skeleton',
  props: {
    skeleton: Object as PropType<ISkeleton>,
  },
  setup(props) {
    const hasItems = (area: IArea<PanelWidgetConfig, IWidget> | undefined) => {
      const items = area?.container.items.value;
      return items && items.length > 0;
    };

    return () => {
      const showLeftSeparator = hasItems(props.skeleton?.leftTopArea) && hasItems(props.skeleton?.leftBottomArea);
      const showRightSeparator = hasItems(props.skeleton?.rightTopArea) && hasItems(props.skeleton?.rightBottomArea);

      return (
        <div class="layplux-skeleton">
          <TopArea area={props.skeleton?.topArea} />
          <div class="layplux-skeleton__body">
            <div class="layplux-skeleton__stripe">
              <div class="layplux-skeleton__stripe-top">
                <LeftTopArea area={props.skeleton?.leftTopArea} />
                {showLeftSeparator && <div class="layplux-skeleton__stripe-separator" />}
                <LeftBottomArea area={props.skeleton?.leftBottomArea} />
              </div>
              <BottomLeftArea area={props.skeleton?.bottomLeftArea} />
            </div>
            <div class="layplux-skeleton__center">
              <CenterArea skeleton={props.skeleton} centerArea={props.skeleton?.centerArea} />
            </div>
            <div class="layplux-skeleton__stripe">
              <div class="layplux-skeleton__stripe-top">
                <RightTopArea area={props.skeleton?.rightTopArea} />
                {showRightSeparator && <div class="layplux-skeleton__stripe-separator" />}
                <RightBottomArea area={props.skeleton?.rightBottomArea} />
              </div>
              <BottomRightArea area={props.skeleton?.bottomRightArea} />
            </div>
          </div>
          <BottomArea area={props.skeleton?.bottomArea} />
        </div>
      );
    };
  },
});
