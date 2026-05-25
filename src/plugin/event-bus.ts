// =================================================================
// event-bus.ts — 基于 EventEmitter2 的插件事件总线
//
// 利用 EventEmitter2 的三个核心特性：
//   1. wildcard: true  → 支持 'terminal:*' 订阅整个命名空间
//   2. delimiter: ':'  → 'namespace:event' 格式的原生支持
//   3. listener.off()  → 订阅返回 Listener 对象，无需手动传 handler 引用
// =================================================================

import EventEmitter2, { type Listener } from 'eventemitter2';
import type { PluginEventBus } from './plugin-types';

// ── 全局总线单例（所有插件共享，跨插件通信用）──────────────────────
//
// wildcard + delimiter 让命名空间隔离变成原生能力：
//   - 插件 A 订阅 'terminal:*'  可以收到所有 terminal 前缀的事件
//   - 全局订阅 '**' 可以监听所有事件（调试用）
//   - maxListeners 设大一点，避免大量插件时出现警告

const globalEmitter = new EventEmitter2({
  wildcard: true, // 开启通配符
  delimiter: ':', // 命名空间分隔符，与原版 createModuleEventBus 保持一致
  newListener: false, // 不触发 newListener 事件，减少不必要开销
  maxListeners: 200, // 对标原版 createModuleEventBus(pluginName, 200) 的容量参数
  verboseMemoryLeak: true, // 超出 maxListeners 时打印详细的内存泄漏警告
});

// ── 插件私有事件总线工厂函数 ──────────────────────────────────────
//
// 每个插件获得一个独立的 emitter 实例（私有事件不污染全局），
// 同时持有 globalEmitter 引用用于跨插件通信。
//
// 命名规则：
//   ctx.event.emit('data-loaded')       → 实际发出 'terminal:data-loaded'（自动加前缀）
//   ctx.event.on('data-loaded', fn)     → 订阅 'terminal:data-loaded'
//   ctx.event.onGlobal('layout:*', fn)  → 订阅全局总线上所有 layout 事件（wildcard）
//   ctx.event.emitGlobal('layout:ready')→ 向全局总线发出事件，所有插件都能收到

export function createPluginEventBus(namespace: string): PluginEventBus {
  // 每个插件自己的私有 emitter（同样开启 wildcard）
  const privateEmitter = new EventEmitter2({
    wildcard: true,
    delimiter: ':',
    newListener: false,
    maxListeners: 200,
    verboseMemoryLeak: true,
  });

  const prefixed = (event: string) => `${namespace}:${event}`;

  return {
    // ── 私有事件（自动加 namespace 前缀）──────────────────────────

    emit<T>(event: string, payload?: T): void {
      privateEmitter.emit(prefixed(event), payload);
    },

    /**
     * 订阅私有事件，返回取消订阅函数。
     * 利用 EventEmitter2 的 Listener 对象的 .off() 方法，
     * 无需调用方保存 handler 引用。
     */
    on<T>(event: string, handler: (payload: T) => void): () => void {
      const listener = privateEmitter.on(
        prefixed(event),
        handler as (payload: unknown) => void,
        { objectify: true }, // 返回 Listener 对象而非 emitter 本身
      ) as Listener;

      return () => listener.off();
    },

    off<T>(event: string, handler: (payload: T) => void): void {
      privateEmitter.off(prefixed(event), handler as (payload: unknown) => void);
    },

    /**
     * 订阅一次后自动取消
     */
    once<T>(event: string, handler: (payload: T) => void): () => void {
      const listener = privateEmitter.once(prefixed(event), handler as (payload: unknown) => void, {
        objectify: true,
      }) as Listener;

      return () => listener.off();
    },

    // ── 全局事件（跨插件通信，走 globalEmitter）────────────────────

    emitGlobal<T>(event: string, payload?: T): void {
      globalEmitter.emit(event, payload);
    },

    /**
     * 订阅全局事件，支持通配符：
     *   onGlobal('layout:*', fn)       → 订阅所有 layout 事件
     *   onGlobal('layout:panel-**', fn)→ 订阅所有 layout:panel 开头的事件
     *   onGlobal('**', fn)             → 订阅所有全局事件（慎用）
     */
    onGlobal<T>(event: string, handler: (payload: T) => void): () => void {
      const listener = globalEmitter.on(event, handler as (payload: unknown) => void, {
        objectify: true,
      }) as Listener;

      return () => listener.off();
    },

    offGlobal<T>(event: string, handler: (payload: T) => void): void {
      globalEmitter.off(event, handler as (payload: unknown) => void);
    },

    onGlobalOnce<T>(event: string, handler: (payload: T) => void): () => void {
      const listener = globalEmitter.once(event, handler as (payload: unknown) => void, {
        objectify: true,
      }) as Listener;

      return () => listener.off();
    },

    /**
     * 等待某个全局事件触发，返回 Promise（EventEmitter2 原生支持）
     * 适合插件 setup 中等待其他插件就绪的场景：
     *   await ctx.event.waitForGlobal('explorer:ready', 5000)
     */
    waitForGlobal<T>(event: string, timeoutMs?: number): Promise<T> {
      return new Promise((resolve, reject) => {
        const timer = timeoutMs
          ? setTimeout(() => {
              globalEmitter.off(event, onEvent);
              reject(new Error(`[EventBus] Timeout waiting for "${event}" after ${timeoutMs}ms`));
            }, timeoutMs)
          : null;

        function onEvent(payload: unknown) {
          if (timer) clearTimeout(timer);
          resolve(payload as T);
        }

        globalEmitter.once(event, onEvent);
      });
    },

    // ── 清理（插件 destroy 时调用）─────────────────────────────────

    /**
     * 移除该插件私有 emitter 上的所有监听器。
     * 全局监听器需要单独 offGlobal（插件应在 teardown 中手动清理）。
     */
    removeAllListeners(): void {
      privateEmitter.removeAllListeners();
    },
  };
}

// ── 系统级全局事件工具函数（PluginManager 使用）────────────────────

export function emitSystemEvent(event: string, payload?: unknown): void {
  globalEmitter.emit(event, payload);
}

export function onSystemEvent(event: string, handler: (payload: unknown) => void): () => void {
  const listener = globalEmitter.on(event, handler, {
    objectify: true,
  }) as Listener;

  return () => listener.off();
}

export function getGlobalEmitter(): EventEmitter2 {
  return globalEmitter;
}
