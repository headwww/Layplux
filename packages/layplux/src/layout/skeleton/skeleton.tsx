import { defineComponent, type PropType } from 'vue';
import { TopArea } from './top-area';
import { BottomArea } from './bottom-area';
import { LeftTopArea } from './left-top-area';
import { LeftBottomArea } from './left-bottom-area';
import { BottomLeftArea } from './bottom-left-area';
import { RightTopArea } from './right-top-area';
import { RightBottomArea } from './right-bottom-area';
import { BottomRightArea } from './bottom-right-area';
import { type ISkeleton } from '../../managers';
import { CenterArea } from './center-area';

export const Skeleton = defineComponent({
  name: 'Skeleton',
  props: {
    skeleton: Object as PropType<ISkeleton>,
  },
  setup(props) {
    return () => (
      <div class="layplux-skeleton">
        <TopArea area={props.skeleton?.topArea} />
        <div class="layplux-skeleton__body">
          <div class="layplux-skeleton__stripe">
            <div class="layplux-skeleton__stripe-top">
              <LeftTopArea area={props.skeleton?.leftTopArea} />
              <div class="layplux-skeleton__stripe-separator" />
              <LeftBottomArea area={props.skeleton?.leftBottomArea} />
            </div>
            <BottomLeftArea area={props.skeleton?.bottomLeftArea} />
          </div>
          <div class="layplux-skeleton__center">
            <CenterArea />
          </div>
          <div class="layplux-skeleton__stripe">
            <div class="layplux-skeleton__stripe-top">
              <RightTopArea area={props.skeleton?.rightTopArea} />
              <div class="layplux-skeleton__stripe-separator" />
              <RightBottomArea area={props.skeleton?.rightBottomArea} />
            </div>
            <BottomRightArea area={props.skeleton?.bottomRightArea} />
          </div>
        </div>
        <BottomArea area={props.skeleton?.bottomArea} />
      </div>
    );
  },
});
