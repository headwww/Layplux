import type { ThemeVars } from '../types/theme';

function varsToCSS(vars: Partial<ThemeVars>): string {
  const map: Record<keyof ThemeVars, string> = {
    background: '--layplux-background',
    foreground: '--layplux-foreground',
    primary: '--layplux-primary',
    primaryForeground: '--layplux-primary-foreground',
    secondary: '--layplux-secondary',
    secondaryForeground: '--layplux-secondary-foreground',
    muted: '--layplux-muted',
    mutedForeground: '--layplux-muted-foreground',
    accent: '--layplux-accent',
    accentForeground: '--layplux-accent-foreground',
    border: '--layplux-border',
    input: '--layplux-input',
    card: '--layplux-card',
    cardForeground: '--layplux-card-foreground',
    destructive: '--layplux-destructive',
  };

  const lines: string[] = [];
  for (const [key, varName] of Object.entries(map) as Array<[keyof ThemeVars, string]>) {
    const value = vars[key];
    if (value !== undefined) {
      lines.push(`    ${varName}: ${value};`);
    }
  }
  return lines.join('\n');
}

function buildThemeCSS(name: string, vars: Partial<ThemeVars>): string {
  const varsBlock = varsToCSS(vars);
  return `.layplux-root[data-theme='${name}'] {\n${varsBlock}\n}\n`;
}

export function injectThemeCSS(name: string, vars: Partial<ThemeVars>): void {
  const styleId = `layplux-theme-${name}`;
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = buildThemeCSS(name, vars);
}

export function applyThemeName(element: HTMLElement, name: string): void {
  element.setAttribute('data-theme', name);
}

export function removeThemeCSS(name: string): void {
  const styleEl = document.getElementById(`layplux-theme-${name}`);
  if (styleEl) {
    styleEl.remove();
  }
}
