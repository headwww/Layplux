import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Layplux',
  description: '可扩展的 IDE 布局框架',
  lang: 'zh-CN',

  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API', link: '/api/skeleton' },
      { text: '组件', link: '/components/panel-view' },
      { text: '特性', link: '/features/theme' },
    ],

    sidebar: {
      '/guide/': [
        { text: '快速开始', link: '/guide/getting-started' },
        { text: '核心概念', link: '/guide/core-concepts' },
      ],
      '/api/': [
        { text: 'Skeleton', link: '/api/skeleton' },
        { text: 'Widget', link: '/api/widget' },
        { text: 'Pane', link: '/api/pane' },
      ],
      '/components/': [
        { text: 'PanelView', link: '/components/panel-view' },
        { text: 'CenterView', link: '/components/center-view' },
        { text: 'Dropdown', link: '/components/dropdown' },
        { text: 'Tooltip & Popup', link: '/components/tooltip-popup' },
      ],
      '/features/': [
        { text: '主题系统', link: '/features/theme' },
        { text: '国际化', link: '/features/i18n' },
        { text: '事件系统', link: '/features/events' },
        { text: '错误边界', link: '/features/error-boundary' },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com' }],

    footer: {
      message: 'MIT Licensed',
    },
  },
});
