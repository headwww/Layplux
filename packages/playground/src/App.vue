<script setup lang="ts">
import { h } from 'vue';
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

// ── 左侧 Stripe 上半段 — 面板型 ──
skeleton.add({
  name: 'project',
  type: 'panel',
  area: 'leftTopArea',
  props: { icon: h(FolderOutlined), title: 'Project' },
  content: h('div', { class: 'panel-content' }, 'Project'),
});

skeleton.add({
  name: 'structure',
  type: 'panel',
  area: 'leftTopArea',
  props: { icon: h(ApartmentOutlined), title: 'Structure' },
  index: 1,
  content: h('div', { class: 'panel-content' }, 'Structure'),
});

// ── 左侧 Stripe 下半段 — 面板型 ──
skeleton.add({
  name: 'git',
  type: 'panel',
  area: 'leftBottomArea',
  props: { icon: h(BranchesOutlined), title: 'Git' },
  index: 2,
});

// ── 左侧底部快捷操作 ──
skeleton.add({
  name: 'settings-quick',
  type: 'interaction',
  area: 'bottomLeftArea',
  props: { icon: h(SettingOutlined), align: 'left' },
});

skeleton.add({
  name: 'help',
  type: 'interaction',
  area: 'bottomLeftArea',
  props: { icon: h(QuestionCircleOutlined), align: 'left' },
  index: 1,
});

// ── 右侧 Stripe 上半段 — 面板型 ──
skeleton.add({
  name: 'database',
  type: 'panel',
  area: 'rightTopArea',
  props: { icon: h(DatabaseOutlined), title: 'Database' },
});

skeleton.add({
  name: 'favorites',
  type: 'panel',
  area: 'rightTopArea',
  props: { icon: h(StarOutlined), title: 'Favorites' },
  index: 1,
});

// ── 右侧 Stripe 下半段 — 面板型 ──
skeleton.add({
  name: 'bookmarks',
  type: 'panel',
  area: 'rightBottomArea',
  props: { icon: h(BookOutlined), title: 'Bookmarks' },
  index: 2,
});

// ── 右侧底部快捷操作 ──
skeleton.add({
  name: 'notifications',
  type: 'panel',
  area: 'bottomRightArea',
  props: { icon: h(BellOutlined) },
});
</script>

<template>
  <Layplux :skeleton="skeleton" />
</template>
