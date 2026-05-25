import type {
  PluginRuntime,
  PluginMeta,
  PluginConfig,
  PluginContext,
  PluginLifecycleState,
} from './plugin-types';

export class PluginRuntimeImpl<
  TServices = Record<string, unknown>,
> implements PluginRuntime<TServices> {
  readonly name: string;
  readonly meta: PluginMeta;
  readonly config: PluginConfig<TServices>;
  readonly context: PluginContext<TServices>;

  private _state: PluginLifecycleState = 'registered';
  private _disabled = false;
  private _teardown: (() => void | Promise<void>) | null = null;
  private _initTime?: number;
  private _error?: Error;

  private _initPromise: Promise<void> | null = null;

  constructor(
    name: string,
    meta: PluginMeta,
    config: PluginConfig<TServices>,
    context: PluginContext<TServices>,
  ) {
    this.name = name;
    this.meta = meta;
    this.config = config;
    this.context = context;
  }

  get state(): PluginLifecycleState {
    return this._state;
  }
  get disabled(): boolean {
    return this._disabled;
  }
  get initTime(): number | undefined {
    return this._initTime;
  }
  get error(): Error | undefined {
    return this._error;
  }

  async init(forceInit = false): Promise<void> {
    // 已初始化且不强制
    if (this._state === 'initialized' && !forceInit) return;

    if (this._initPromise) {
      return this._initPromise;
    }

    // 强制重新 init：先执行 teardown
    if (forceInit && this._state === 'initialized') {
      await this.runTeardown();
      this._state = 'registered';
    }

    if (this._state === 'error' && !forceInit) {
      console.warn(`Plugin is in error state, use forceInit=true to retry.`);
      return;
    }

    this._initPromise = this._doInit();
    try {
      await this._initPromise;
    } finally {
      this._initPromise = null;
    }
  }

  private async _doInit(): Promise<void> {
    this._state = 'initializing';
    const start = performance.now();
    try {
      const teardown = await this.config.setup(this.context);
      this._teardown = teardown ?? null;
      this._initTime = performance.now() - start;
      this._state = 'initialized';
    } catch (err) {
      this._error = err instanceof Error ? err : new Error(String(err));
      this._state = 'error';
      console.error('init() failed:', this._error);
      throw this._error;
    }
  }

  async destroy(): Promise<void> {
    if (this._state === 'registered' || this._state === 'destroyed') return;
    await this.runTeardown();
    this._state = 'destroyed';
  }

  private async runTeardown(): Promise<void> {
    if (!this._teardown) return;
    try {
      await this._teardown();
    } catch (err) {
      console.error('teardown() failed:', err);
    } finally {
      this._teardown = null;
    }
  }

  setDisabled(flag: boolean): void {
    this._disabled = flag;
    console.warn(`setDisabled(${flag})`);
  }

  /**
   * 改造点：
   * - 原版 toProxy 每次调用 config.exports()（函数），重复创建
   * - 改为直接访问 config.exports 对象
   * - 未初始化时返回空代理而非抛错，调用方通过 state 判断
   */
  toProxy(): Record<string, unknown> {
    if (this._state !== 'initialized') {
      console.warn(`toProxy() called before init (state: ${this._state}), returning empty proxy`);
      return new Proxy(
        {},
        {
          get(_, prop) {
            console.warn(`[PluginProxy] Plugin not initialized, cannot access "${String(prop)}"`);
            return undefined;
          },
        },
      );
    }

    const exports = this.config.exports ?? {};
    return new Proxy(this as unknown as Record<string, unknown>, {
      get(target, prop, receiver) {
        if (Object.prototype.hasOwnProperty.call(exports, prop)) {
          return exports[prop as string];
        }
        return Reflect.get(target, prop, receiver) as unknown;
      },
    });
  }

  isInited(): boolean {
    return this._state === 'initialized';
  }
}
