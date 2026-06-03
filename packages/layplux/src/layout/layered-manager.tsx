import { defineComponent } from 'vue';
import { Skeleton } from './skeleton';

/**
 * Z 轴分层容器，把子组件分配到不同"层号"，层号大的显示在上方。
 * 预设了五个层：DEFAULT(0)、PALETTE(100)、MODAL(200)、POPUP(300)、DRAG(400)。
 * 在此基础上拓展了自定义层号，用于管理弹出窗口（completion popup、快速文档）和拖拽反馈，
 * 从而避免每次弹窗都创建独立的 OS 窗口，大幅降低渲染开销
 */
export const LayeredManager = defineComponent({
  name: 'LayeredManager',
  setup() {
    return () => (
      <div class="layered-manager">
        <Skeleton />
      </div>
    );
  },
});
