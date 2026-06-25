<script setup lang="ts">
import { h, defineComponent, ref } from 'vue';
import { Layplux } from 'layplux';
import { useSkeleton } from '../../layplux/src/managers';
import { Badge } from 'ant-design-vue';
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
  PlayCircleOutlined,
  BugOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  LaptopOutlined,
  CaretRightOutlined,
  HighlightOutlined,
} from '@ant-design/icons-vue';
import ProjectPanel from './components/ProjectPanel.vue';
import EditorContent from './components/EditorContent.vue';
import MenuPanel from './components/MenuPanel.vue';
import CenterRouterView from './components/CenterRouterView.vue';
import GitPanel from './components/GitPanel.vue';
import TerminalPanel from './components/TerminalPanel.vue';
import DatabasePanel from './components/DatabasePanel.vue';
import FavoritesPanel from './components/FavoritesPanel.vue';
import EventDebugPanel from './components/EventDebugPanel.vue';

// 从 localStorage 恢复状态
const saved = JSON.parse(localStorage.getItem('layplux-state') || '{}');
const skeleton = useSkeleton({ initialState: saved });

// 监听状态变更，持久化到 localStorage
skeleton.event.onGlobal('skeleton:state-changed', (state: any) => {
  console.log('state-changed', state);
  localStorage.setItem('layplux-state', JSON.stringify(state));
});

// ═══ 国际化 ──────────────────────────────────────────────────────────
const currentLocale = ref<string>('zh-CN');
const localeLabels: Record<string, string> = { 'zh-CN': '中', 'en-US': 'EN' };
const nextLocales: Record<string, string> = { 'zh-CN': 'en-US', 'en-US': 'zh-CN' };
function toggleLocale() {
  skeleton.setLocale(nextLocales[currentLocale.value]!);
  currentLocale.value = nextLocales[currentLocale.value]!;
}
const LocaleSwitcher = defineComponent({
  setup: () => () =>
    h('button', { class: 'ide-btn', onClick: toggleLocale }, localeLabels[currentLocale.value]),
});

// ═══ 亮暗切换 ────────────────────────────────────────────────────────
const schemeIcons: Record<string, any> = { light: HighlightOutlined, dark: HighlightOutlined, system: LaptopOutlined };
const schemeLabels: Record<string, string> = { light: '亮色', dark: '暗色', system: '自动' };
const nextSchemes: Record<string, 'light' | 'dark' | 'system'> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};
const ThemeSwitcher = defineComponent({
  setup: () => () =>
    h(
      'button',
      {
        class: 'ide-btn',
        onClick: () => skeleton.setTheme(nextSchemes[skeleton.theme.value]!),
      },
      [h(schemeIcons[skeleton.theme.value]), ` ${schemeLabels[skeleton.theme.value]}`],
    ),
});

// ═══ 主题色 ──────────────────────────────────────────────────────────
skeleton.registerTheme('blue', {
  '--layplux-primary': '200 80% 50%',
  '--layplux-accent': '200 5% 20%',
  '--layplux-border': '200 10% 30%',
});
skeleton.registerTheme('green', {
  '--layplux-primary': '150 60% 40%',
  '--layplux-accent': '150 5% 20%',
  '--layplux-border': '150 10% 30%',
});
skeleton.registerTheme('warm', {
  '--layplux-primary': '25 80% 50%',
  '--layplux-accent': '25 5% 20%',
  '--layplux-border': '25 10% 30%',
});
const themeColors = [
  { name: 'default', label: '默认' },
  { name: 'blue', label: '蓝' },
  { name: 'green', label: '绿' },
  { name: 'warm', label: '暖' },
];
let ci = 0;
const ThemeColorSwitcher = defineComponent({
  setup: () => () =>
    h(
      'button',
      {
        class: 'ide-btn',
        onClick: () => {
          ci = (ci + 1) % themeColors.length;
          skeleton.setThemeName(themeColors?.at(ci)?.name ?? 'default');
        },
      },
      themeColors.find((t) => t.name === skeleton.themeName.value)?.label ?? '色',
    ),
});

// ═══ 中心区域切换 ────────────────────────────────────────────────────
const centerMode = ref<'router' | 'editor'>('router');
const ToggleCenter = defineComponent({
  setup: () => () =>
    h(
      'button',
      {
        class: 'ide-btn',
        onClick: () => {
          centerMode.value = centerMode.value === 'router' ? 'editor' : 'router';
          const target = centerMode.value === 'router' ? 'center-router' : 'center-editor';
          skeleton.centerArea.container.activate(target);
        },
      },
      centerMode.value === 'router' ? [h(CodeOutlined), ' 编辑器'] : [h(ApartmentOutlined), ' 路由'],
    ),
});

// ═══ 顶部工具栏 ──────────────────────────────────────────────────────
skeleton.add({
  name: 'Project',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'left' },
  content: h('span', { style: { fontWeight: 600, fontSize: 13 } }, [
    h(FolderOutlined, { style: { marginRight: 6 } }),
    'Layplux',
  ]),
});
skeleton.add({
  name: 'Actions',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'center' },
  content: h('div', { style: { display: 'flex', gap: '4px', alignItems: 'center' } }, [
    h('button', { class: 'ide-btn' }, [h(PlayCircleOutlined), ' 运行']),
    h('button', { class: 'ide-btn' }, [h(BugOutlined), ' 调试']),
    h('button', { class: 'ide-btn' }, [h(CheckCircleOutlined), ' 构建']),
    h(ToggleCenter),
  ]),
});
skeleton.add({
  name: 'GitBranch',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'right' },
  content: h('div', { class: 'ide-toolbar-item' }, [h(BranchesOutlined), ' main']),
});
skeleton.add({
  name: 'ThemeColor',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'right' },
  content: h(ThemeColorSwitcher),
});
skeleton.add({
  name: 'Theme',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'right' },
  content: h(ThemeSwitcher),
});
skeleton.add({
  name: 'Locale',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'right' },
  content: h(LocaleSwitcher),
});
skeleton.add({
  name: 'Settings',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'right' },
  content: h('div', { class: 'ide-toolbar-item' }, [h(SettingOutlined)]),
});

// ═══ 底部状态栏 ──────────────────────────────────────────────────────
skeleton.add({
  name: 'GitStatus',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'left' },
  content: h('div', { class: 'ide-status-item' }, [
    h(BranchesOutlined, { style: { marginRight: 4 } }),
    'master',
  ]),
});
skeleton.add({
  name: 'LineCol',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'right' },
  index: 10,
  content: h('div', { class: 'ide-status-item' }, '20:1'),
});
skeleton.add({
  name: 'Encoding',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'right' },
  index: 11,
  content: h('div', { class: 'ide-status-item' }, 'UTF-8  LF  Spaces: 2'),
});
skeleton.add({
  name: 'Memory',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'right' },
  index: 12,
  content: h('div', { class: 'ide-status-item' }, '512M / 2048M'),
});

// ═══ 左侧面板 ────────────────────────────────────────────────────────
skeleton.add({
  name: 'menu',
  type: 'panel',
  area: 'leftTopArea',
  props: { icon: h(FolderOutlined), title: '菜单' },
  index: 0,
  content: h(MenuPanel),
});
skeleton.add({
  name: 'project',
  type: 'panel',
  area: 'leftTopArea',
  props: { icon: h(FolderOutlined), title: '项目' },
  content: h(ProjectPanel),
});
skeleton.add({
  name: 'structure',
  type: 'panel',
  area: 'leftTopArea',
  props: { icon: h(ApartmentOutlined), title: '结构' },
  index: 1,
  content: h('div', { class: 'panel-content' }, [
    h(
      'div',
      { style: { padding: '4px 16px', fontSize: 11 } },
      ['App.vue', 'setup()', 'toggleLocale()', 'skeleton', 'ProjectPanel'].map((n) =>
        h('div', { class: 'ide-hover', style: { padding: '2px 0', cursor: 'pointer' } }, [h(CaretRightOutlined, { style: { fontSize: '10px', marginRight: '4px' } }), n]),
      ),
    ),
  ]),
});
skeleton.add({
  name: 'git',
  type: 'panel',
  area: 'leftBottomArea',
  props: { icon: h(BranchesOutlined), title: 'Git' },
  index: 2,
  content: h(GitPanel),
});

// ═══ 右侧面板 ────────────────────────────────────────────────────────
skeleton.add({
  name: 'database',
  type: 'panel',
  area: 'rightTopArea',
  props: { icon: h(DatabaseOutlined), title: '数据库' },
  content: h(DatabasePanel),
});
skeleton.add({
  name: 'favorites',
  type: 'panel',
  area: 'rightTopArea',
  props: { icon: h(StarOutlined), title: '收藏' },
  index: 1,
  content: h(FavoritesPanel),
});
skeleton.add({
  name: 'bookmarks',
  type: 'panel',
  area: 'rightBottomArea',
  props: { icon: h(BookOutlined), title: '书签' },
  index: 2,
  content: h('div', { class: 'panel-content' }, [
    h('div', { style: { padding: 8, fontSize: 11 } }, '暂无书签'),
  ]),
});

// ═══ 底部面板 ────────────────────────────────────────────────────────
skeleton.add({
  name: 'terminal',
  type: 'panel',
  area: 'bottomLeftArea',
  props: { icon: h(CodeOutlined), title: '终端' },
  content: h(TerminalPanel),
});
skeleton.add({
  name: 'event-debug',
  type: 'panel',
  area: 'bottomRightArea',
  props: { icon: h(ExperimentOutlined), title: '事件' },
  content: h(EventDebugPanel),
});

// ═══ 底部快捷 ────────────────────────────────────────────────────────
skeleton.add({
  name: 'help',
  type: 'interaction',
  area: 'bottomLeftArea',
  props: { icon: h(QuestionCircleOutlined) },
  content: h('div', '帮助'),
});
skeleton.add({
  name: 'notifications',
  type: 'interaction',
  area: 'bottomRightArea',
  props: { icon: h(BellOutlined) },
  content: h(Badge, { count: 3, size: 'small' }, () => ''),
});

// ═══ 编辑器 ──────────────────────────────────────────────────────────
skeleton.add({
  name: 'editor',
  type: 'panel',
  area: 'bottomLeftArea',
  props: { icon: h(FileTextOutlined), title: '编辑器' },
  index: 1,
  content: h(EditorContent),
});

// ═══ 中心区域：路由视图 ──────────────────────────────────────────────
skeleton.add({
  name: 'center-router',
  type: 'panel',
  area: 'centerArea',
  content: h(CenterRouterView),
});

// ═══ 中心区域：独立编辑器 ────────────────────────────────────────────
skeleton.add({
  name: 'center-editor',
  type: 'panel',
  area: 'centerArea',
  content: h(EditorContent),
});

// 默认激活路由视图
skeleton.centerArea.container.activate('center-router');

// ═══ 生命周期事件监听 ──────────────────────────────────────────────────
skeleton.event.onGlobal('skeleton:widget-added', (p: any) => console.warn('[init]', p.widget.name));
skeleton.event.onGlobal('skeleton:focus-changed', (p: any) => console.warn('[focus]', p.focusedId));
</script>

<template>
  <div style="width: 100%; height: 100vh">
    <Layplux :skeleton="skeleton" />
  </div>
</template>

<style lang="scss">
.ide-toolbar-item {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 3px;

  &:hover {
    background: hsl(var(--layplux-hover));
  }
}

.ide-btn {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  transition: all 0.15s;

  &:hover {
    background: hsl(var(--layplux-hover));
    border-color: hsl(var(--layplux-border));
  }
}

.ide-status-item {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 0 10px;
  font-size: 11px;
  cursor: default;
}

.ide-panel {
  background: hsl(var(--layplux-background));
}

.ide-hover:hover {
  background: hsl(var(--layplux-hover));
}
</style>
