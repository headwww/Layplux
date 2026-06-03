import { defineComponent } from 'vue';
import { TopArea } from './top-area';
import { BottomArea } from './bottom-area';
import { LeftTopArea } from './left-top-area';
import { LeftBottomArea } from './left-bottom-area';
import { BottomLeftArea } from './bottom-left-area';
import { RightTopArea } from './right-top-area';
import { RightBottomArea } from './right-bottom-area';
import { BottomRightArea } from './bottom-right-area';
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

    // ── 底部状态栏 widget ──
    // 左侧 — 当前分支
    skeleton.add({
      name: 'GitBranchStatus',
      type: 'interaction',
      area: 'bottomArea',
      props: { align: 'left' },
      content: <span>🌿 main</span>,
    });

    // 右侧 — 行号:列号
    skeleton.add({
      name: 'LineCol',
      type: 'interaction',
      area: 'bottomArea',
      props: { align: 'right' },
      content: <span>20:1</span>,
    });

    // 右侧 — 编码
    skeleton.add({
      name: 'Encoding',
      type: 'interaction',
      area: 'bottomArea',
      props: { align: 'right' },
      content: <span>UTF-8</span>,
      index: 10,
    });

    // 右侧 — 换行符
    skeleton.add({
      name: 'LineSeparator',
      type: 'interaction',
      area: 'bottomArea',
      props: { align: 'right' },
      content: <span>LF</span>,
      index: 11,
    });

    // 右侧 — 内存使用
    skeleton.add({
      name: 'Memory',
      type: 'interaction',
      area: 'bottomArea',
      props: { align: 'right' },
      content: <span>512M / 2048M</span>,
      index: 12,
    });

    // ── 左侧 Stripe 上半段 — 面板型 widget ──
    skeleton.add({
      name: 'project',
      type: 'panel',
      area: 'leftTopArea',
      props: { icon: '📁', title: 'Project' },
    });

    skeleton.add({
      name: 'structure',
      type: 'panel',
      area: 'leftTopArea',
      props: { icon: '🧬', title: 'Structure' },
      index: 1,
    });

    skeleton.add({
      name: 'git',
      type: 'panel',
      area: 'leftBottomArea',
      props: { icon: '🔀', title: 'Git' },
      index: 2,
    });

    // ── 右侧 Stripe 上半段 — 面板型 widget ──
    skeleton.add({
      name: 'database',
      type: 'panel',
      area: 'rightTopArea',
      props: { icon: '🗄', title: 'Database' },
    });

    skeleton.add({
      name: 'favorites',
      type: 'panel',
      area: 'rightTopArea',
      props: { icon: '⭐', title: 'Favorites' },
      index: 1,
    });

    skeleton.add({
      name: 'bookmarks',
      type: 'panel',
      area: 'rightBottomArea',
      props: { icon: '🔖', title: 'Bookmarks' },
      index: 2,
    });

    // ── 右侧 Stripe 最底部 — 快捷操作 ──
    skeleton.add({
      name: 'notifications',
      type: 'panel',
      area: 'bottomRightArea',
      props: { icon: '🔔' },
    });

    // ── 左侧 Stripe 最底部 — 快捷操作 ──
    skeleton.add({
      name: 'settings-quick',
      type: 'interaction',
      area: 'bottomLeftArea',
      props: { icon: '⚙', align: 'left' },
    });

    skeleton.add({
      name: 'help',
      type: 'interaction',
      area: 'bottomLeftArea',
      props: { icon: '?', align: 'left' },
      index: 1,
    });

    return () => (
      <div class="layplux-skeleton">
        <TopArea area={skeleton.topArea} />
        <div class="layplux-skeleton__body">
          <div class="layplux-skeleton__stripe">
            <div class="layplux-skeleton__stripe-top">
              <LeftTopArea area={skeleton.leftTopArea} />
              <div class="layplux-skeleton__stripe-separator" />
              <LeftBottomArea area={skeleton.leftBottomArea} />
            </div>
            <BottomLeftArea area={skeleton.bottomLeftArea} />
          </div>
          <div class="layplux-skeleton__center"></div>
          <div class="layplux-skeleton__stripe">
            <div class="layplux-skeleton__stripe-top">
              <RightTopArea area={skeleton.rightTopArea} />
              <div class="layplux-skeleton__stripe-separator" />
              <RightBottomArea area={skeleton.rightBottomArea} />
            </div>
            <BottomRightArea area={skeleton.bottomRightArea} />
          </div>
        </div>
        <BottomArea area={skeleton.bottomArea} />
      </div>
    );
  },
});
