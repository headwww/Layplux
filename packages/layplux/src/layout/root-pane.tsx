/*
 * @Author: shuwen 1243889238@qq.com
 * @Date: 2026-05-27 10:24:36
 * @LastEditors: shuwen 1243889238@qq.com
 * @LastEditTime: 2026-06-04 10:50:21
 * @FilePath: /Layplux/packages/layplux/src/layout/root-pane.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineComponent, type PropType } from 'vue';
import { LayeredManager } from './layered-manager';
import { GlassOverlay } from './glass-overlay';
import { CornerGlow } from '../components';
import type { ISkeleton } from '../managers';

export const RootPane = defineComponent({
  name: 'RootPane',
  props: {
    skeleton: Object as PropType<ISkeleton>,
  },
  setup(props) {
    return () => (
      <div class="layplux-root">
        <CornerGlow />
        <LayeredManager skeleton={props.skeleton} />
        <GlassOverlay />
      </div>
    );
  },
});
