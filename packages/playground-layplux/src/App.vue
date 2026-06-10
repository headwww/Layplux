<script setup lang="ts">
import { h, defineComponent, ref } from 'vue'
import { Layplux, useSkeleton } from 'layplux'

const skeleton = useSkeleton()

// ═══ 主题切换 ═══════════════════════════════════════════════════════════
const theme = ref(skeleton.theme.value)
const nextTheme: Record<string, 'light' | 'dark'> = { light: 'dark', dark: 'light' }

const ThemeBtn = defineComponent({
  setup: () => () =>
    h('button', {
      class: 'pg-btn',
      onClick: () => {
        const nxt = nextTheme[theme.value]
        skeleton.setTheme(nxt)
        theme.value = nxt
      },
    }, theme.value === 'light' ? '🌙 暗色' : '☀️ 亮色'),
})

// ═══ 主题色切换 ═════════════════════════════════════════════════════════
const colors = ['default', 'blue', 'green', 'warm']
skeleton.registerTheme('blue', {
  '--layplux-primary': '200 80% 50%',
  '--layplux-accent': '200 5% 20%',
  '--layplux-border': '200 10% 30%',
})
skeleton.registerTheme('green', {
  '--layplux-primary': '150 60% 40%',
  '--layplux-accent': '150 5% 20%',
  '--layplux-border': '150 10% 30%',
})
skeleton.registerTheme('warm', {
  '--layplux-primary': '25 80% 50%',
  '--layplux-accent': '25 5% 20%',
  '--layplux-border': '25 10% 30%',
})
let colorIdx = 0
const ColorBtn = defineComponent({
  setup: () => () =>
    h('button', {
      class: 'pg-btn',
      onClick: () => {
        colorIdx = (colorIdx + 1) % colors.length
        skeleton.setThemeName(colors[colorIdx])
      },
    }, `🎨 ${colors[colorIdx]}`),
})

// ═══ 语言切换 ═══════════════════════════════════════════════════════════
const locale = ref('zh-CN')
const LocaleBtn = defineComponent({
  setup: () => () =>
    h('button', {
      class: 'pg-btn',
      onClick: () => {
        const nxt = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
        skeleton.setLocale(nxt)
        locale.value = nxt
      },
    }, locale.value === 'zh-CN' ? 'EN' : '中'),
})

// ═══ 顶部工具栏 ═════════════════════════════════════════════════════════
skeleton.add({
  name: 'brand',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'left' },
  content: h('span', { style: { fontWeight: 700, fontSize: 14 } }, 'Layplux Playground'),
})

skeleton.add({
  name: 'actions',
  type: 'interaction',
  area: 'topArea',
  props: { align: 'center' },
  content: h('div', { style: { display: 'flex', gap: 6 } }, [
    h(ColorBtn),
    h(ThemeBtn),
    h(LocaleBtn),
  ]),
})

// ═══ 底部状态栏 ═════════════════════════════════════════════════════════
skeleton.add({
  name: 'status-left',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'left' },
  content: h('span', { style: { fontSize: 12 } }, '✅ Layplux v2.0.0'),
})

skeleton.add({
  name: 'status-right',
  type: 'interaction',
  area: 'bottomArea',
  props: { align: 'right' },
  content: h('span', { style: { fontSize: 12 } }, 'UTF-8 · LF · Spaces: 2'),
})

// ═══ 左侧面板 ═══════════════════════════════════════════════════════════
skeleton.add({
  name: 'explorer',
  type: 'panel',
  area: 'leftTopArea',
  props: { title: '资源管理器' },
  index: 0,
  content: h('div', { class: 'pg-panel' }, [
    h('div', { class: 'pg-panel-title' }, ['📁 src', h('div', { class: 'pg-panel-sub' }, ['App.vue', 'main.ts', 'components/'])].map(t => h('div', { class: 'pg-file' }, t))),
  ]),
})

skeleton.add({
  name: 'outline',
  type: 'panel',
  area: 'leftTopArea',
  props: { title: '大纲' },
  index: 1,
  content: h('div', { class: 'pg-panel' }, [
    ['useSkeleton()', 'skeleton.add()', 'skeleton.setTheme()'].map(t =>
      h('div', { class: 'pg-file' }, t),
    ),
  ]),
})

// ═══ 右侧面板 ═══════════════════════════════════════════════════════════
skeleton.add({
  name: 'props',
  type: 'panel',
  area: 'rightTopArea',
  props: { title: '属性' },
  content: h('div', { class: 'pg-panel' }, [
    h('div', { style: { padding: 12, fontSize: 13 } }, [
      h('div', { style: { marginBottom: 8, fontWeight: 600 } }, 'Layplux 核心特性'),
      ...['🧩 灵活布局 · 8 区域', '🎨 主题系统 · 亮/暗/自定义', '🌍 国际化 · 中/英', '⚡ 事件总线 · EventEmitter2', '🪟 面板系统 · Dock/Undock'].map(s =>
        h('div', { style: { padding: '4px 0', fontSize: 12 } }, s),
      ),
    ]),
  ]),
})

// ═══ 底部面板 ═══════════════════════════════════════════════════════════
skeleton.add({
  name: 'terminal',
  type: 'panel',
  area: 'bottomLeftArea',
  props: { title: '终端' },
  content: h('div', { class: 'pg-panel', style: { fontFamily: 'monospace', fontSize: 13, padding: 12 } }, [
    h('div', { style: { color: 'hsl(var(--layplux-primary))' } }, '$ pnpm add layplux'),
    h('div', {}, 'Already installed layplux@2.0.0'),
    h('div', { style: { color: 'hsl(var(--layplux-primary))' } }, '$ pnpm dev'),
    h('div', {}, 'VITE v8.0.14  ready in 320 ms'),
  ]),
})

skeleton.add({
  name: 'events',
  type: 'panel',
  area: 'bottomRightArea',
  props: { title: '事件日志' },
  content: h('div', { class: 'pg-panel', style: { padding: 8, fontSize: 12 } }, [
    ['widget-added: brand', 'widget-added: explorer', 'widget-added: terminal', 'focus-changed: explorer'].map((e, i) =>
      h('div', { style: { padding: '2px 0', color: i === 3 ? 'hsl(var(--layplux-primary))' : '' } }, `[${i + 1}] ${e}`),
    ),
  ]),
})

// ═══ 中心区域 ═══════════════════════════════════════════════════════════
skeleton.add({
  name: 'welcome',
  type: 'panel',
  area: 'centerArea',
  content: h('div', { class: 'pg-center' }, [
    h('div', { style: { fontSize: 32, fontWeight: 700, marginBottom: 16 } }, 'Layplux'),
    h('div', { style: { fontSize: 16, opacity: 0.6, marginBottom: 32 } }, 'IDE-like window system for the web'),
    h('div', { style: { display: 'flex', gap: 16 } }, [
      h('div', { class: 'pg-card' }, [
        h('div', { class: 'pg-card-title' }, '安装'),
        h('code', {}, 'pnpm add layplux'),
      ]),
      h('div', { class: 'pg-card' }, [
        h('div', { class: 'pg-card-title' }, '引入'),
        h('code', {}, "import { Layplux } from 'layplux'"),
      ]),
      h('div', { class: 'pg-card' }, [
        h('div', { class: 'pg-card-title' }, '样式'),
        h('code', {}, "import 'layplux/scss'"),
      ]),
    ]),
  ]),
})

skeleton.centerArea.container.activate('welcome')

// 事件监听
skeleton.event.onGlobal('skeleton:widget-added', (p: any) => console.warn('[widget-added]', p.widget.name))
skeleton.event.onGlobal('skeleton:focus-changed', (p: any) => console.warn('[focus]', p.focusedId))
</script>

<template>
  <div style="width:100%;height:100vh">
    <Layplux :skeleton="skeleton" />
  </div>
</template>

<style lang="scss">
body {
  margin: 0;
}

.pg-btn {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 4px 12px;
  font-size: 12px;
  color: hsl(var(--layplux-foreground));
  cursor: pointer;
  background: transparent;
  border: 1px solid hsl(var(--layplux-border));
  border-radius: 4px;
  transition: background 0.15s;

  &:hover {
    background: hsl(var(--layplux-hover));
  }
}

.pg-panel {
  padding: 8px;
}

.pg-panel-title {
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.5;
}

.pg-panel-sub {
  margin-top: 4px;
}

.pg-file {
  padding: 3px 8px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 3px;

  &:hover {
    background: hsl(var(--layplux-hover));
  }
}

.pg-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: hsl(var(--layplux-foreground));
}

.pg-card {
  padding: 20px 28px;
  text-align: center;
  background: hsl(var(--layplux-accent));
  border: 1px solid hsl(var(--layplux-border));
  border-radius: 8px;

  code {
    font-size: 13px;
    opacity: 0.7;
  }
}

.pg-card-title {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
}
</style>
