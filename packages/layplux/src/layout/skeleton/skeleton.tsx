import { defineComponent } from 'vue';
import { TopArea } from './top-area';
import { useSkeleton } from '../../managers';

export const Skeleton = defineComponent({
  name: 'Skeleton',
  setup() {
    const skeleton = useSkeleton();

    // 项目名称
    skeleton.add({
      name: 'ProjectSelector',
      type: 'interaction',
      area: 'topArea',
      props: {
        align: 'left',
      },
      content: <div class="toolbar-item">📁 DemoProject</div>,
    });

    // 全局搜索
    skeleton.add({
      name: 'Search',
      type: 'interaction',
      area: 'topArea',
      props: {
        align: 'center',
      },
      content: <div class="toolbar-item">🔍 Search Everywhere</div>,
    });

    // Git分支
    skeleton.add({
      name: 'GitBranch',
      type: 'interaction',
      area: 'topArea',
      props: {
        align: 'right',
      },
      content: <div class="toolbar-item">🌿 main</div>,
    });

    // 运行
    skeleton.add({
      name: 'Run',
      type: 'interaction',
      area: 'topArea',
      props: {
        align: 'right',
      },
      content: <button class="toolbar-btn">▶ Run</button>,
    });

    // 调试
    skeleton.add({
      name: 'Debug',
      type: 'interaction',
      area: 'topArea',
      props: {
        align: 'right',
      },
      content: <button class="toolbar-btn">🐞 Debug</button>,
    });

    // 提交
    skeleton.add({
      name: 'Commit',
      type: 'interaction',
      area: 'topArea',
      props: {
        align: 'right',
      },
      content: <button class="toolbar-btn">✓ Commit</button>,
    });

    // 通知
    skeleton.add({
      name: 'Notification',
      type: 'interaction',
      area: 'topArea',
      props: {
        align: 'right',
      },
      content: <div class="toolbar-item">🔔 3</div>,
    });

    // 设置
    skeleton.add({
      name: 'Settings',
      type: 'interaction',
      area: 'topArea',
      props: {
        align: 'right',
      },
      content: <div class="toolbar-item">⚙️</div>,
    });

    return () => (
      <div class="layplux-skeleton">
        <TopArea area={skeleton.topArea} />
        <div class="layplux-skeleton__body">
          <div class="layplux-skeleton__stripe"></div>
          <div class="layplux-skeleton__center"></div>
          <div class="layplux-skeleton__stripe"></div>
        </div>
        <div class="layplux-skeleton__bottom"></div>
      </div>
    );
  },
});
