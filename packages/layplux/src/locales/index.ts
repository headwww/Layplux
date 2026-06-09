import type { LaypluxLocale } from '../types/locale';
import { zhCN } from './zh-CN';
import { enUS } from './en-US';

export type { LaypluxLocale } from '../types/locale';

const builtInLocales: Record<string, LaypluxLocale> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export function getBuiltInLocale(name: string): LaypluxLocale {
  const locale = builtInLocales[name];
  if (!locale) {
    console.warn(`[Layplux] Unknown locale "${name}", falling back to zh-CN`);
    return zhCN;
  }
  return locale;
}

export { zhCN, enUS };
