<script setup lang="ts">
import { h, defineComponent, ref, onMounted, type PropType } from 'vue';
import { Layplux } from 'layplux';
import { useSkeleton } from '../../layplux/src/managers';
import {
  FolderOutlined,
  ApartmentOutlined,
  BranchesOutlined,
  DatabaseOutlined,
  StarOutlined,
  BookOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  BellOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  BugOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons-vue';

const skeleton = useSkeleton();

// ── 顶部工具栏 ──
skeleton.add({
  name: 'ProjectSelector',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'left' },
  content: h('div', { class: 'toolbar-item' }, [h(FolderOutlined), ' DemoProject']),
});
skeleton.add({
  name: 'Search',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'center' },
  content: h('div', { class: 'toolbar-item' }, [h(SearchOutlined), ' Search Everywhere']),
});
skeleton.add({
  name: 'GitBranch',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'right' },
  content: h('div', { class: 'toolbar-item' }, [h(BranchesOutlined), ' main']),
});
skeleton.add({
  name: 'Run',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'right' },
  content: h('button', { class: 'toolbar-btn' }, [h(PlayCircleOutlined), ' Run']),
});
skeleton.add({
  name: 'Debug',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'right' },
  content: h('button', { class: 'toolbar-btn' }, [h(BugOutlined), ' Debug']),
});
skeleton.add({
  name: 'Commit',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'right' },
  content: h('button', { class: 'toolbar-btn' }, [h(CheckCircleOutlined), ' Commit']),
});
skeleton.add({
  name: 'Notification',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'right' },
  content: h('div', { class: 'toolbar-item' }, [h(BellOutlined), ' 3']),
});
skeleton.add({
  name: 'Settings',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'right' },
  content: h('div', { class: 'toolbar-item' }, [h(SettingOutlined)]),
});

// ── 底部状态栏 ──
skeleton.add({
  name: 'GitBranchStatus',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'left' },
  content: h('span', [h(BranchesOutlined), ' main']),
});
skeleton.add({
  name: 'LineCol',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'right' },
  content: h('span', '20:1'),
});
skeleton.add({
  name: 'Encoding',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'right' },
  content: h('span', 'UTF-8'),
  index: 10,
});
skeleton.add({
  name: 'LineSeparator',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'right' },
  content: h('span', 'LF'),
  index: 11,
});
skeleton.add({
  name: 'Memory',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'right' },
  content: h('span', '512M / 2048M'),
  index: 12,
});

// ── 面板 content 组件 ──

/** 模拟文件树，带滚动 */
const ProjectContent = () =>
  h('div', { class: 'panel-content' }, [
    h('input', {
      style: {
        width: '100%',
        padding: '6px 8px',
        background: '#3c3f41',
        border: '1px solid #555',
        borderRadius: 4,
        color: '#ccc',
        fontSize: 12,
        marginBottom: 8,
        boxSizing: 'border-box',
      },
      placeholder: '搜索文件...',
      value: '',
    }),
    ...Array.from({ length: 40 }, (_, i) =>
      h(
        'div',
        {
          key: i,
          style: {
            padding: '4px 8px',
            fontSize: 12,
            color: i % 5 === 0 ? '#c586c0' : '#ccc',
            cursor: 'pointer',
            borderRadius: 3,
          },
          onMouseenter: (e: MouseEvent) => ((e.target as HTMLElement).style.background = '#43454a'),
          onMouseleave: (e: MouseEvent) =>
            ((e.target as HTMLElement).style.background = 'transparent'),
        },
        [i % 5 === 0 ? '📁' : '📄', ' ', i % 5 === 0 ? `folder-${i}` : `file-${i}.ts`],
      ),
    ),
  ]);

/** 模拟代码结构树 */
const StructureContent = () =>
  h('div', { class: 'panel-content' }, [
    h('div', { style: { padding: '4px 8px', fontSize: 12, color: '#4ec9b0' } }, '🧩 App.vue'),
    ...['setup()', 'refs', 'computed', 'watch'].map((name) =>
      h('div', { style: { padding: '2px 16px', fontSize: 11, color: '#dcdcaa' } }, `🔹 ${name}`),
    ),
    h(
      'div',
      { style: { padding: '4px 8px', fontSize: 12, color: '#4ec9b0', marginTop: 8 } },
      '🧩 Skeleton',
    ),
    ...['TopArea', 'LeftTopArea', 'CenterArea', 'BottomArea'].map((name) =>
      h('div', { style: { padding: '2px 16px', fontSize: 11, color: '#dcdcaa' } }, `🔹 ${name}`),
    ),
    h(
      'div',
      { style: { padding: '4px 8px', fontSize: 12, color: '#4ec9b0', marginTop: 8 } },
      '🧩 PanelView',
    ),
    ...['title', 'body', 'resize', 'content-host'].map((name) =>
      h('div', { style: { padding: '2px 16px', fontSize: 11, color: '#dcdcaa' } }, `🔹 ${name}`),
    ),
  ]);

/** 模拟 Git 面板 — 带输入框和滚动列表 */
const GitContent = () =>
  h('div', { class: 'panel-content' }, [
    h('textarea', {
      style: {
        width: '100%',
        height: 60,
        padding: 6,
        background: '#3c3f41',
        border: '1px solid #555',
        borderRadius: 4,
        color: '#ccc',
        fontSize: 12,
        resize: 'vertical',
        boxSizing: 'border-box',
        marginBottom: 8,
      },
      placeholder: 'Commit message...',
      value: '',
    }),
    h('div', { style: { fontSize: 11, color: '#6a9955', marginBottom: 4 } }, 'Changed files (12)'),
    ...Array.from({ length: 25 }, (_, i) =>
      h(
        'div',
        {
          key: i,
          style: {
            padding: '3px 8px',
            fontSize: 11,
            color: i < 5 ? '#6a9955' : '#c586c0',
            cursor: 'pointer',
            borderRadius: 3,
          },
          onMouseenter: (e: MouseEvent) => ((e.target as HTMLElement).style.background = '#43454a'),
          onMouseleave: (e: MouseEvent) =>
            ((e.target as HTMLElement).style.background = 'transparent'),
        },
        [i < 5 ? 'M' : '?', ' ', `src/components/component-${i}.tsx`],
      ),
    ),
  ]);

/** 模拟数据库面板 */
const DatabaseContent = () =>
  h('div', { class: 'panel-content' }, [
    h('input', {
      style: {
        width: '100%',
        padding: '6px 8px',
        background: '#3c3f41',
        border: '1px solid #555',
        borderRadius: 4,
        color: '#ccc',
        fontSize: 12,
        marginBottom: 8,
        boxSizing: 'border-box',
      },
      placeholder: 'SQL 查询...',
    }),
    ...[
      'users (1.2M rows)',
      'orders (856K rows)',
      'products (42K rows)',
      'categories (128 rows)',
      'reviews (2.1M rows)',
    ].map((name) =>
      h(
        'div',
        {
          style: {
            padding: '6px 8px',
            fontSize: 12,
            color: '#ccc',
            cursor: 'pointer',
            borderBottom: '1px solid #333',
            display: 'flex',
            justifyContent: 'space-between',
          },
        },
        [
          h('span', [
            h('span', { style: { color: '#4ec9b0', marginRight: 6 } }, '🗄'),
            name.split(' ')[0],
          ]),
          h(
            'span',
            { style: { fontSize: 10, color: '#888' } },
            name.split('(')[1]?.replace(')', '') ?? '',
          ),
        ],
      ),
    ),
  ]);

/** 模拟 Favorites 面板 — 带输入 */
const FavoritesContent = () =>
  h('div', { class: 'panel-content' }, [
    h('input', {
      style: {
        width: '100%',
        padding: '6px 8px',
        background: '#3c3f41',
        border: '1px solid #555',
        borderRadius: 4,
        color: '#ccc',
        fontSize: 12,
        marginBottom: 8,
        boxSizing: 'border-box',
      },
      placeholder: '添加收藏...',
    }),
    ...[
      '⭐ lib/utils.ts:generateId',
      '⭐ src/managers/widget.ts',
      '⭐ src/components/TitleView',
      '⭐ README.md:Installation',
      ...Array.from({ length: 20 }, (_, i) => `📌 bookmark-item-${i}`),
    ].map((name) =>
      h(
        'div',
        {
          style: {
            padding: '4px 8px',
            fontSize: 11,
            color: '#ccc',
            cursor: 'pointer',
            borderRadius: 3,
          },
        },
        name,
      ),
    ),
  ]);

/** 模拟 Bookmarks 面板 — 带 textarea */
const BookmarksContent = () =>
  h('div', { class: 'panel-content' }, [
    h('textarea', {
      style: {
        width: '100%',
        height: 50,
        padding: 6,
        background: '#3c3f41',
        border: '1px solid #555',
        borderRadius: 4,
        color: '#ccc',
        fontSize: 12,
        resize: 'vertical',
        boxSizing: 'border-box',
        marginBottom: 8,
      },
      placeholder: '笔记...',
    }),
    ...Array.from({ length: 15 }, (_, i) =>
      h(
        'div',
        {
          style: {
            padding: '4px 8px',
            fontSize: 11,
            color: '#dcdcaa',
            cursor: 'pointer',
            borderBottom: '1px solid #333',
          },
        },
        `🔖 书签 ${i + 1}`,
      ),
    ),
  ]);

// ── 跨面板事件通信测试组件 ──

/** 发送方面板：点击按钮发送事件 */
const EmitterPanel = defineComponent({
  name: 'EmitterPanel',
  props: {
    event: Object as PropType<any>,
  },
  setup(props) {
    const count = ref(0);
    const sendMessage = () => {
      count.value++;
      props.event?.emitGlobal('custom:message', {
        from: 'emitter',
        count: count.value,
        timestamp: new Date().toLocaleTimeString(),
      });
    };
    return () =>
      h('div', { class: 'panel-content', style: { padding: '12px' } }, [
        h('div', { style: { fontSize: 13, color: '#4ec9b0', marginBottom: 8 } }, '📤 发送方面板'),
        h('div', { style: { fontSize: 11, color: '#888', marginBottom: 8 } }, '点击发送跨面板消息'),
        h(
          'button',
          {
            onClick: sendMessage,
            style: {
              padding: '8px 16px',
              background: '#0e639c',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              marginBottom: 12,
            },
          },
          `发送消息 (已发送 ${count.value} 条)`,
        ),
        h(
          'div',
          { style: { fontSize: 11, color: '#6a9955' } },
          `事件: custom:message → { from, count, timestamp }`,
        ),
      ]);
  },
});

/** 接收方面板：订阅事件并显示接收到的数据 */
const ReceiverPanel = defineComponent({
  name: 'ReceiverPanel',
  props: {
    event: Object as PropType<any>,
  },
  setup(props) {
    const messages = ref<Array<{ from: string; count: number; timestamp: string }>>([]);
    onMounted(() => {
      props.event?.onGlobal('custom:message', (payload: any) => {
        messages.value = [...messages.value.slice(-9), payload];
      });
    });
    return () =>
      h('div', { class: 'panel-content', style: { padding: '12px' } }, [
        h('div', { style: { fontSize: 13, color: '#c586c0', marginBottom: 8 } }, '📥 接收方面板'),
        h(
          'div',
          { style: { fontSize: 11, color: '#888', marginBottom: 4 } },
          `已收到 ${messages.value.length} 条消息`,
        ),
        h(
          'div',
          {
            style: {
              maxHeight: '200px',
              overflowY: 'auto',
              fontSize: 11,
              color: '#dcdcaa',
              lineHeight: 1.6,
            },
          },
          messages.value.length === 0
            ? [h('div', { style: { color: '#666' } }, '等待消息...')]
            : messages.value.map((m, i) =>
                h(
                  'div',
                  {
                    key: i,
                    style: {
                      padding: '2px 0',
                      borderBottom: '1px solid #333',
                    },
                  },
                  `[${m.timestamp}] from=${m.from} count=${m.count}`,
                ),
              ),
        ),
      ]);
  },
});

// ── 左侧面板型 widget ──
skeleton.add({
  name: 'project',
  type: 'panel',
  area: 'leftTopArea',
  props: {
    icon: h(FolderOutlined),
    title: '我的面板',
    panelActionsExtra: h('div', '额外操作内容'),
    panelMenuItems: [
      {
        key: 'custom-action',
        label: '自定义操作',
        onClick: () => {
          console.log('自定义操作');
        },
      },
      { type: 'divider' },
      { key: 'another', label: '另一个' },
    ],
  },
  content: h(ProjectContent),
});
skeleton.add({
  name: 'structure',
  type: 'panel',
  area: 'leftTopArea',
  props: { icon: h(ApartmentOutlined), title: 'Structure' },
  index: 1,
  content: h(StructureContent),
});
skeleton.add({
  name: 'git',
  type: 'panel',
  area: 'leftBottomArea',
  props: { icon: h(BranchesOutlined), title: 'Git' },
  index: 2,
  content: h(GitContent),
});

// ── 右侧面板型 widget ──
skeleton.add({
  name: 'database',
  type: 'panel',
  area: 'rightTopArea',
  props: { icon: h(DatabaseOutlined), title: 'Database' },
  content: h(DatabaseContent),
});
skeleton.add({
  name: 'favorites',
  type: 'panel',
  area: 'rightTopArea',
  props: { icon: h(StarOutlined), title: 'Favorites' },
  index: 1,
  content: h(FavoritesContent),
});
skeleton.add({
  name: 'bookmarks',
  type: 'panel',
  area: 'rightBottomArea',
  props: { icon: h(BookOutlined), title: 'Bookmarks' },
  index: 2,
  content: h(BookmarksContent),
});

// ── 快捷操作 ──
skeleton.add({
  name: 'settings-quick',
  type: 'interaction',
  area: 'bottomLeftArea',
  content: h('div', 'help'),

  props: { icon: h(SettingOutlined), align: 'left' },
});
skeleton.add({
  name: 'help',
  type: 'panel',
  area: 'bottomLeftArea',
  content: h('div', 'help'),
  props: { icon: h(QuestionCircleOutlined), align: 'left' },
  index: 1,
});
skeleton.add({
  name: 'notifications',
  type: 'panel',
  area: 'bottomRightArea',
  content: h('div', 'Notifications'),
  props: { icon: h(BellOutlined) },
});

// ── 跨面板事件通信测试面板 ──
skeleton.add({
  name: 'emitter',
  type: 'panel',
  area: 'rightTopArea',
  props: { icon: '📤', title: '发送方' },
  index: 2,
  content: h(EmitterPanel),
});
skeleton.add({
  name: 'receiver',
  type: 'panel',
  area: 'rightBottomArea',
  props: { icon: '📥', title: '接收方' },
  index: 3,
  content: h(ReceiverPanel),
});

// ── 生命周期事件监听 ──
skeleton.event.onGlobal('skeleton:widget-added', (payload: any) => {
  console.log('[lifecycle] skeleton:widget-added →', payload.widget.name);
});
skeleton.event.onGlobal('skeleton:focus-changed', (payload: any) => {
  console.log('[lifecycle] skeleton:focus-changed →', payload.focusedId);
});
skeleton.event.onGlobal('widget:*:focus', (payload: any) => {
  console.log('[lifecycle] widget:focus →', payload.widget.name);
});
skeleton.event.onGlobal('widget:*:blur', (payload: any) => {
  console.log('[lifecycle] widget:blur →', payload.widget.name);
});
skeleton.event.onGlobal('widget:*:view-mode-changed', (payload: any) => {
  console.log('[lifecycle] widget:view-mode-changed →', payload.widget.name, payload.mode);
});
skeleton.event.onGlobal('widget:*:activated', (payload: any) => {
  console.log('[lifecycle] widget:activated →', payload.widget.name);
});
skeleton.event.onGlobal('widget:*:deactivated', (payload: any) => {
  console.log('[lifecycle] widget:deactivated →', payload.widget.name);
});
skeleton.event.onGlobal('panel:*:menu-click', (payload: any) => {
  console.log('[lifecycle] panel:menu-click →', payload.widget.name, payload.key);
});
skeleton.event.onGlobal('panel:*:minimize', (payload: any) => {
  console.log('[lifecycle] panel:minimize →', payload.widget.name);
});
console.log('[lifecycle] All event listeners registered');
</script>

<template>
  <div style="width: 100%; height: 100vh">
    <Layplux :skeleton="skeleton" />
  </div>
</template>
