<script setup lang="ts">
import { h } from 'vue';
import {
  FolderOutlined, FileOutlined, FileTextOutlined, SearchOutlined,
} from '@ant-design/icons-vue';
import { Input, Tree } from 'ant-design-vue';

const treeData = [
  { title: 'packages', key: 'packages', icon: h(FolderOutlined, { style: { color: '#e5c07b' } }), children: [
    { title: 'layplux', key: 'layplux', icon: h(FolderOutlined, { style: { color: '#e5c07b' } }), children: [
      { title: 'src', key: 'src', icon: h(FolderOutlined, { style: { color: '#e5c07b' } }), children: [
        { title: 'components', key: 'components', icon: h(FolderOutlined, { style: { color: '#e5c07b' } }), children: [
          { title: 'panel-view', key: 'comp-pv', icon: h(FileOutlined, { style: { color: '#61afef' } }), children: [{ title: 'index.tsx', key: 'pv-idx', icon: h(FileTextOutlined, { style: { color: '#e06c75' } }) }] },
          { title: 'dropdown', key: 'comp-dd', icon: h(FileOutlined, { style: { color: '#61afef' } }), children: [{ title: 'index.tsx', key: 'dd-idx', icon: h(FileTextOutlined, { style: { color: '#e06c75' } }) }] },
          { title: 'popup', key: 'comp-pop', icon: h(FileOutlined, { style: { color: '#61afef' } }), children: [{ title: 'index.tsx', key: 'pop-idx', icon: h(FileTextOutlined, { style: { color: '#e06c75' } }) }] },
        ] },
        { title: 'managers', key: 'managers', icon: h(FolderOutlined, { style: { color: '#e5c07b' } }), children: [
          { title: 'skeleton.ts', key: 'skel', icon: h(FileTextOutlined, { style: { color: '#d19a66' } }) },
          { title: 'widget.ts', key: 'widget', icon: h(FileTextOutlined, { style: { color: '#d19a66' } }) },
          { title: 'pane.ts', key: 'pane', icon: h(FileTextOutlined, { style: { color: '#d19a66' } }) },
          { title: 'theme.ts', key: 'theme', icon: h(FileTextOutlined, { style: { color: '#d19a66' } }) },
        ] },
        { title: 'layout', key: 'layout', icon: h(FolderOutlined, { style: { color: '#e5c07b' } }), children: [
          { title: 'root-pane.tsx', key: 'rp', icon: h(FileTextOutlined, { style: { color: '#e06c75' } }) },
          { title: 'center-area.tsx', key: 'ca', icon: h(FileTextOutlined, { style: { color: '#e06c75' } }) },
        ] },
        { title: 'utils', key: 'utils', icon: h(FolderOutlined, { style: { color: '#e5c07b' } }), children: [
          { title: 'event-bus.ts', key: 'eb', icon: h(FileTextOutlined, { style: { color: '#d19a66' } }) },
          { title: 'focus-tracker.ts', key: 'ft', icon: h(FileTextOutlined, { style: { color: '#d19a66' } }) },
        ] },
        { title: 'types', key: 'types', icon: h(FolderOutlined, { style: { color: '#e5c07b' } }), children: [
          { title: 'config.ts', key: 'config', icon: h(FileTextOutlined, { style: { color: '#d19a66' } }) },
          { title: 'locale.ts', key: 'locale', icon: h(FileTextOutlined, { style: { color: '#d19a66' } }) },
        ] },
        { title: 'locales', key: 'locales', icon: h(FolderOutlined, { style: { color: '#e5c07b' } }), children: [
          { title: 'zh-CN.ts', key: 'zhcn', icon: h(FileTextOutlined, { style: { color: '#56b6c2' } }) },
          { title: 'en-US.ts', key: 'enus', icon: h(FileTextOutlined, { style: { color: '#56b6c2' } }) },
          { title: 'index.ts', key: 'locidx', icon: h(FileTextOutlined, { style: { color: '#56b6c2' } }) },
        ] },
      ] },
      { title: 'package.json', key: 'pkg', icon: h(FileTextOutlined, { style: { color: '#56b6c2' } }) },
      { title: 'tsconfig.json', key: 'tsconf', icon: h(FileTextOutlined, { style: { color: '#56b6c2' } }) },
    ] },
    { title: 'playground', key: 'playground', icon: h(FolderOutlined, { style: { color: '#e5c07b' } }), children: [
      { title: 'src', key: 'pg-src', icon: h(FolderOutlined, { style: { color: '#e5c07b' } }), children: [
        { title: 'App.vue', key: 'app', icon: h(FileTextOutlined, { style: { color: '#c678dd' } }) },
        { title: 'main.ts', key: 'main', icon: h(FileTextOutlined, { style: { color: '#d19a66' } }) },
      ] },
    ] },
  ] },
  { title: 'docs', key: 'docs', icon: h(FolderOutlined, { style: { color: '#e5c07b' } }), children: [
    { title: 'README.md', key: 'readme', icon: h(FileTextOutlined, { style: { color: '#56b6c2' } }) },
  ] },
];
</script>

<template>
  <div class="panel-content ide-panel">
    <Input
      placeholder="Search files..."
      size="small"
    >
      <template #prefix>
        <SearchOutlined />
      </template>
    </Input>
    <Tree
      :tree-data="treeData"
      :default-expand-all="true"
      :show-icon="true"
      :block-node="true"
    />
  </div>
</template>
