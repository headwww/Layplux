<script setup lang="ts">
import { h, defineComponent, ref, onMounted, type PropType } from 'vue';
import { Layplux } from 'layplux';
import { useSkeleton } from '../../layplux/src/managers';
import { Input, Tree, Badge } from 'ant-design-vue';
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
  CodeOutlined,
  FileTextOutlined,
  FileOutlined,
  ThunderboltOutlined,
  ConsoleSqlOutlined,
  AimOutlined,
  TabletOutlined,
  ExperimentOutlined,
  ControlOutlined,
} from '@ant-design/icons-vue';

const skeleton = useSkeleton();

// 注册预设自定义主题
skeleton.registerTheme('ocean', {
  background: '200 15% 10%',
  foreground: '200 10% 95%',
  primary: '200 80% 50%',
  accent: '200 5% 20%',
  border: '200 10% 30%',
});
skeleton.registerTheme('forest', {
  background: '150 10% 10%',
  foreground: '150 10% 95%',
  primary: '150 60% 40%',
  accent: '150 5% 20%',
  border: '150 10% 30%',
});
skeleton.registerTheme('sunset', {
  background: '25 15% 10%',
  foreground: '25 10% 95%',
  primary: '25 80% 50%',
  accent: '25 5% 20%',
  border: '25 10% 30%',
});

// ═══ 国际化切换 ═══════════════════════════════════════════════════════════════

const currentLocale = ref<string>('zh-CN');
const localeLabels: Record<string, string> = { 'zh-CN': '中', 'en-US': 'EN' };
const nextLocales: Record<string, string> = { 'zh-CN': 'en-US', 'en-US': 'zh-CN' };
function toggleLocale() {
  const next = nextLocales[currentLocale.value]!;
  currentLocale.value = next;
  skeleton.setLocale(next);
}
// ═══ 主题切换 ═══════════════════════════════════════════════════════════════

const themes = [
  { name: 'default', label: '默认' },
  { name: 'ocean', label: '海洋' },
  { name: 'forest', label: '森林' },
  { name: 'sunset', label: '日落' },
];

let themeIndex = 0;
function toggleTheme() {
  themeIndex = (themeIndex + 1) % themes.length;
  skeleton.setThemeName(themes[themeIndex].name);
}

const ThemeSwitcher = defineComponent({
  name: 'ThemeSwitcher',
  setup() {
    return () =>
      h(
        'button',
        {
          class: 'ide-btn',
          onClick: toggleTheme,
          title: `Theme: ${skeleton.themeName.value}`,
        },
        themes.find((t) => t.name === skeleton.themeName.value)?.label ?? 'Theme',
      );
  },
});

const LocaleSwitcher = defineComponent({
  name: 'LocaleSwitcher',
  setup() {
    return () =>
      h(
        'button',
        { class: 'ide-btn', onClick: toggleLocale, style: { fontWeight: 'bold' } },
        localeLabels[currentLocale.value],
      );
  },
});

// ═══ 通用样式 ────────────────────────────────────────────────────────────────

const cs = {
  treeItem: (depth = 0, color = '#abb2bf', bold = false) =>
    ({
      padding: `2px 8px 2px ${12 + depth * 14}px`,
      fontSize: 12,
      color,
      cursor: 'pointer',
      borderRadius: 3,
      fontWeight: bold ? 600 : 400,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }) as const,
  section: (color: string) =>
    ({
      padding: '4px 8px',
      fontSize: 11,
      color,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginTop: 4,
    }) as const,
  fileRow: (color: string) =>
    ({
      padding: '3px 8px',
      fontSize: 12,
      color,
      cursor: 'pointer',
      borderRadius: 3,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }) as const,
  badge: (bg: string) =>
    ({
      display: 'inline-block',
      padding: '0 5px',
      fontSize: 10,
      borderRadius: 3,
      background: bg,
      color: '#fff',
      marginLeft: 6,
      lineHeight: '16px',
    }) as const,
  hoverBg: '#2c313a',
};

// ═══ 顶部工具栏 ──────────────────────────────────────────────────────────────

skeleton.add({
  name: 'ProjectSelector',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'left' },
  content: h('div', { class: 'ide-toolbar-left' }, [
    h('span', { style: { fontWeight: 600, fontSize: 13, color: '#e5e5e5' } }, [
      h(FolderOutlined, { style: { marginRight: 6 } }),
      'Layplux',
    ]),
    h('span', { style: { fontSize: 11, color: '#6a9955', marginLeft: 8 } }, '[master]'),
  ]),
});

skeleton.add({
  name: 'RunActions',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'center' },
  content: h('div', { class: 'ide-toolbar-center' }, [
    h('button', { class: 'ide-btn ide-btn--success' }, [h(PlayCircleOutlined), ' Run']),
    h('button', { class: 'ide-btn' }, [h(BugOutlined), ' Debug']),
    h('button', { class: 'ide-btn' }, [h(CheckCircleOutlined), ' Build']),
  ]),
});

skeleton.add({
  name: 'SearchBar',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'right' },
  content: h('div', { class: 'ide-search' }, [
    h(SearchOutlined, { style: { color: '#888', marginRight: 6 } }),
    h(Input, { placeholder: 'Search Everywhere...', disabled: true }),
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
  name: 'ThemeSwitcher',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'right' },
  content: h(ThemeSwitcher),
});
skeleton.add({
  name: 'LocaleSwitcher',
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

// ═══ 底部状态栏 ──────────────────────────────────────────────────────────────

skeleton.add({
  name: 'GitBranchStatus',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'left' },
  content: h('div', { class: 'ide-status-item' }, [
    h(BranchesOutlined, { style: { marginRight: 4 } }),
    'master',
  ]),
});
skeleton.add({
  name: 'Memory',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'right' },
  index: 10,
  content: h('div', { class: 'ide-status-item' }, '512M / 2048M'),
});
skeleton.add({
  name: 'LF',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'right' },
  index: 11,
  content: h('div', { class: 'ide-status-item' }, 'LF'),
});
skeleton.add({
  name: 'UTF8',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'right' },
  index: 12,
  content: h('div', { class: 'ide-status-item' }, 'UTF-8'),
});
skeleton.add({
  name: 'LineCol',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'right' },
  index: 13,
  content: h('div', { class: 'ide-status-item' }, '20:1'),
});
skeleton.add({
  name: 'Spaces',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'right' },
  index: 14,
  content: h('div', { class: 'ide-status-item' }, 'Spaces: 2'),
});

// ═══ 面板内容组件 ────────────────────────────────────────────────────────────

/** 项目文件树 */
const ProjectPanel = defineComponent({
  name: 'ProjectPanel',
  setup() {
    const treeData = [
      {
        title: 'packages',
        key: 'packages',
        icon: h(FolderOutlined, { style: { color: '#e5c07b' } }),
        children: [
          {
            title: 'layplux',
            key: 'layplux',
            icon: h(FolderOutlined, { style: { color: '#e5c07b' } }),
            children: [
              {
                title: 'src',
                key: 'src',
                icon: h(FolderOutlined, { style: { color: '#e5c07b' } }),
                children: [
                  {
                    title: 'components',
                    key: 'components',
                    icon: h(FolderOutlined, { style: { color: '#e5c07b' } }),
                    children: [
                      {
                        title: 'panel-view',
                        key: 'comp-pv',
                        icon: h(FileOutlined, { style: { color: '#61afef' } }),
                        children: [
                          {
                            title: 'index.tsx',
                            key: 'pv-idx',
                            icon: h(FileTextOutlined, { style: { color: '#e06c75' } }),
                          },
                        ],
                      },
                      {
                        title: 'dropdown',
                        key: 'comp-dd',
                        icon: h(FileOutlined, { style: { color: '#61afef' } }),
                        children: [
                          {
                            title: 'index.tsx',
                            key: 'dd-idx',
                            icon: h(FileTextOutlined, { style: { color: '#e06c75' } }),
                          },
                        ],
                      },
                      {
                        title: 'popup',
                        key: 'comp-pop',
                        icon: h(FileOutlined, { style: { color: '#61afef' } }),
                        children: [
                          {
                            title: 'index.tsx',
                            key: 'pop-idx',
                            icon: h(FileTextOutlined, { style: { color: '#e06c75' } }),
                          },
                        ],
                      },
                    ],
                  },
                  {
                    title: 'managers',
                    key: 'managers',
                    icon: h(FolderOutlined, { style: { color: '#e5c07b' } }),
                    children: [
                      {
                        title: 'skeleton.ts',
                        key: 'skel',
                        icon: h(FileTextOutlined, { style: { color: '#d19a66' } }),
                      },
                      {
                        title: 'widget.ts',
                        key: 'widget',
                        icon: h(FileTextOutlined, { style: { color: '#d19a66' } }),
                      },
                      {
                        title: 'pane.ts',
                        key: 'pane',
                        icon: h(FileTextOutlined, { style: { color: '#d19a66' } }),
                      },
                    ],
                  },
                  {
                    title: 'layout',
                    key: 'layout',
                    icon: h(FolderOutlined, { style: { color: '#e5c07b' } }),
                    children: [
                      {
                        title: 'root-pane.tsx',
                        key: 'rp',
                        icon: h(FileTextOutlined, { style: { color: '#e06c75' } }),
                      },
                      {
                        title: 'center-area.tsx',
                        key: 'ca',
                        icon: h(FileTextOutlined, { style: { color: '#e06c75' } }),
                      },
                    ],
                  },
                  {
                    title: 'utils',
                    key: 'utils',
                    icon: h(FolderOutlined, { style: { color: '#e5c07b' } }),
                    children: [
                      {
                        title: 'event-bus.ts',
                        key: 'eb',
                        icon: h(FileTextOutlined, { style: { color: '#d19a66' } }),
                      },
                      {
                        title: 'focus-tracker.ts',
                        key: 'ft',
                        icon: h(FileTextOutlined, { style: { color: '#d19a66' } }),
                      },
                    ],
                  },
                ],
              },
              {
                title: 'package.json',
                key: 'pkg',
                icon: h(FileTextOutlined, { style: { color: '#56b6c2' } }),
              },
              {
                title: 'tsconfig.json',
                key: 'tsconf',
                icon: h(FileTextOutlined, { style: { color: '#56b6c2' } }),
              },
            ],
          },
          {
            title: 'playground',
            key: 'playground',
            icon: h(FolderOutlined, { style: { color: '#e5c07b' } }),
            children: [
              {
                title: 'src',
                key: 'pg-src',
                icon: h(FolderOutlined, { style: { color: '#e5c07b' } }),
                children: [
                  {
                    title: 'App.vue',
                    key: 'app',
                    icon: h(FileTextOutlined, { style: { color: '#c678dd' } }),
                  },
                  {
                    title: 'main.ts',
                    key: 'main',
                    icon: h(FileTextOutlined, { style: { color: '#d19a66' } }),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'docs',
        key: 'docs',
        icon: h(FolderOutlined, { style: { color: '#e5c07b' } }),
        children: [
          {
            title: 'README.md',
            key: 'readme',
            icon: h(FileTextOutlined, { style: { color: '#56b6c2' } }),
          },
          {
            title: 'design',
            key: 'design',
            icon: h(FolderOutlined, { style: { color: '#e5c07b' } }),
            children: [
              {
                title: 'plugin-system.md',
                key: 'ps',
                icon: h(FileTextOutlined, { style: { color: '#56b6c2' } }),
              },
            ],
          },
        ],
      },
    ];
    return () =>
      h('div', { class: 'panel-content ide-panel' }, [
        h(Input, {
          placeholder: 'Search files...',
          prefix: () => h(SearchOutlined),
          class: 'ide-input',
        }),
        h(Tree, {
          treeData,
          defaultExpandAll: true,
          showIcon: true,
          blockNode: true,
          style: { background: 'transparent', color: '#abb2bf', fontSize: 12 },
        } satisfies any),
      ]);
  },
});

/** IDE 编辑器模拟 */
const EditorContent = defineComponent({
  name: 'EditorContent',
  setup() {
    const lines = [
      { n: 1, code: "import { defineComponent, ref } from 'vue';", hl: 'keyword' },
      { n: 2, code: "import { useSkeleton } from '../../layplux/src/managers';", hl: 'string' },
      { n: 3, code: '', hl: '' },
      { n: 4, code: 'export default defineComponent({', hl: 'keyword' },
      { n: 5, code: "  name: 'MyWidget',", hl: 'string' },
      { n: 6, code: '  props: { event: Object },', hl: '' },
      { n: 7, code: '  setup(props) {', hl: 'keyword' },
      { n: 8, code: '    const count = ref(0);', hl: '' },
      { n: 9, code: '', hl: '' },
      { n: 10, code: '    const handleClick = () => {', hl: '' },
      { n: 11, code: '      count.value++;', hl: '' },
      {
        n: 12,
        code: "      props.event.emitGlobal('data:updated', { count: count.value });",
        hl: '',
      },
      { n: 13, code: '    };', hl: '' },
      { n: 14, code: '', hl: '' },
      { n: 15, code: '    return () => (', hl: 'keyword' },
      { n: 16, code: '      <div class="panel-content">', hl: '' },
      { n: 17, code: '        <button onClick={handleClick}>Click me</button>', hl: '' },
      { n: 18, code: '        <span>Count: {count.value}</span>', hl: '' },
      { n: 19, code: '      </div>', hl: '' },
      { n: 20, code: '    );', hl: '' },
      { n: 21, code: '  },', hl: '' },
      { n: 22, code: '});', hl: '' },
    ];
    const getColor = (hl: string) => {
      if (hl === 'keyword') return '#c678dd';
      if (hl === 'string') return '#98c379';
      return '#abb2bf';
    };
    return () =>
      h(
        'div',
        {
          class: 'panel-content',
          style: { overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
        },
        [
          h(
            'div',
            {
              style: {
                padding: '12px 16px',
                borderBottom: '1px solid #2c313a',
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              },
            },
            [
              h(
                'span',
                {
                  style: {
                    fontSize: 11,
                    color: '#e06c75',
                    background: 'rgba(224,108,117,.15)',
                    padding: '2px 8px',
                    borderRadius: 3,
                  },
                },
                'MyWidget.tsx',
              ),
              h('span', { style: { fontSize: 11, color: '#888' } }, '—'),
              h(
                'span',
                { style: { fontSize: 11, color: '#888' } },
                'packages/layplux/src/components',
              ),
            ],
          ),
          ...lines.map((l) =>
            h(
              'div',
              {
                key: l.n,
                class: 'ide-line',
                style: { display: 'flex', height: '22px', lineHeight: '22px', paddingLeft: 8 },
              },
              [
                h(
                  'span',
                  {
                    style: {
                      width: 36,
                      textAlign: 'right',
                      paddingRight: 12,
                      fontSize: 11,
                      color: '#4b5263',
                      flexShrink: 0,
                      userSelect: 'none',
                    },
                  },
                  String(l.n),
                ),
                h(
                  'span',
                  {
                    style: {
                      fontSize: 12,
                      color: getColor(l.hl),
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  },
                  l.code,
                ),
              ],
            ),
          ),
        ],
      );
  },
});

/** Git 变更面板 */
const GitPanel = defineComponent({
  name: 'GitPanel',
  setup() {
    const staged = [
      { file: 'src/managers/skeleton.ts', type: 'M', color: '#e5c07b' },
      { file: 'src/managers/widget.ts', type: 'M', color: '#e5c07b' },
      { file: 'src/components/panel-view/index.tsx', type: 'M', color: '#e5c07b' },
      { file: 'src/types/locale.ts', type: 'A', color: '#98c379' },
      { file: 'src/locales/zh-CN.ts', type: 'A', color: '#98c379' },
      { file: 'src/locales/en-US.ts', type: 'A', color: '#98c379' },
      { file: 'src/locales/index.ts', type: 'A', color: '#98c379' },
    ];
    return () =>
      h('div', { class: 'panel-content ide-panel' }, [
        h(
          'div',
          {
            style: {
              padding: '8px',
              fontSize: 11,
              color: '#888',
              borderBottom: '1px solid #2c313a',
              display: 'flex',
              justifyContent: 'space-between',
            },
          },
          [
            h('span', 'Staged Changes'),
            h('span', [h('span', { style: { color: '#98c379' } }, '7'), ' files']),
          ],
        ),
        ...staged.map((f) =>
          h('div', { key: f.file, style: cs.fileRow(f.color), class: 'ide-hover' }, [
            h(
              'span',
              { style: { ...cs.badge(f.color), fontSize: 9, minWidth: 18, textAlign: 'center' } },
              f.type,
            ),
            h(FileTextOutlined, { style: { fontSize: 11, color: '#528bff' } }),
            h('span', { style: { flex: 1 } }, f.file),
          ]),
        ),
        h('div', { style: { padding: '8px', marginTop: 8, fontSize: 11, color: '#abb2bf' } }, [
          h('div', { style: { marginBottom: 4 } }, 'Commit Message'),
          h('textarea', {
            style: {
              width: '100%',
              height: 60,
              background: '#1e2127',
              border: '1px solid #3a3f4b',
              borderRadius: 4,
              color: '#abb2bf',
              fontSize: 12,
              padding: 8,
              resize: 'vertical',
              boxSizing: 'border-box',
            },
            placeholder: 'feat: add i18n locale support',
            class: 'ide-input',
          }),
        ]),
      ]);
  },
});

/** Terminal 面板 */
const TerminalPanel = defineComponent({
  name: 'TerminalPanel',
  setup() {
    const logs = [
      { text: '> pnpm install', color: '#98c379' },
      { text: 'Packages: +186', color: '#56b6c2' },
      { text: 'Done in 3.2s', color: '#abb2bf' },
      { text: '', color: '' },
      { text: '> npx vue-tsc --noEmit', color: '#98c379' },
      { text: '✓ Type-check passed (0 errors)', color: '#abb2bf' },
      { text: '', color: '' },
      { text: '> vite dev', color: '#98c379' },
      { text: 'VITE v8.0.14  ready in 1124 ms', color: '#56b6c2' },
      { text: '➜  Local:   http://localhost:5173/', color: '#61afef' },
    ];
    return () =>
      h(
        'div',
        { class: 'panel-content ide-panel', style: { fontFamily: "'JetBrains Mono', monospace" } },
        [
          h(
            'div',
            {
              style: {
                padding: '4px 8px',
                fontSize: 11,
                color: '#888',
                borderBottom: '1px solid #2c313a',
                display: 'flex',
                gap: 12,
              },
            },
            [
              h('span', { style: { color: '#98c379' } }, '● Terminal'),
              h('span', { style: { color: '#666' } }, 'master'),
              h('span', { style: { color: '#666' } }, '+'),
            ],
          ),
          h(
            'div',
            { style: { padding: 8 } },
            ...logs.map((l, i) =>
              h(
                'div',
                {
                  key: i,
                  style: { padding: '1px 0', fontSize: 12, color: l.color, lineHeight: '18px' },
                },
                l.text || ' ',
              ),
            ),
          ),
        ],
      );
  },
});

/** 数据库面板 */
const DatabasePanel = defineComponent({
  name: 'DatabasePanel',
  setup() {
    const tables = [
      { name: 'users', rows: '1.2M', cols: 18, color: '#61afef' },
      { name: 'orders', rows: '856K', cols: 24, color: '#e5c07b' },
      { name: 'products', rows: '42K', cols: 12, color: '#98c379' },
      { name: 'categories', rows: '128', cols: 6, color: '#c678dd' },
      { name: 'reviews', rows: '2.1M', cols: 10, color: '#e06c75' },
      { name: 'payments', rows: '980K', cols: 16, color: '#56b6c2' },
    ];
    return () =>
      h('div', { class: 'panel-content ide-panel' }, [
        h(Input, {
          placeholder: 'SQL query...',
          prefix: () => h(ConsoleSqlOutlined),
          class: 'ide-input',
        }),
        h('div', { style: cs.section('#888') }, 'Tables'),
        ...tables.map((t) =>
          h(
            'div',
            {
              key: t.name,
              class: 'ide-hover',
              style: { ...cs.fileRow('#abb2bf'), justifyContent: 'space-between' },
            },
            [
              h('span', { style: { display: 'flex', alignItems: 'center', gap: 6 } }, [
                h('span', {
                  style: {
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: t.color,
                    display: 'inline-block',
                  },
                }),
                t.name,
              ]),
              h('span', { style: { fontSize: 10, color: '#666' } }, `${t.rows} · ${t.cols} cols`),
            ],
          ),
        ),
      ]);
  },
});

/** 收藏面板 */
const FavoritesPanel = defineComponent({
  name: 'FavoritesPanel',
  setup() {
    const items = [
      {
        name: 'useSkeleton()',
        file: 'managers/skeleton.ts',
        icon: h(ThunderboltOutlined, { style: { color: '#e5c07b' } }),
      },
      {
        name: 'createPluginEventBus',
        file: 'utils/event-bus.ts',
        icon: h(ExperimentOutlined, { style: { color: '#61afef' } }),
      },
      {
        name: 'PanelView',
        file: 'components/panel-view/index.tsx',
        icon: h(ControlOutlined, { style: { color: '#c678dd' } }),
      },
      {
        name: 'IWidget',
        file: 'managers/widget.ts',
        icon: h(AimOutlined, { style: { color: '#98c379' } }),
      },
      {
        name: 'useWidgetContainer',
        file: 'managers/widget-container.ts',
        icon: h(TabletOutlined, { style: { color: '#e06c75' } }),
      },
    ];
    return () =>
      h('div', { class: 'panel-content ide-panel' }, [
        h('div', { style: cs.section('#888') }, 'Favorites'),
        ...items.map((item) =>
          h('div', { key: item.name, class: 'ide-hover', style: cs.fileRow('#abb2bf') }, [
            item.icon,
            h('span', {}, item.name),
            h('span', { style: { fontSize: 10, color: '#666', marginLeft: 'auto' } }, item.file),
          ]),
        ),
      ]);
  },
});

/** 事件调试面板 */
const EventDebugPanel = defineComponent({
  name: 'EventDebugPanel',
  props: { event: Object as PropType<any> },
  setup(props) {
    const msgs = ref<Array<{ text: string; time: string }>>([]);
    const count = ref(0);
    const addMsg = (text: string) => {
      msgs.value = [{ text, time: new Date().toLocaleTimeString() }, ...msgs.value.slice(0, 49)];
    };
    onMounted(() => {
      props.event?.onGlobal('widget:*:focus', (p: any) => addMsg(`[focus] ${p.widget.name}`));
      props.event?.onGlobal('widget:*:blur', (p: any) => addMsg(`[blur] ${p.widget.name}`));
      props.event?.onGlobal('widget:*:view-mode-changed', (p: any) =>
        addMsg(`[mode] ${p.widget.name} → ${p.mode}`),
      );
      props.event?.onGlobal('panel:*:menu-click', (p: any) =>
        addMsg(`[menu] ${p.widget.name} → ${p.key}`),
      );
      props.event?.onGlobal('panel:*:minimize', (p: any) => addMsg(`[minimize] ${p.widget.name}`));
      props.event?.onGlobal('custom:debug', (p: any) =>
        addMsg(`[custom] from cross-panel → count=${p.count}`),
      );
    });
    return () =>
      h('div', { class: 'panel-content ide-panel' }, [
        h(
          'div',
          {
            style: {
              padding: '8px',
              borderBottom: '1px solid #2c313a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            },
          },
          [
            h(
              'span',
              { style: { fontSize: 12, color: '#e5c07b', fontWeight: 600 } },
              '⚡ Event Debug',
            ),
            h(
              'button',
              {
                class: 'ide-btn',
                style: { fontSize: 11, padding: '2px 8px' },
                onClick: () => {
                  count.value++;
                  props.event?.emitGlobal('custom:debug', { count: count.value });
                },
              },
              `Send Event (${count.value})`,
            ),
          ],
        ),
        h(
          'div',
          { style: { padding: '4px 0', maxHeight: 'calc(100% - 40px)', overflowY: 'auto' } },
          msgs.value.length === 0
            ? h(
                'div',
                { style: { padding: 12, fontSize: 11, color: '#666' } },
                'Waiting for events...',
              )
            : msgs.value.map((m, i) =>
                h(
                  'div',
                  {
                    key: i,
                    style: {
                      padding: '2px 8px',
                      fontSize: 10,
                      color: '#abb2bf',
                      fontFamily: 'monospace',
                      borderBottom: '1px solid #1e2127',
                    },
                  },
                  [h('span', { style: { color: '#666', marginRight: 8 } }, m.time), m.text],
                ),
              ),
        ),
      ]);
  },
});

// ═══ 注册面板 ────────────────────────────────────────────────────────────────

// 左侧
skeleton.add({
  name: 'project',
  type: 'panel',
  area: 'leftTopArea',
  props: { icon: h(FolderOutlined), title: 'Project' },
  content: h(ProjectPanel),
});
skeleton.add({
  name: 'structure',
  type: 'panel',
  area: 'leftTopArea',
  props: { icon: h(ApartmentOutlined), title: 'Structure' },
  index: 1,
  content: h('div', { class: 'panel-content' }, [
    h('div', { style: { padding: '8px', fontSize: 12, color: '#c678dd' } }, [
      h(FileTextOutlined),
      ' App.vue',
    ]),
    ...[
      { n: 'setup()', c: '#61afef' },
      { n: 'toggleLocale()', c: '#e5c07b' },
      { n: 'skeleton', c: '#d19a66' },
      { n: 'currentLocale', c: '#98c379' },
      { n: 'ProjectPanel', c: '#c678dd' },
      { n: 'EditorContent', c: '#c678dd' },
    ].map((x) =>
      h(
        'div',
        {
          style: { padding: '2px 16px', fontSize: 11, color: x.c, cursor: 'pointer' },
          class: 'ide-hover',
        },
        `🔹 ${x.n}`,
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

// 右侧
skeleton.add({
  name: 'database',
  type: 'panel',
  area: 'rightTopArea',
  props: { icon: h(DatabaseOutlined), title: 'Database' },
  content: h(DatabasePanel),
});
skeleton.add({
  name: 'favorites',
  type: 'panel',
  area: 'rightTopArea',
  props: { icon: h(StarOutlined), title: 'Favorites' },
  index: 1,
  content: h(FavoritesPanel),
});
skeleton.add({
  name: 'bookmarks',
  type: 'panel',
  area: 'rightBottomArea',
  props: { icon: h(BookOutlined), title: 'Bookmarks' },
  index: 2,
  content: h('div', { class: 'panel-content' }, [
    h('div', { style: { padding: '8px', fontSize: 11, color: '#888' } }, 'No bookmarks yet'),
  ]),
});

// 底部
skeleton.add({
  name: 'terminal',
  type: 'panel',
  area: 'bottomLeftArea',
  props: { icon: h(CodeOutlined), title: 'Terminal' },
  content: h(TerminalPanel),
});
skeleton.add({
  name: 'event-debug',
  type: 'panel',
  area: 'bottomRightArea',
  props: { icon: h(ExperimentOutlined), title: 'Events' },
  content: h(EventDebugPanel),
});

// 底部快捷
skeleton.add({
  name: 'settings-quick',
  type: 'interaction',
  area: 'bottomLeftArea',
  props: { icon: h(SettingOutlined), align: 'left' },
  content: h('div', 'Quick'),
});
skeleton.add({
  name: 'help',
  type: 'interaction',
  area: 'bottomLeftArea',
  props: { icon: h(QuestionCircleOutlined), align: 'left' },
  index: 1,
  content: h('div', 'Help'),
});
skeleton.add({
  name: 'notifications',
  type: 'interaction',
  area: 'bottomRightArea',
  props: { icon: h(BellOutlined) },
  content: h(Badge, { count: 3, size: 'small' }, () => ''),
});

// ═══ 编辑器区域内容 ──────────────────────────────────────────────────────────
// 通过 event 注入 editor content
skeleton.add({
  name: 'editor',
  type: 'panel',
  area: 'bottomLeftArea',
  props: { icon: h(FileTextOutlined), title: 'Editor' },
  content: h(EditorContent),
  index: 2,
});

// ═══ 生命周期事件监听 ────────────────────────────────────────────────────────
skeleton.event.onGlobal('skeleton:widget-added', (p: any) =>
  console.warn('[init] widget-added →', p.widget.name),
);
skeleton.event.onGlobal('skeleton:focus-changed', (p: any) =>
  console.warn('[focus] changed →', p.focusedId),
);
console.warn(
  '%c[Layplux] %cDemo ready %c✓',
  'color:#c678dd;font-weight:bold',
  'color:#abb2bf',
  'color:#98c379',
);
</script>

<template>
  <div style="width: 100%; height: 100vh">
    <Layplux :skeleton="skeleton" />
  </div>
</template>

<style lang="scss">
/* ═══ IDEA Dark 主题风格 ═════════════════════════════════════════════════════ */
:root {
  --ide-bg: #1e2127;
  --ide-surface: #282c34;
  --ide-border: #3a3f4b;
  --ide-hover: #2c313a;
  --ide-text: #abb2bf;
  --ide-text-dim: #5c6370;
  --ide-accent: #528bff;
}

.ide-toolbar-left {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 0 8px;
}

.ide-toolbar-center {
  display: flex;
  gap: 2px;
  align-items: center;
}

.ide-toolbar-item {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  color: #abb2bf;
  cursor: pointer;
  border-radius: 3px;
}

.ide-toolbar-item:hover {
  background: #2c313a;
}

.ide-btn {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  color: #abb2bf;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  transition: all 0.15s;
}

.ide-btn:hover {
  background: #2c313a;
  border-color: #3a3f4b;
}

.ide-btn--success {
  color: #98c379;
}

.ide-search {
  display: flex;
  align-items: center;
  padding: 2px 8px;
  /* stylelint-disable-next-line order/properties-order */
  width: 200px;
  margin-right: 8px;
  background: #2c313a;
  border: 1px solid #3a3f4b;
  border-radius: 4px;
}

.ide-search-input {
  width: 100%;
  font-size: 12px;
  color: #abb2bf;
  background: transparent;
  /* stylelint-disable-next-line order/properties-order */
  outline: none;
  border: none;
}

.ide-search-input::placeholder {
  color: #5c6370;
}

.ide-status-item {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 0 10px;
  font-size: 11px;
  color: #abb2bf;
  cursor: default;
}

.ide-status-item:hover {
  color: #fff;
}

.ide-panel {
  background: var(--ide-bg);
}

.ide-hover:hover {
  background: var(--ide-hover);
}

/* antd overrides */
.ant-tree {
  color: #abb2bf !important;
  background: transparent !important;
}

.ant-tree-treenode {
  padding: 1px 0 !important;
}

.ant-tree-title {
  font-size: 12px !important;
}

.ant-tree-node-content-wrapper:hover {
  background: #2c313a !important;
}

.ant-tree-switcher {
  color: #5c6370 !important;
}

.ant-input-affix-wrapper {
  background: #2c313a !important;
  border-color: #3a3f4b !important;
}

.ant-input {
  color: #abb2bf !important;
}

.ant-input::placeholder {
  color: #5c6370 !important;
}

.ant-badge-count {
  background: #e06c75 !important;
  box-shadow: none !important;
}
</style>
