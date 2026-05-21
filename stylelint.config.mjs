export default {
  // -- 基础扩展 ------------------------------------------------
  extends: [
    'stylelint-config-standard', // CSS 标准规则
    'stylelint-config-recess-order', // 属性声明按规范排序
  ],

  // -- 忽略文件 ------------------------------------------------
  ignoreFiles: [
    '**/*.js',
    '**/*.jsx',
    '**/*.tsx',
    '**/*.ts',
    '**/*.json',
    '**/*.md',
  ],

  // -- 文件级覆盖 ----------------------------------------------
  overrides: [
    {
      // Vue / HTML：用 postcss-html 解析 SFC 中的 <style> 块
      customSyntax: 'postcss-html',
      files: ['*.(html|vue)', '**/*.(html|vue)'],
      rules: {
        // 允许 Vue scoped 相关的伪类
        'selector-pseudo-class-no-unknown': [
          true,
          { ignorePseudoClasses: ['global', 'deep'] },
        ],
        // 允许 Vue 深度选择器伪元素
        'selector-pseudo-element-no-unknown': [
          true,
          { ignorePseudoElements: ['v-deep', 'v-global', 'v-slotted'] },
        ],
      },
    },
    {
      // SCSS：用 postcss-scss 解析，扩展 SCSS + Vue SCSS 规则
      customSyntax: 'postcss-scss',
      extends: [
        'stylelint-config-recommended-scss',
        'stylelint-config-recommended-vue/scss',
      ],
      files: ['*.scss', '**/*.scss'],
    },
  ],

  // -- 插件 ----------------------------------------------------
  plugins: [
    'stylelint-order', // 声明块内属性排序
    '@stylistic/stylelint-plugin', // 风格规则（缩进、空格等）
    'stylelint-prettier', // Prettier 作为 Stylelint 规则运行
    'stylelint-scss', // SCSS 专用规则
  ],

  // -- 规则覆盖 ------------------------------------------------
  rules: {
    // 允许已知的 SCSS / UnoCSS at 规则
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'extends',
          'ignores',
          'include',
          'mixin',
          'if',
          'else',
          'media',
          'for',
          'at-root',
          'tailwind',
          'apply',
          'variants',
          'responsive',
          'screen',
          'function',
          'each',
          'use',
          'forward',
          'return',
        ],
      },
    ],
    'scss/at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'extends',
          'ignores',
          'include',
          'mixin',
          'if',
          'else',
          'media',
          'for',
          'at-root',
          'tailwind',
          'apply',
          'variants',
          'responsive',
          'screen',
          'function',
          'each',
          'use',
          'forward',
          'return',
        ],
      },
    ],

    // ---- 关闭的规则 ----
    'at-rule-no-deprecated': null, // SCSS @import 等仍在使用
    'font-family-no-missing-generic-family-keyword': null,
    'function-no-unknown': null,
    'import-notation': null, // 不强制 @import → @use
    'media-feature-range-notation': null,
    'named-grid-areas-no-invalid': null,
    'nesting-selector-no-missing-scoping-root': null, // SCSS 嵌套场景宽松
    'no-descending-specificity': null, // 降序优先级有时是故意的
    'no-empty-source': null, // 允许空样式文件
    'scss/operator-no-newline-after': null,
    'selector-not-notation': null,

    // ---- 自定义规则 ----
    // 规则间空行，注释后和首个嵌套规则前除外
    'rule-empty-line-before': [
      'always',
      { ignore: ['after-comment', 'first-nested'] },
    ],

    // 样式声明分组顺序
    'order/order': [
      [
        'dollar-variables', // $ 变量
        'custom-properties', // -- 自定义属性
        'at-rules', // @ 规则
        { name: 'supports', type: 'at-rule' },
        { name: 'media', type: 'at-rule' },
        { name: 'include', type: 'at-rule' }, // @include mixin
        'declarations', // 属性声明
        'rules', // 嵌套规则
      ],
      { severity: 'error' },
    ],

    // Prettier 格式化规则（Stylelint 闭环管理样式格式化）
    'prettier/prettier': true,

    // 类名选择器：BEM + utility 命名约定
    'selector-class-pattern':
      '^(?:(?:o|c|u|t|s|is|has|_|js|qa)-)?[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*(?:__[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?(?:--[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?(?:[.+])?$',
  },
};
