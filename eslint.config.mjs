import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import oxlint from 'eslint-plugin-oxlint';

export default [
  // =====================
  // 忽略文件
  // =====================
  {
    ignores: ['dist/**', 'node_modules/**', '*.min.js', 'public/**'],
  },

  // =====================
  // Vue 文件解析
  // =====================
  ...pluginVue.configs['flat/recommended'],

  // =====================
  // TypeScript 类型感知规则（oxlint 暂不支持）
  // =====================
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
  })),

  // =====================
  // TypeScript 解析器配置
  // =====================
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        extraFileExtensions: ['.vue'],
      },
    },
  },

  // =====================
  // 关闭所有已被 oxlint 覆盖的规则（避免重复报错）
  // =====================
  ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),

  // =====================
  // 自定义规则（仅补充 oxlint 不覆盖的部分）
  // =====================
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    rules: {
      // Vue template 规则（oxlint 不支持）
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'vue/require-default-prop': 'off',
      'vue/component-tags-order': [
        'error',
        {
          order: ['script', 'template', 'style'],
        },
      ],
      'vue/define-macros-order': [
        'error',
        {
          order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'],
        },
      ],
      'vue/block-lang': [
        'error',
        {
          script: { lang: 'ts' },
          style: { lang: 'scss' },
        },
      ],
      'vue/no-unused-vars': 'error',
      'vue/no-undef-components': 'error',

      // TypeScript 类型感知规则（oxlint 暂不支持）
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',

      // 关闭与 oxfmt 格式化冲突的风格规则
      '@typescript-eslint/indent': 'off',
      '@typescript-eslint/quotes': 'off',
      '@typescript-eslint/semi': 'off',
    },
  },
];
