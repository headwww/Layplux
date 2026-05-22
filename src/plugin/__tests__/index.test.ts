import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter2 } from 'eventemitter2';
import { sequencify, SequencifyError } from '../sequencify';
import { createPluginEventBus, getGlobalEmitter } from '../event-bus';
import { createPluginContext } from '../plugin-context';
import { PluginRuntimeImpl } from '../plugin-runtime';
import {
  PluginManager,
  filterValidOptions,
  definePlugin,
} from '../plugin-manager';
import type {
  PluginEventBus,
  PluginMeta,
  PluginContext,
  PluginConfig,
  PluginModel,
  ContextApiAssembler,
  PluginRuntime,
} from '../plugin-types';

// =========================================================================
// Test helpers
// =========================================================================

function createTestMeta(overrides?: Partial<PluginMeta>): PluginMeta {
  return {
    pluginName: 'test-plugin',
    ...overrides,
  };
}

interface TestServices {
  log: (msg: string) => void;
}

function createTestAssembler(): ContextApiAssembler<TestServices> {
  return {
    assembleServices(pluginName: string, _meta: PluginMeta) {
      return {
        log: (msg: string) => {
          // noop in tests
        },
      };
    },
  };
}

function createTestManager() {
  return new PluginManager<TestServices>({
    assembler: createTestAssembler(),
  });
}

function createTestModel(
  meta?: Partial<PluginMeta>,
  setupFn?: (ctx: PluginContext<TestServices>) => void | (() => void),
  exports?: Record<string, unknown>,
): PluginModel<TestServices> {
  const fullMeta = createTestMeta(meta);
  return Object.assign(
    (_ctx: PluginContext<TestServices>, _options?: Record<string, unknown>) =>
      ({
        setup: setupFn ?? (() => {}),
        exports,
      }) as PluginConfig<TestServices>,
    { meta: fullMeta },
  );
}

// =========================================================================
// 1. sequencify
// =========================================================================

describe('sequencify', () => {
  it('sorts linear dependency chain', () => {
    const tasks = new Map([
      ['a', { name: 'a', dep: [] }],
      ['b', { name: 'b', dep: ['a'] }],
      ['c', { name: 'c', dep: ['b'] }],
    ]);
    const { sequence } = sequencify(tasks, ['c', 'b', 'a']);
    // a before b before c
    const idxA = sequence.indexOf('a');
    const idxB = sequence.indexOf('b');
    const idxC = sequence.indexOf('c');
    expect(idxA).toBeLessThan(idxB);
    expect(idxB).toBeLessThan(idxC);
  });

  it('sorts diamond dependency', () => {
    const tasks = new Map([
      ['d', { name: 'd', dep: [] }],
      ['b', { name: 'b', dep: ['d'] }],
      ['c', { name: 'c', dep: ['d'] }],
      ['a', { name: 'a', dep: ['b', 'c'] }],
    ]);
    const { sequence } = sequencify(tasks, ['a', 'b', 'c', 'd']);
    const idxD = sequence.indexOf('d');
    const idxB = sequence.indexOf('b');
    const idxC = sequence.indexOf('c');
    const idxA = sequence.indexOf('a');
    expect(idxD).toBeLessThan(idxB);
    expect(idxD).toBeLessThan(idxC);
    expect(idxB).toBeLessThan(idxA);
    expect(idxC).toBeLessThan(idxA);
  });

  it('handles independent tasks', () => {
    const tasks = new Map([
      ['x', { name: 'x', dep: [] }],
      ['y', { name: 'y', dep: [] }],
      ['z', { name: 'z', dep: [] }],
    ]);
    const { sequence } = sequencify(tasks, ['x', 'y', 'z']);
    expect(sequence).toHaveLength(3);
    expect(sequence).toContain('x');
    expect(sequence).toContain('y');
    expect(sequence).toContain('z');
  });

  it('throws SequencifyError on missing dependency', () => {
    const tasks = new Map([
      ['a', { name: 'a', dep: ['no-exist'] }],
    ]);
    expect(() => sequencify(tasks, ['a'])).toThrow(SequencifyError);
  });

  it('throws SequencifyError on circular dependency', () => {
    const tasks = new Map([
      ['a', { name: 'a', dep: ['b'] }],
      ['b', { name: 'b', dep: ['a'] }],
    ]);
    expect(() => sequencify(tasks, ['a', 'b'])).toThrow(SequencifyError);
  });

  it('throwOnError=false returns missingTasks without throwing', () => {
    const tasks = new Map([
      ['a', { name: 'a', dep: ['no-exist'] }],
    ]);
    const result = sequencify(tasks, ['a'], false);
    expect(result.missingTasks).toHaveLength(1);
    expect(result.sequence).toEqual([]);
  });

  it('throwOnError=false returns recursiveDependencies without throwing', () => {
    const tasks = new Map([
      ['a', { name: 'a', dep: ['b'] }],
      ['b', { name: 'b', dep: ['a'] }],
    ]);
    const result = sequencify(tasks, ['a', 'b'], false);
    expect(result.recursiveDependencies.length).toBeGreaterThan(0);
    expect(result.sequence).toEqual([]);
  });

  it('handles single task with no deps', () => {
    const tasks = new Map([['only', { name: 'only', dep: [] }]]);
    const { sequence } = sequencify(tasks, ['only']);
    expect(sequence).toEqual(['only']);
  });

  it('deduplicates tasks already in results', () => {
    const tasks = new Map([
      ['shared', { name: 'shared', dep: [] }],
      ['a', { name: 'a', dep: ['shared'] }],
      ['b', { name: 'b', dep: ['shared'] }],
    ]);
    const { sequence } = sequencify(tasks, ['a', 'b']);
    // 'shared' should appear only once
    const occurrences = sequence.filter((s) => s === 'shared');
    expect(occurrences).toHaveLength(1);
  });
});

// =========================================================================
// 2. EventBus
// =========================================================================

describe('PluginEventBus', () => {
  let bus: PluginEventBus;

  beforeEach(() => {
    bus = createPluginEventBus('test-ns');
  });

  afterEach(() => {
    bus.removeAllListeners();
  });

  describe('private events (namespaced)', () => {
    it('prefixes events with namespace on emit', () => {
      const handler = vi.fn();
      // Subscribe to the actual namespaced event through the bus
      bus.on('my-event', handler);
      bus.emit('my-event', { data: 1 });
      expect(handler).toHaveBeenCalledWith({ data: 1 });
    });

    it('different namespaces do not leak', () => {
      const busB = createPluginEventBus('other-ns');
      const handlerA = vi.fn();
      const handlerB = vi.fn();

      bus.on('event', handlerA);
      busB.on('event', handlerB);

      bus.emit('event', 'from-a');
      expect(handlerA).toHaveBeenCalledWith('from-a');
      expect(handlerB).not.toHaveBeenCalled();

      busB.removeAllListeners();
    });

    it('once() fires only once', () => {
      const handler = vi.fn();
      bus.once('once-event', handler);
      bus.emit('once-event');
      bus.emit('once-event');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('off() unsubscribes handler', () => {
      const handler = vi.fn();
      bus.on('event', handler);
      bus.off('event', handler);
      bus.emit('event');
      expect(handler).not.toHaveBeenCalled();
    });

    it('on() returns unsubscribe function', () => {
      const handler = vi.fn();
      const unsub = bus.on('event', handler);
      unsub();
      bus.emit('event');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('global events (cross-plugin)', () => {
    it('emitGlobal sends to global bus', () => {
      const handler = vi.fn();
      bus.onGlobal('global-event', handler);
      bus.emitGlobal('global-event', 42);
      expect(handler).toHaveBeenCalledWith(42);
    });

    it('different plugin buses share global emitter', () => {
      const busB = createPluginEventBus('other-ns');
      const handler = vi.fn();
      bus.onGlobal('shared', handler);
      busB.emitGlobal('shared', 'hello');
      expect(handler).toHaveBeenCalledWith('hello');
      busB.removeAllListeners();
    });

    it('onGlobal supports wildcards', () => {
      const handler = vi.fn();
      bus.onGlobal('layout:*', handler);
      bus.emitGlobal('layout:resize', { w: 100 });
      bus.emitGlobal('layout:ready', true);
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith({ w: 100 });
      expect(handler).toHaveBeenCalledWith(true);
    });

    it('onGlobalOnce fires only once', () => {
      const handler = vi.fn();
      bus.onGlobalOnce('once-global', handler);
      bus.emitGlobal('once-global');
      bus.emitGlobal('once-global');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('offGlobal unsubscribes handler', () => {
      const handler = vi.fn();
      bus.onGlobal('event', handler);
      bus.offGlobal('event', handler);
      bus.emitGlobal('event');
      expect(handler).not.toHaveBeenCalled();
    });

    it('onGlobal returns unsubscribe function', () => {
      const handler = vi.fn();
      const unsub = bus.onGlobal('event', handler);
      unsub();
      bus.emitGlobal('event');
      expect(handler).not.toHaveBeenCalled();
    });

    it('private events do not leak to global', () => {
      const globalHandler = vi.fn();
      bus.onGlobal('**', globalHandler);
      bus.emit('private-event', 'secret');
      expect(globalHandler).not.toHaveBeenCalled();
    });
  });

  describe('waitForGlobal', () => {
    it('resolves when event fires', async () => {
      const promise = bus.waitForGlobal<{ ready: boolean }>('service:ready');
      setTimeout(() => bus.emitGlobal('service:ready', { ready: true }), 10);
      const result = await promise;
      expect(result).toEqual({ ready: true });
    });

    it('rejects on timeout', async () => {
      const promise = bus.waitForGlobal('never:happens', 50);
      await expect(promise).rejects.toThrow('Timeout');
    });
  });

  describe('removeAllListeners', () => {
    it('removes all private listeners', () => {
      const handler = vi.fn();
      bus.on('event-a', handler);
      bus.on('event-b', handler);
      bus.removeAllListeners();
      bus.emit('event-a');
      bus.emit('event-b');
      expect(handler).not.toHaveBeenCalled();
    });

    it('does not affect global listeners', () => {
      const handler = vi.fn();
      bus.onGlobal('global-event', handler);
      bus.removeAllListeners();
      bus.emitGlobal('global-event');
      expect(handler).toHaveBeenCalled();
    });
  });
});

// =========================================================================
// 3. PluginContext
// =========================================================================

describe('createPluginContext', () => {
  it('injects services from assembler', () => {
    const assembler: ContextApiAssembler<TestServices> = {
      assembleServices(_name, _meta) {
        return { log: vi.fn() };
      },
    };
    const ctx = createPluginContext<TestServices>({
      pluginName: 'test',
      meta: createTestMeta(),
      assembler,
    });
    expect(ctx.services.log).toBeDefined();
    expect(typeof ctx.services.log).toBe('function');
  });

  it('receives pluginName and meta in assembler', () => {
    const assembleSpy = vi.fn().mockReturnValue({ log: vi.fn() });
    const assembler: ContextApiAssembler<TestServices> = {
      assembleServices: assembleSpy,
    };
    const meta = createTestMeta({ pluginName: 'my-plugin' });
    createPluginContext<TestServices>({
      pluginName: 'my-plugin',
      meta,
      assembler,
    });
    expect(assembleSpy).toHaveBeenCalledWith('my-plugin', meta);
  });

  it('pluginName is available on context', () => {
    const ctx = createPluginContext<TestServices>({
      pluginName: 'hello-plugin',
      meta: createTestMeta({ pluginName: 'hello-plugin' }),
      assembler: createTestAssembler(),
    });
    expect(ctx.pluginName).toBe('hello-plugin');
  });

  describe('preferences', () => {
    it('returns default value from declaration', () => {
      const ctx = createPluginContext<TestServices>({
        pluginName: 'test',
        meta: createTestMeta({
          pluginName: 'test',
          preferenceDeclaration: {
            fontSize: { type: 'number', default: 14 },
          },
        }),
        assembler: createTestAssembler(),
      });
      expect(ctx.prefs.get('fontSize')).toBe(14);
    });

    it('uses saved preference over default', () => {
      const ctx = createPluginContext<TestServices>({
        pluginName: 'test',
        meta: createTestMeta({
          pluginName: 'test',
          preferenceDeclaration: {
            fontSize: { type: 'number', default: 14 },
          },
        }),
        assembler: createTestAssembler(),
        savedPreference: { fontSize: 16 },
      });
      expect(ctx.prefs.get('fontSize')).toBe(16);
    });

    it('set() updates value', () => {
      const ctx = createPluginContext<TestServices>({
        pluginName: 'test',
        meta: createTestMeta({
          pluginName: 'test',
          preferenceDeclaration: { fontSize: { type: 'number', default: 14 } },
        }),
        assembler: createTestAssembler(),
      });
      ctx.prefs.set('fontSize', 20);
      expect(ctx.prefs.get('fontSize')).toBe(20);
    });

    it('set() throws on undeclared key', () => {
      const ctx = createPluginContext<TestServices>({
        pluginName: 'test',
        meta: createTestMeta({ pluginName: 'test' }),
        assembler: createTestAssembler(),
      });
      expect(() => ctx.prefs.set('unknown', 'value')).toThrow(
        'not declared',
      );
    });

    it('set() throws on wrong type', () => {
      const ctx = createPluginContext<TestServices>({
        pluginName: 'test',
        meta: createTestMeta({
          pluginName: 'test',
          preferenceDeclaration: {
            count: { type: 'number', default: 0 },
          },
        }),
        assembler: createTestAssembler(),
      });
      expect(() => ctx.prefs.set('count', 'not-a-number')).toThrow(
        'type mismatch',
      );
    });

    it('set() throws on invalid enum value', () => {
      const ctx = createPluginContext<TestServices>({
        pluginName: 'test',
        meta: createTestMeta({
          pluginName: 'test',
          preferenceDeclaration: {
            theme: {
              type: 'string',
              default: 'dark',
              enum: ['dark', 'light'],
            },
          },
        }),
        assembler: createTestAssembler(),
      });
      expect(() => ctx.prefs.set('theme', 'blue')).toThrow('must be one of');
    });

    it('get() returns defaultValue when stored value is undefined', () => {
      const ctx = createPluginContext<TestServices>({
        pluginName: 'test',
        meta: createTestMeta({
          pluginName: 'test',
          preferenceDeclaration: {
            optional: { type: 'string', default: '' },
          },
        }),
        assembler: createTestAssembler(),
        savedPreference: { optional: undefined },
      });
      expect(ctx.prefs.get('optional', 'fallback')).toBe('fallback');
    });

    it('reset(key) restores default', () => {
      const ctx = createPluginContext<TestServices>({
        pluginName: 'test',
        meta: createTestMeta({
          pluginName: 'test',
          preferenceDeclaration: { fontSize: { type: 'number', default: 14 } },
        }),
        assembler: createTestAssembler(),
      });
      ctx.prefs.set('fontSize', 20);
      ctx.prefs.reset('fontSize');
      expect(ctx.prefs.get('fontSize')).toBe(14);
    });

    it('reset() without key restores all defaults', () => {
      const ctx = createPluginContext<TestServices>({
        pluginName: 'test',
        meta: createTestMeta({
          pluginName: 'test',
          preferenceDeclaration: {
            a: { type: 'number', default: 1 },
            b: { type: 'string', default: 'default' },
          },
        }),
        assembler: createTestAssembler(),
      });
      ctx.prefs.set('a', 99);
      ctx.prefs.set('b', 'changed');
      ctx.prefs.reset();
      expect(ctx.prefs.get('a')).toBe(1);
      expect(ctx.prefs.get('b')).toBe('default');
    });
  });
});

// =========================================================================
// 4. PluginRuntimeImpl
// =========================================================================

describe('PluginRuntimeImpl', () => {
  function createTestRuntime(
    setupFn?: (ctx: PluginContext<TestServices>) => void | (() => void),
    exports?: Record<string, unknown>,
  ) {
    const meta = createTestMeta();
    const ctx = createPluginContext<TestServices>({
      pluginName: meta.pluginName,
      meta,
      assembler: createTestAssembler(),
    });
    const config: PluginConfig<TestServices> = {
      setup: setupFn ?? (() => {}),
      exports,
    };
    return new PluginRuntimeImpl<TestServices>('test-plugin', meta, config, ctx);
  }

  describe('lifecycle states', () => {
    it('starts in registered state', () => {
      const rt = createTestRuntime();
      expect(rt.state).toBe('registered');
    });

    it('transitions: registered → initializing → initialized', async () => {
      const rt = createTestRuntime();
      await rt.init();
      expect(rt.state).toBe('initialized');
    });

    it('transitions to error when setup throws', async () => {
      const rt = createTestRuntime(() => {
        throw new Error('setup failed');
      });
      await expect(rt.init()).rejects.toThrow('setup failed');
      expect(rt.state).toBe('error');
      expect(rt.error).toBeDefined();
      expect(rt.error!.message).toBe('setup failed');
    });

    it('transitions to destroyed after destroy()', async () => {
      const rt = createTestRuntime();
      await rt.init();
      await rt.destroy();
      expect(rt.state).toBe('destroyed');
    });

    it('destroy() on registered plugin does nothing', async () => {
      const rt = createTestRuntime();
      await rt.destroy();
      expect(rt.state).toBe('registered');
    });

    it('destroy() on already destroyed plugin is noop', async () => {
      const rt = createTestRuntime();
      await rt.init();
      await rt.destroy();
      await rt.destroy();
      expect(rt.state).toBe('destroyed');
    });
  });

  describe('init() behavior', () => {
    it('init() is idempotent', async () => {
      const setupSpy = vi.fn();
      const rt = createTestRuntime(setupSpy);
      await rt.init();
      await rt.init();
      expect(setupSpy).toHaveBeenCalledTimes(1);
    });

    it('init() deduplicates concurrent calls', async () => {
      const setupSpy = vi.fn(() => {});
      const rt = createTestRuntime(setupSpy);
      await Promise.all([rt.init(), rt.init(), rt.init()]);
      expect(setupSpy).toHaveBeenCalledTimes(1);
    });

    it('forceInit re-runs setup after teardown', async () => {
      const teardownSpy = vi.fn();
      const setupSpy = vi.fn(() => teardownSpy);
      const rt = createTestRuntime(setupSpy);
      await rt.init();
      expect(setupSpy).toHaveBeenCalledTimes(1);

      await rt.init(true); // forceInit
      expect(teardownSpy).toHaveBeenCalledTimes(1);
      expect(setupSpy).toHaveBeenCalledTimes(2);
    });

    it('init() on error state without forceInit warns', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const rt = createTestRuntime(() => {
        throw new Error('fail');
      });
      await expect(rt.init()).rejects.toThrow('fail');

      await rt.init(); // should warn and return
      expect(consoleSpy).toHaveBeenCalledWith(
        'Plugin is in error state, use forceInit=true to retry.',
      );
      consoleSpy.mockRestore();
    });

    it('forceInit on error state retries', async () => {
      let shouldFail = true;
      const rt = createTestRuntime(() => {
        if (shouldFail) throw new Error('fail');
      });
      await expect(rt.init()).rejects.toThrow('fail');
      expect(rt.state).toBe('error');

      shouldFail = false;
      await rt.init(true); // forceInit retries setup
      expect(rt.state).toBe('initialized');
    });

    it('measures initTime', async () => {
      const rt = createTestRuntime(() => {});
      await rt.init();
      expect(typeof rt.initTime).toBe('number');
      expect(rt.initTime!).toBeGreaterThanOrEqual(0);
    });
  });

  describe('teardown', () => {
    it('calls teardown on destroy()', async () => {
      const teardownSpy = vi.fn();
      const rt = createTestRuntime(() => teardownSpy);
      await rt.init();
      await rt.destroy();
      expect(teardownSpy).toHaveBeenCalledTimes(1);
    });

    it('async teardown is awaited', async () => {
      let tornDown = false;
      const rt = createTestRuntime(() => async () => {
        await new Promise((r) => setTimeout(r, 20));
        tornDown = true;
      });
      await rt.init();
      await rt.destroy();
      expect(tornDown).toBe(true);
    });

    it('teardown error does not throw', async () => {
      const rt = createTestRuntime(() => () => {
        throw new Error('teardown error');
      });
      await rt.init();
      await expect(rt.destroy()).resolves.toBeUndefined();
      expect(rt.state).toBe('destroyed');
    });
  });

  describe('setDisabled', () => {
    it('sets disabled flag', () => {
      const rt = createTestRuntime();
      expect(rt.disabled).toBe(false);
      rt.setDisabled(true);
      expect(rt.disabled).toBe(true);
    });
  });

  describe('toProxy', () => {
    it('merges exports with runtime', async () => {
      const rt = createTestRuntime(() => {}, {
        greet: () => 'hello',
      });
      await rt.init();
      const proxy = rt.toProxy();
      expect(proxy.greet).toBeDefined();
      expect(typeof proxy.greet).toBe('function');
    });

    it('returns empty proxy when not initialized', () => {
      const rt = createTestRuntime();
      const proxy = rt.toProxy();
      expect((proxy as any).anything).toBeUndefined();
    });
  });
});

// =========================================================================
// 5. PluginManager
// =========================================================================

describe('PluginManager', () => {
  let manager: PluginManager<TestServices>;

  beforeEach(() => {
    manager = createTestManager();
  });

  describe('register()', () => {
    it('registers a plugin', async () => {
      const model = createTestModel();
      await manager.register(model);
      expect(manager.has('test-plugin')).toBe(true);
    });

    it('throws on duplicate registration', async () => {
      await manager.register(createTestModel());
      await expect(manager.register(createTestModel())).rejects.toThrow(
        'already registered',
      );
    });

    it('override replaces existing plugin', async () => {
      const model1 = createTestModel();
      await manager.register(model1);

      const setupSpy = vi.fn();
      const model2 = createTestModel(undefined, setupSpy);
      await manager.register(model2, { override: true });

      const rt = manager.get('test-plugin')!;
      await rt.init();
      expect(setupSpy).toHaveBeenCalled();
    });

    it('override destroys previous instance', async () => {
      const teardownSpy = vi.fn();
      const model1 = createTestModel(undefined, () => teardownSpy);
      await manager.register(model1);
      await manager.get('test-plugin')!.init();

      const model2 = createTestModel();
      await manager.register(model2, { override: true });
      expect(teardownSpy).toHaveBeenCalled();
    });
  });

  describe('init()', () => {
    it('initializes plugins in topological order', async () => {
      const order: string[] = [];
      const modelA = createTestModel({ pluginName: 'a' }, () => {
        order.push('a');
      });
      const modelB = createTestModel(
        { pluginName: 'b', dependencies: ['a'] },
        () => { order.push('b'); },
      );

      await manager.register(modelA);
      await manager.register(modelB);
      await manager.init();

      expect(order).toEqual(['a', 'b']);
    });

    it('throws on dependency resolution failure', async () => {
      const model = createTestModel({ pluginName: 'a', dependencies: ['missing'] });
      await manager.register(model);
      await expect(manager.init()).rejects.toThrow('dependency resolution failed');
    });

    it('individual plugin failure does not block others', async () => {
      const setupGood = vi.fn();
      const modelGood = createTestModel({ pluginName: 'good' }, setupGood);
      const modelBad = createTestModel({ pluginName: 'bad' }, () => {
        throw new Error('bad plugin');
      });

      await manager.register(modelGood);
      await manager.register(modelBad);
      await manager.init();

      expect(setupGood).toHaveBeenCalled(); // good still initialized
      expect(manager.get('bad')!.state).toBe('error');
      expect(manager.get('good')!.state).toBe('initialized');
    });
  });

  describe('destroy() and dispose()', () => {
    it('destroys plugins in reverse order', async () => {
      const order: string[] = [];
      const makeTeardown = (name: string) => () => () => { order.push(name); };
      const modelA = createTestModel({ pluginName: 'a' }, makeTeardown('a'));
      const modelB = createTestModel(
        { pluginName: 'b', dependencies: ['a'] },
        makeTeardown('b'),
      );

      await manager.register(modelA);
      await manager.register(modelB);
      await manager.init();
      await manager.destroy();

      // b depends on a, so reversed: b then a
      expect(order).toEqual(['b', 'a']);
    });

    it('dispose() clears all plugins', async () => {
      await manager.register(createTestModel());
      await manager.init();
      await manager.dispose();
      expect(manager.getAll()).toHaveLength(0);
      expect(manager.has('test-plugin')).toBe(false);
    });
  });

  describe('get() and has()', () => {
    it('get returns runtime for registered plugin', async () => {
      await manager.register(createTestModel());
      const rt = manager.get('test-plugin');
      expect(rt).toBeDefined();
      expect(rt!.name).toBe('test-plugin');
    });

    it('get returns undefined for unknown plugin', () => {
      expect(manager.get('unknown')).toBeUndefined();
    });

    it('has returns boolean for existence', async () => {
      expect(manager.has('test-plugin')).toBe(false);
      await manager.register(createTestModel());
      expect(manager.has('test-plugin')).toBe(true);
    });

    it('getAll returns all plugins', async () => {
      await manager.register(createTestModel({ pluginName: 'a' }));
      await manager.register(createTestModel({ pluginName: 'b' }));
      expect(manager.getAll()).toHaveLength(2);
    });
  });

  describe('delete()', () => {
    it('deletes and destroys a plugin', async () => {
      const teardownSpy = vi.fn();
      const model = createTestModel(undefined, () => teardownSpy);
      await manager.register(model);
      await manager.get('test-plugin')!.init();

      const result = await manager.delete('test-plugin');
      expect(result).toBe(true);
      expect(teardownSpy).toHaveBeenCalled();
      expect(manager.has('test-plugin')).toBe(false);
    });

    it('returns false for non-existent plugin', async () => {
      const result = await manager.delete('unknown');
      expect(result).toBe(false);
    });
  });

  describe('setDisabled()', () => {
    it('sets disabled flag on plugin', async () => {
      await manager.register(createTestModel());
      manager.setDisabled('test-plugin', true);
      expect(manager.get('test-plugin')!.disabled).toBe(true);
    });
  });

  describe('getPluginPreference()', () => {
    it('returns preference for plugin', () => {
      const prefs = new Map([['p1', { key1: 'val1' }]]);
      const mgr = new PluginManager<TestServices>({
        assembler: createTestAssembler(),
        pluginPreference: prefs,
      });
      expect(mgr.getPluginPreference('p1')).toEqual({ key1: 'val1' });
    });

    it('returns undefined for unknown plugin', () => {
      expect(manager.getPluginPreference('unknown')).toBeUndefined();
    });
  });

  describe('toProxy() on manager', () => {
    it('accesses plugin via manager.pluginName', async () => {
      await manager.register(
        createTestModel(undefined, () => {}, { sayHi: () => 'hi' }),
      );
      await manager.init();
      const proxy = manager.toProxy() as Record<string, any>;
      expect(typeof proxy['test-plugin'].sayHi).toBe('function');
    });

    it('disabled plugin returns undefined via proxy', async () => {
      await manager.register(createTestModel());
      manager.setDisabled('test-plugin', true);
      const proxy = manager.toProxy() as Record<string, any>;
      expect(proxy['test-plugin']).toBeUndefined();
    });

    it('uninitialized plugin returns undefined via proxy', async () => {
      await manager.register(createTestModel());
      const proxy = manager.toProxy() as Record<string, any>;
      expect(proxy['test-plugin']).toBeUndefined();
    });
  });
});

// =========================================================================
// 6. autoInit
// =========================================================================

describe('autoInit', () => {
  it('immediately initializes plugin on register', async () => {
    const setupSpy = vi.fn();
    const manager = createTestManager();
    await manager.register(createTestModel(undefined, setupSpy), {
      autoInit: true,
    });
    expect(setupSpy).toHaveBeenCalledTimes(1);
    expect(manager.get('test-plugin')!.state).toBe('initialized');
  });

  it('autoInit before manager.init() avoids double init', async () => {
    const setupSpy = vi.fn();
    const manager = createTestManager();
    await manager.register(createTestModel(undefined, setupSpy), {
      autoInit: true,
    });
    await manager.init();
    expect(setupSpy).toHaveBeenCalledTimes(1); // not called again
  });
});

// =========================================================================
// 7. pluginTransducer
// =========================================================================

describe('pluginTransducer', () => {
  it('transforms model before registration', async () => {
    const transducer = vi.fn(
      (model: PluginModel<TestServices>) => model,
    );
    const manager = new PluginManager<TestServices>({
      assembler: createTestAssembler(),
      pluginTransducer: transducer,
    });
    await manager.register(createTestModel());
    expect(transducer).toHaveBeenCalled();
    // NOTE: meta is destructured before transducer runs in register(),
    // so transducer cannot currently change the plugin name used for registration.
    // The model returned by transducer IS used as the factory though.
    expect(manager.has('test-plugin')).toBe(true);
  });
});

// =========================================================================
// 8. engineVersion check
// =========================================================================

describe('engineVersion', () => {
  it('passes compatible version check', async () => {
    const manager = new PluginManager<TestServices>({
      assembler: createTestAssembler(),
      engineVersion: '1.0.0',
      versionChecker: () => true,
    });
    await manager.register(
      createTestModel({ pluginName: 'p', engineVersion: '>=1.0.0' }),
    );
    expect(manager.has('p')).toBe(true);
  });

  it('throws on incompatible version', async () => {
    const manager = new PluginManager<TestServices>({
      assembler: createTestAssembler(),
      engineVersion: '1.0.0',
      versionChecker: () => false,
    });
    await expect(
      manager.register(
        createTestModel({ pluginName: 'p', engineVersion: '>=2.0.0' }),
      ),
    ).rejects.toThrow('version check failed');
  });

  it('skips check when no versionChecker provided', async () => {
    const manager = new PluginManager<TestServices>({
      assembler: createTestAssembler(),
      engineVersion: '1.0.0',
      // no versionChecker
    });
    await manager.register(
      createTestModel({ pluginName: 'p', engineVersion: '>=2.0.0' }),
    );
    expect(manager.has('p')).toBe(true); // skipped, no error
  });
});

// =========================================================================
// 9. Reserved prefix
// =========================================================================

describe('reserved event prefix', () => {
  it('warns and resets reserved prefix', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const manager = createTestManager();
    const model = createTestModel({
      pluginName: 'p',
      eventPrefix: 'plugin:custom',
    });
    await manager.register(model);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('reserved eventPrefix'),
    );
    warnSpy.mockRestore();
  });

  it('allows custom unreserved prefix', async () => {
    const model = createTestModel({
      pluginName: 'p',
      eventPrefix: 'my-custom-prefix',
    });
    const manager = createTestManager();
    await manager.register(model);
    expect(manager.has('p')).toBe(true);
  });
});

// =========================================================================
// 10. filterValidOptions
// =========================================================================

describe('filterValidOptions', () => {
  const decl = {
    fontSize: { type: 'number' as const, default: 14 },
    theme: { type: 'string' as const, default: 'dark' },
  };

  it('keeps only declared keys', () => {
    const opts = { fontSize: 16, theme: 'light', injected: 'evil' };
    const result = filterValidOptions(opts, decl);
    expect(result).toEqual({ fontSize: 16, theme: 'light' });
    expect(result).not.toHaveProperty('injected');
  });

  it('filters out null/undefined values', () => {
    const opts = { fontSize: null, theme: 'dark' };
    const result = filterValidOptions(opts, decl);
    expect(result).toEqual({ theme: 'dark' });
  });

  it('returns empty for null options', () => {
    expect(filterValidOptions(null, decl)).toEqual({});
  });

  it('returns empty for empty declaration', () => {
    expect(filterValidOptions({ a: 1 }, {})).toEqual({});
  });
});

// =========================================================================
// 11. definePlugin helper
// =========================================================================

describe('definePlugin', () => {
  it('returns callable PluginModel with meta', () => {
    const meta: PluginMeta = { pluginName: 'my-plugin' };
    const factory = vi.fn(
      (_ctx: PluginContext, _opts?: Record<string, unknown>) =>
        ({
          setup() {},
          exports: {},
        }) as PluginConfig,
    );
    const model = definePlugin(meta, factory);

    expect(typeof model).toBe('function');
    expect(model.meta).toBe(meta);

    // Call it
    const ctx = createPluginContext({
      pluginName: 'my-plugin',
      meta,
      assembler: createTestAssembler(),
    });
    const config = model(ctx);
    expect(factory).toHaveBeenCalledWith(ctx);
    expect(config.setup).toBeDefined();
  });

  it('passes options through to factory', () => {
    const meta: PluginMeta = { pluginName: 'p' };
    const factory = vi.fn(
      (_ctx: PluginContext, _opts?: Record<string, unknown>) =>
        ({ setup() {} }) as PluginConfig,
    );
    const model = definePlugin(meta, factory);
    const ctx = createPluginContext({
      pluginName: 'p',
      meta,
      assembler: createTestAssembler(),
    });
    model(ctx, { mode: 'advanced' });
    expect(factory).toHaveBeenCalledWith(ctx, { mode: 'advanced' });
  });
});

// =========================================================================
// 12. ContextApiAssembler customization
// =========================================================================

describe('ContextApiAssembler', () => {
  it('can provide different services per plugin', async () => {
    interface DiffServices {
      role: string;
    }
    const assembler: ContextApiAssembler<DiffServices> = {
      assembleServices(pluginName: string, _meta: PluginMeta) {
        return {
          role: pluginName === 'admin' ? 'admin' : 'user',
        };
      },
    };
    const manager = new PluginManager<DiffServices>({ assembler });
    const adminModel = createTestModel({ pluginName: 'admin' }) as any;
    const userModel = createTestModel({ pluginName: 'user' }) as any;

    let adminRole = '';
    let userRole = '';

    const adminWithSetup = Object.assign(
      (_ctx: PluginContext<DiffServices>) =>
        ({
          setup(ctx: PluginContext<DiffServices>) {
            adminRole = ctx.services.role;
          },
        }) as PluginConfig<DiffServices>,
      { meta: { pluginName: 'admin' } },
    );
    const userWithSetup = Object.assign(
      (_ctx: PluginContext<DiffServices>) =>
        ({
          setup(ctx: PluginContext<DiffServices>) {
            userRole = ctx.services.role;
          },
        }) as PluginConfig<DiffServices>,
      { meta: { pluginName: 'user' } },
    );

    await manager.register(adminWithSetup);
    await manager.register(userWithSetup);
    await manager.init();

    expect(adminRole).toBe('admin');
    expect(userRole).toBe('user');
  });
});

// =========================================================================
// 13. Integration: full lifecycle
// =========================================================================

describe('integration', () => {
  it('register → init → use → destroy full flow', async () => {
    interface MyServices {
      api: { fetch: () => string };
    }

    const assembler: ContextApiAssembler<MyServices> = {
      assembleServices(_name, _meta) {
        return { api: { fetch: () => 'data' } };
      },
    };

    const manager = new PluginManager<MyServices>({ assembler });

    const receivedServices: string[] = [];
    const teardownCalls: string[] = [];

    const model: PluginModel<MyServices> = Object.assign(
      (ctx: PluginContext<MyServices>) => ({
        setup(ctx2: PluginContext<MyServices>) {
          receivedServices.push(ctx2.services.api.fetch());
          ctx2.event.emitGlobal('plugin:ready', ctx2.pluginName);
          return () => { teardownCalls.push(ctx2.pluginName); };
        },
        exports: { ping: () => 'pong' },
      }),
      { meta: { pluginName: 'integrated' } },
    );

    // Register
    await manager.register(model);
    expect(manager.has('integrated')).toBe(true);

    // Init
    await manager.init();
    expect(receivedServices).toEqual(['data']);
    expect(manager.get('integrated')!.state).toBe('initialized');

    // Use via toProxy
    const proxy = manager.toProxy() as Record<string, any>;
    expect(proxy.integrated.ping()).toBe('pong');

    // Destroy
    await manager.destroy();
    expect(teardownCalls).toEqual(['integrated']);
  });
});
