import antfu from '@antfu/eslint-config';

export default antfu({
  vue: true,
  jsx: true,
  typescript: true,
  stylistic: false,
  formatters: false,
  unocss: true,
  ...rest,
});
