/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-recess-order'],
  plugins: ['stylelint-scss'],
  rules: {
    'scss/at-rule-no-unknown': true,
    'scss/dollar-variable-pattern': '^[a-z][a-z0-9-]*$',
    'scss/selector-no-redundant-nesting-selector': true,
    'scss/no-duplicate-mixins': true,

    'selector-class-pattern': [
      '^([a-z][a-z0-9]*)(-[a-z0-9]+)*((__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?)?$',
      { message: '请使用 BEM 命名规范（kebab-case）' },
    ],

    'color-hex-length': 'short',
    'color-named': 'never',
    'number-max-precision': 4,
    'string-quotes': 'single',
    'max-nesting-depth': [3, { ignore: ['blockless-at-rules', 'pseudo-classes'] }],
    'property-no-vendor-prefix': true,
    'value-no-vendor-prefix': true,

    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['deep', 'slotted', 'global', 'local'],
      },
    ],
    'selector-pseudo-element-no-unknown': [
      true,
      {
        ignorePseudoElements: ['v-deep', 'v-slotted', 'v-global'],
      },
    ],
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'use',
          'forward',
          'mixin',
          'include',
          'function',
          'return',
          'each',
          'for',
          'while',
          'if',
          'else',
          'extend',
        ],
      },
    ],
  },
  ignoreFiles: ['dist/**', 'node_modules/**', '**/*.js', '**/*.ts'],
};
