// =================================================================
// plugin-context.ts — 通用插件上下文（改造核心）
// 改造：
//   - TServices 泛型注入业务服务，框架对业务零感知
//   - preference 在构造时就完整初始化，不需要 setPreference
//   - 无任何外部框架依赖
// =================================================================

import type {
  PluginContext,
  PluginMeta,
  PluginPreferenceManager,
  PluginEventBus,
  PreferenceDeclaration,
  PreferenceValueType,
  ContextApiAssembler,
} from './plugin-types';
import { createPluginEventBus } from './event-bus';

export interface PluginContextOptions<TServices = Record<string, unknown>> {
  pluginName: string;
  meta: PluginMeta;
  assembler: ContextApiAssembler<TServices>;
  /**
   * 当前已存储的偏好值（由 PluginManager 在注册时传入）
   * 改造点：原版是 manager.getPluginPreference() 在 setPreference 里懒读取
   * 改为构造时直接传入，context 构造后即可用，无竞态
   */
  savedPreference?: Record<string, PreferenceValueType>;
  /**
   * 可选的上下文增强钩子（对标原版 enhancePluginContextHook）
   * 改造点：通过参数传入而非 engineConfig.get()，去掉对全局单例的依赖
   */
  enhanceHook?: (ctx: PluginContext<TServices>) => void;
}

export function createPluginContext<TServices = Record<string, unknown>>(
  options: PluginContextOptions<TServices>,
): PluginContext<TServices> {
  const { pluginName, meta, assembler, savedPreference = {}, enhanceHook } = options;

  // ── 1. 组装业务服务（assembler 决定注入什么）──────────────────
  const services = assembler.assembleServices(pluginName, meta);

  // ── 2. 创建插件私有事件总线 ─────────────────────────────────
  const eventPrefix = meta.eventPrefix || pluginName;
  const event: PluginEventBus = createPluginEventBus(eventPrefix);

  // ── 3. 创建偏好管理器（构造时完整初始化，无后置 setPreference）
  const prefs: PluginPreferenceManager = createPreferenceManager(
    pluginName,
    meta.preferenceDeclaration ?? {},
    savedPreference,
  );

  const ctx = {
    pluginName,
    event,
    prefs,
    ...services,
  } as PluginContext<TServices>;

  // ── 5. 可选的上下文增强（对标 enhancePluginContextHook）──────
  if (enhanceHook) {
    enhanceHook(ctx);
  }

  return ctx;
}

// ── 内部工厂函数 ────────────────────────────────────────────────

function createPreferenceManager(
  pluginName: string,
  decl: PreferenceDeclaration,
  saved: Record<string, PreferenceValueType>,
): PluginPreferenceManager {
  // 构造时合并已保存的值和声明的默认值
  // 只保留 declaration 里声明的 key（原版 filterValidOptions 的精神）
  const store: Record<string, PreferenceValueType | undefined> = {};
  for (const key of Object.keys(decl)) {
    if (key) {
      store[key] = key in saved ? saved[key] : decl[key]?.default;
    }
  }

  function validateKey(key: string): void {
    if (!(key in decl)) {
      throw new Error(
        `[Plugin:${pluginName}] Preference key "${key}" is not declared. ` +
          `Declared keys: ${Object.keys(decl).join(', ') || '(none)'}`,
      );
    }
  }

  function validateValue(key: string, value: PreferenceValueType): void {
    const prop = decl[key];
    // 枚举约束
    if (prop?.enum && !prop.enum.includes(value)) {
      throw new Error(
        `[Plugin:${pluginName}] Preference "${key}" must be one of: ` +
          `${prop.enum.map((v) => JSON.stringify(v)).join(', ')}, got: ${JSON.stringify(value)}`,
      );
    }
    // 类型约束
    const actualType = value === null ? 'object' : typeof value;
    const expectedType = prop?.type === 'object' ? 'object' : prop?.type;
    if (actualType !== expectedType) {
      throw new Error(
        `[Plugin:${pluginName}] Preference "${key}" type mismatch: ` +
          `expected ${prop?.type}, got ${actualType}`,
      );
    }
  }

  return {
    get<T extends PreferenceValueType>(key: string, defaultValue?: T): T | undefined {
      validateKey(key);
      const val = store[key];
      if (val === undefined || val === null) return defaultValue;
      return val as T;
    },
    set(key: string, value: PreferenceValueType) {
      validateKey(key);
      validateValue(key, value);
      store[key] = value;
    },
    reset(key?: string) {
      if (key) {
        validateKey(key);
        store[key] = decl[key]?.default;
      } else {
        // 全部重置为默认值
        for (const k of Object.keys(decl)) {
          store[k] = decl[k]?.default;
        }
      }
    },
  };
}
