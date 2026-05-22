export type PreferenceValueType = string | number | boolean | object | null;

export interface PreferencePropertyDeclaration {
  /** 值类型约束 */
  type: 'string' | 'number' | 'boolean' | 'object';
  /** 未设置时的默认值 */
  default: PreferenceValueType;
  /** 可选枚举约束 */
  enum?: PreferenceValueType[];
  description?: string;
}

/**
 * Record 格式，O(1) 查找，比原版 Array<{key}> 更直观
 * { fontSize: { type: 'number', default: 13 } }
 */
export type PreferenceDeclaration = Record<
  string,
  PreferencePropertyDeclaration
>;

/**
 * 插件元数据
 */
export interface PluginMeta {
  /** 全局唯一插件名，建议反向域名格式 */
  pluginName: string;
  /** 依赖的其他插件名（DAG 排序依据） */
  dependencies?: string[];
  /** 事件前缀，用于命名空间隔离 */
  eventPrefix?: string;
  /** 偏好声明 */
  preferenceDeclaration?: PreferenceDeclaration;
  /** 版本兼容性声明（semver 表达式，如 ">=1.0.0"） */
  engineVersion?: string;
  /** 附加的任意元数据，由具体系统自己扩展 */
  [key: string]: unknown;
}

export interface PluginPreferenceManager {
  get<T extends PreferenceValueType = PreferenceValueType>(
    key: string,
    defaultValue?: T,
  ): T | undefined;
  set(key: string, value: PreferenceValueType): void;
  reset(key?: string): void;
}

export interface PluginEventBus {
  // ── 私有事件（自动加 namespace: 前缀）─────────────────────────

  /** 发布私有事件，自动加 namespace 前缀 */
  emit<T = unknown>(event: string, payload?: T): void;
  /** 订阅私有事件，返回 unsubscribe 函数 */
  on<T = unknown>(event: string, handler: (payload: T) => void): () => void;
  /** 取消订阅私有事件 */
  off<T = unknown>(event: string, handler: (payload: T) => void): void;
  /** 订阅私有事件一次，触发后自动取消 */
  once<T = unknown>(event: string, handler: (payload: T) => void): () => void;

  // ── 全局事件（跨插件通信，走全局 emitter）─────────────────────

  /** 向全局总线发布事件 */
  emitGlobal<T = unknown>(event: string, payload?: T): void;
  /**
   * 订阅全局事件，支持 EventEmitter2 通配符：
   *   'layout:*'     → 所有 layout 命名空间事件
   *   'layout:**'    → layout 下所有层级事件
   *   '**'           → 全部事件（调试用）
   */
  onGlobal<T = unknown>(
    event: string,
    handler: (payload: T) => void,
  ): () => void;
  /** 取消订阅全局事件 */
  offGlobal<T = unknown>(event: string, handler: (payload: T) => void): void;
  /** 订阅全局事件一次 */
  onGlobalOnce<T = unknown>(
    event: string,
    handler: (payload: T) => void,
  ): () => void;
  /**
   * 等待某个全局事件，返回 Promise（EventEmitter2 原生特性）
   * 适合 setup 中等待其他插件初始化完成：
   *   await ctx.event.waitForGlobal('explorer:ready', 5000)
   */
  waitForGlobal<T = unknown>(event: string, timeoutMs?: number): Promise<T>;

  // ── 清理 ────────────────────────────────────────────────────

  /** 移除该插件私有 emitter 上的所有监听器（teardown 时调用） */
  removeAllListeners(): void;
}

/**
 * 通用插件上下文
 *
 * TServices 是业务系统注入的服务集合，框架不感知其具体结构。
 * 例如窗口系统注入：{ layout: LayoutApi }
 * 低代码平台注入：{ skeleton: SkeletonApi, canvas: CanvasApi }
 */
export interface PluginContext<
  TServices = Record<string, unknown>,
> {
  /** 当前插件名 */
  readonly pluginName: string;
  /** 插件私有事件总线（自动加命名空间） */
  readonly event: PluginEventBus;
  /** 偏好配置（只能读写 preferenceDeclaration 声明的 key） */
  readonly prefs: PluginPreferenceManager;
  /** 日志（自动带 [pluginName] 前缀） */
  // readonly logger: PluginLogger
  /** 业务集合，类型由系统决定 */
  readonly services: TServices;
}

/**
 * 插件定义 改造：setup 返回 teardown，强制配对。
 * exports 改为静态对象，避免每次调用都重新生成。
 */
export interface PluginConfig<
  TServices = Record<string, unknown>,
> {
  /** 插件名（与 meta.pluginName 一致，二次确认） */
  name: string;
  /**
   * 插件初始化入口。
   * 返回 teardown 函数（可选），destroy 时自动调用。
   * 支持异步。
   */
  setup(
    ctx: PluginContext<TServices>,
  ): void | (() => void) | Promise<void | (() => void)>;
  /**
   * 插件对外暴露的 API（可通过 manager.get(name).toProxy() 访问）
   * 原版用 exports() 函数，改为对象，避免每次调用都重新生成
   */
  exports?: Record<string, unknown>;
}

/**
 * 插件模型：元数据 + 配置工厂函数
 */
export type PluginModel<
  TServices = Record<string, unknown>,
> = {
  /** 插件名（可在工厂函数返回值中覆盖） */
  pluginName?: string;
  meta: PluginMeta;
  /** 工厂函数，接收 context 返回 config */
  (
    ctx: PluginContext<TServices>,
    options?: Record<string, unknown>,
  ): PluginConfig<TServices>;
};

/**
 * 注册选项
 */
export interface PluginRegisterOptions {
  /** 是否允许覆盖同名插件（默认 false） */
  override?: boolean;
  /** 注册后立即 init（默认 false，等 manager.init() 批量执行） */
  autoInit?: boolean;
  /** 传给插件工厂函数的初始选项（会经过 preferenceDeclaration 过滤） */
  options?: Record<string, unknown>;
}

/**
 * 管理器接口
 */
export interface IPluginManager<
  TServices = Record<string, unknown>,
> {
  register(
    model: PluginModel<TServices>,
    registerOptions?: PluginRegisterOptions,
  ): Promise<void>;

  init(): Promise<void>;

  get(name: string): PluginRuntime<TServices> | undefined;

  getAll(): PluginRuntime<TServices>[];

  has(name: string): boolean;

  delete(name: string): Promise<boolean>;

  setDisabled(name: string, flag: boolean): void;

  getPluginPreference(
    name: string,
  ): Record<string, PreferenceValueType> | undefined;

  destroy(): Promise<void>;
  dispose(): Promise<void>;
}

/**
 * 插件运行时状态机
 */
export type PluginLifecycleState =
  | 'registered' // 已注册，未 init
  | 'initializing' // init 进行中（防并发）
  | 'initialized' // init 完成
  | 'destroyed' // teardown 已执行
  | 'error'; // init/teardown 出错

/**
 * 插件运行时状态机
 */
export interface PluginRuntime<
  TServices = Record<string, unknown>,
> {
  readonly name: string;
  readonly meta: PluginMeta;
  readonly state: PluginLifecycleState;
  readonly disabled: boolean;
  readonly config: PluginConfig<TServices>;
  readonly context: PluginContext<TServices>;
  /** 初始化耗时（ms） */
  readonly initTime?: number;
  /** 错误信息 */
  readonly error?: Error;
  init(forceInit?: boolean): Promise<void>;
  destroy(): Promise<void>;
  setDisabled(flag: boolean): void;
  /** 获取插件暴露的 API 代理 */
  toProxy(): Record<string, unknown>;
}

/**
 * 上下文组装器接口
 */
export interface ContextApiAssembler<
  TServices = Record<string, unknown>,
> {
  /**
   * 组装业务服务，注入到 context.services
   * 每个插件调用一次，可根据 pluginName/meta 做差异化注入
   */
  assembleServices(pluginName: string, meta: PluginMeta): TServices;
}
