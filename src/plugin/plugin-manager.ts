import { createPluginContext } from './plugin-context';
import { PluginRuntimeImpl } from './plugin-runtime';
import type {
  ContextApiAssembler,
  IPluginManager,
  PluginModel,
  PluginRegisterOptions,
  PluginRuntime,
  PreferenceValueType,
  PluginMeta,
  PreferenceDeclaration,
  PluginContext,
  PluginConfig,
} from './plugin-types';
import { sequencify, SequencifyError } from './sequencify';

export interface PluginManagerOptions<TServices = Record<string, unknown>> {
  /** 业务服务组装器，每个插件获得独立的 context.services */
  assembler: ContextApiAssembler<TServices>;

  /** 当前引擎版本（用于 engineVersion 兼容性检查），不需要版本检查可不传 */
  engineVersion?: string;

  /**
   * 自定义版本兼容性检查函数（替代原版硬依赖 semver 包）
   * 如果不传，则忽略 engineVersion 检查
   */
  versionChecker?: (pluginVersionExp: string, engineVersion: string) => boolean;

  /**
   * 注册前拦截器（对标原版 customPluginTransducer）
   * 可以在插件注册前对 pluginModel 做二次加工
   */
  pluginTransducer?: <T extends PluginModel<TServices>>(
    model: T,
    ctx: PluginRuntime<TServices>['context'] | null,
  ) => T | Promise<T>;

  /**
   * 上下文增强钩子
   */
  enhanceContextHook?: (
    ctx: ReturnType<typeof createPluginContext<TServices>>,
  ) => void;

  /** 初始偏好配置（对标原版 init(pluginPreference) 参数） */
  pluginPreference?: Map<string, Record<string, PreferenceValueType>>;
}

// ── 保留的事件前缀（可由外部扩展，改造点：不再 hardcode 业务前缀）
const DEFAULT_RESERVED_PREFIXES = [
  'plugin',
  'engine',
  'system',
  'core',
  'event',
  'events',
  'log',
  'logger',
];

export class PluginManager<
  TServices = Record<string, unknown>,
> implements IPluginManager<TServices> {
  /** 有序插件列表（保证 init 顺序） */
  private plugins: PluginRuntimeImpl<TServices>[] = [];

  /** 快速查找 Map */
  readonly pluginsMap = new Map<string, PluginRuntimeImpl<TServices>>();

  /** 偏好存储（改造点：构造时注入或之后 setPreference 设置） */
  private pluginPreference: Map<string, Record<string, PreferenceValueType>>;

  /** 保留的事件前缀 */
  private reservedPrefixes: string[];

  constructor(
    private readonly options: PluginManagerOptions<TServices>,
    reservedPrefixes: string[] = DEFAULT_RESERVED_PREFIXES,
  ) {
    this.pluginPreference = options.pluginPreference ?? new Map();
    this.reservedPrefixes = reservedPrefixes;
  }

  setPreference(
    preference: Map<string, Record<string, PreferenceValueType>>,
  ): void {
    this.pluginPreference = preference;
  }

  async register(
    model: PluginModel<TServices>,
    registerOptions: PluginRegisterOptions = {},
  ): Promise<void> {
    const {
      override = false,
      autoInit = false,
      options = {},
    } = registerOptions;

    // 1. 验证 eventPrefix 不使用保留前缀
    const { meta = {} as PluginMeta } = model;
    this.validateEventPrefix(meta);

    // 2. 可选的插件转换器
    const processedModel = this.options.pluginTransducer
      ? await this.options.pluginTransducer(model, null)
      : model;

    // 3. 过滤 options（只保留 preferenceDeclaration 声明的 key）
    const filteredOptions = filterValidOptions(
      options,
      meta.preferenceDeclaration ?? {},
    );

    // 4. 组装 context（改造点：preference 在构造时一次性完整初始化）
    const pluginName = processedModel.pluginName || meta.pluginName;
    if (!pluginName) throw new Error('[PluginManager] pluginName is required');

    const savedPreference = this.pluginPreference.get(pluginName) ?? {};
    const ctx = createPluginContext<TServices>({
      pluginName,
      meta,
      assembler: this.options.assembler,
      savedPreference,
      enhanceHook: this.options.enhanceContextHook,
    });

    // 5. 执行工厂函数得到 config
    const config = processedModel(ctx, filteredOptions);
    const finalName = pluginName || config.name;
    if (!finalName) throw new Error('[PluginManager] Plugin name is required');

    // 6. 处理同名覆盖
    if (this.pluginsMap.has(finalName)) {
      if (!override) {
        throw new Error(
          `[PluginManager] Plugin "${finalName}" already registered. Use override:true to replace.`,
        );
      }
      const old = this.pluginsMap.get(finalName)!;
      await old.destroy();
      this.plugins = this.plugins.filter((p) => p.name !== finalName);
      this.pluginsMap.delete(finalName);
    }

    // 7. 版本兼容性检查（改造点：通过注入的 versionChecker，不硬依赖 semver）
    const engineVersionExp = meta.engineVersion;
    if (
      engineVersionExp &&
      this.options.engineVersion &&
      this.options.versionChecker
    ) {
      const compatible = this.options.versionChecker(
        engineVersionExp,
        this.options.engineVersion,
      );
      if (!compatible) {
        throw new Error(
          `[PluginManager] Plugin "${finalName}" version check failed: ` +
            `requires engine ${engineVersionExp}, current is ${this.options.engineVersion}`,
        );
      }
    }

    // 8. 创建运行时并存入注册表
    const runtime = new PluginRuntimeImpl<TServices>(
      finalName,
      meta,
      config,
      ctx,
    );
    this.plugins.push(runtime);
    this.pluginsMap.set(finalName, runtime);

    // 9. autoInit
    if (autoInit) {
      await runtime.init();
    }
  }

  async init(): Promise<void> {
    // 构建任务 Map（sequencify 需要）
    const tasksMap = new Map(
      this.plugins.map((p) => [
        p.name,
        { name: p.name, dep: p.meta.dependencies ?? [] },
      ]),
    );

    // 拓扑排序（改造点：sequencify 出错会抛 SequencifyError）
    let sequence: string[];
    try {
      const result = sequencify(tasksMap, [...tasksMap.keys()]);
      sequence = result.sequence;
    } catch (err) {
      if (err instanceof SequencifyError) {
        throw new Error(
          `[PluginManager] Cannot init: dependency resolution failed.\n${err.message}`,
        );
      }
      throw err;
    }

    // 串行初始化（保证顺序）
    for (const name of sequence) {
      try {
        await this.pluginsMap.get(name)!.init();
      } catch (err) {
        // 单个插件失败不阻断，但记录日志
        console.error(
          `[PluginManager] Plugin "${name}" failed to init, ` +
            `plugins depending on it may not work correctly.`,
        );
      }
    }
  }

  get(name: string): PluginRuntimeImpl<TServices> | undefined {
    return this.pluginsMap.get(name);
  }

  getAll(): PluginRuntimeImpl<TServices>[] {
    return [...this.plugins];
  }

  has(name: string): boolean {
    return this.pluginsMap.has(name);
  }

  async delete(name: string): Promise<boolean> {
    const runtime = this.pluginsMap.get(name);
    if (!runtime) return false;
    await runtime.destroy();
    this.plugins = this.plugins.filter((p) => p.name !== name);
    return this.pluginsMap.delete(name);
  }

  setDisabled(name: string, flag = true): void {
    this.pluginsMap.get(name)?.setDisabled(flag);
  }

  getPluginPreference(
    name: string,
  ): Record<string, PreferenceValueType> | undefined {
    return this.pluginPreference.get(name);
  }

  async destroy(): Promise<void> {
    // 逆序销毁（与初始化顺序相反）
    const reversed = [...this.plugins].reverse();
    for (const plugin of reversed) {
      await plugin.destroy();
    }
  }

  async dispose(): Promise<void> {
    await this.destroy();
    this.plugins = [];
    this.pluginsMap.clear();
  }

  toProxy(): Record<string, unknown> {
    return new Proxy(this as unknown as Record<string, unknown>, {
      get: (target, prop, receiver) => {
        const name = prop as string;
        if (this.pluginsMap.has(name)) {
          const runtime = this.pluginsMap.get(name)!;
          // 禁用态直接返回 undefined
          if (runtime.disabled) return undefined;
          // 未初始化：返回明确提示而非 invariant 抛错
          if (!runtime.isInited()) {
            console.warn(
              `[PluginManager] Plugin "${name}" not initialized yet`,
            );
            return undefined;
          }
          return runtime.toProxy();
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  private validateEventPrefix(meta: PluginMeta): void {
    if (!meta.eventPrefix) return;
    const isReserved = this.reservedPrefixes.some(
      (r) => meta.eventPrefix === r || meta.eventPrefix!.startsWith(`${r}:`),
    );
    if (isReserved) {
      console.warn(
        `[PluginManager] Plugin "${meta.pluginName}" uses reserved eventPrefix ` +
          `"${meta.eventPrefix}", it will be reset to plugin name.`,
      );
      meta.eventPrefix = undefined;
    }
  }
}

/**
 * 验证 preference key 是否在 declaration 中声明
 *
 * 改造点：原版遍历 properties 数组（O(n)），改为 Record 直接查找（O(1)）
 */
export function isValidPreferenceKey(
  key: string,
  decl: PreferenceDeclaration,
): boolean {
  return Object.prototype.hasOwnProperty.call(decl, key);
}

/**
 * 过滤 options，只保留 preferenceDeclaration 中声明的 key
 * 防止注入未声明的配置项
 */
export function filterValidOptions(
  opts: Record<string, unknown> | undefined | null,
  decl: PreferenceDeclaration,
): Record<string, unknown> {
  if (!opts || typeof opts !== 'object') return {};
  if (Object.keys(decl).length === 0) return {};

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(opts)) {
    if (isValidPreferenceKey(key, decl) && opts[key] != null) {
      result[key] = opts[key];
    }
  }
  return result;
}

/**
 * 判断是否是 PluginRegisterOptions（而不是普通 options）
 * 原版用于 register(model, options, registerOptions) 的重载判断
 */
export function isPluginRegisterOptions(
  opts: unknown,
): opts is { override?: boolean; autoInit?: boolean } {
  return (
    typeof opts === 'object' &&
    opts !== null &&
    ('override' in opts || 'autoInit' in opts)
  );
}

/**
 * 在你的项目里定义一次即可
 * @param meta
 * @param factory
 * @returns
 */
export function definePlugin<TServices = Record<string, unknown>>(
  meta: PluginMeta,
  factory: (
    ctx: PluginContext<TServices>,
    options?: Record<string, unknown>,
  ) => PluginConfig<TServices>,
): PluginModel<TServices> {
  return Object.assign(factory, {
    pluginName: meta.pluginName,
    meta,
  });
}
