/** 为指定 theme 注入 CSS 变量样式，重复注册会替换 */
export function injectThemeCSS(name: string, vars: Record<string, string>): void {
  const styleId = `layplux-theme-${name}`;
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  const varLines = Object.entries(vars)
    .map(([key, value]) => `    ${key}: ${value};`)
    .join('\n');

  styleEl.textContent = `.layplux-root[data-theme='${name}'] {\n${varLines}\n}\n`;
}
