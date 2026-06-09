/**
 * 焦点追踪器 — 维护一个焦点栈，管理 Popup/Dropdown 等弹出层的点击外部关闭、ESC 关闭等行为。
 *
 * 核心概念：
 * - actives 是一个栈（active/unshift），栈顶（first）是当前聚焦的 Focusable
 * - modal Focusable 打开时会阻止非 modal 的上层焦点失焦
 * - mount() 在 document 上监听 click，点击栈顶 Focusable 范围外时触发 blur
 */
export class FocusTracker {
  /** 焦点栈，栈顶为当前聚焦项 */
  private actives: Focusable[] = [];

  /** modal 弹层注册表，用于检查是否有 modal 正在打开 */
  private modals: Array<{
    checkDown: (e: MouseEvent) => boolean;
    checkOpen: () => boolean;
  }> = [];

  /** 当前焦点栈顶 */
  get first() {
    return this.actives[0];
  }

  /** 注册一个 modal 弹层，用于 execSave 等时判断是否跳过 */
  addModal(checkDown: (e: MouseEvent) => boolean, checkOpen: () => boolean) {
    this.modals.push({ checkDown, checkOpen });
  }

  /** 是否有 modal 弹层正在打开 */
  private checkModalOpen(): boolean {
    return this.modals.some((item) => item.checkOpen());
  }

  /** 触发保存操作，有 modal 时跳过 */
  execSave() {
    if (this.checkModalOpen()) return;
    if (this.first) this.first.internalTriggerSave();
  }

  /** 触发 ESC — 挂起栈顶并调用其 onEsc */
  execEsc() {
    const { first } = this;
    if (first) {
      this.internalSuspenseItem(first);
      first.internalTriggerEsc();
    }
  }

  /**
   * 挂载全局点击监听
   * 点击 document 时，如果点击目标不在 first 的 range 内，则挂起 first 并触发 blur
   * @returns 卸载函数
   */
  mount(win: Window) {
    const checkDown = (e: MouseEvent) => {
      const { first } = this;
      if (first && !first.internalCheckInRange(e)) {
        this.internalSuspenseItem(first);
        first.internalTriggerBlur();
      }
    };
    win.document.addEventListener('click', checkDown, true);
    return () => win.document.removeEventListener('click', checkDown, true);
  }

  /** 创建一个 Focusable 实例并绑定到当前 tracker */
  create(config: FocusableConfig): Focusable {
    return new Focusable(this, config);
  }

  /**
   * 激活一个 Focusable — 将其推到栈顶
   * 如果栈顶已有其他 Focusable 且新项不是 modal，则先触发旧栈顶的 blur
   */
  internalActiveItem(item: Focusable) {
    const first = this.actives[0];
    if (first === item) return;
    const i = this.actives.indexOf(item);
    if (i > -1) this.actives.splice(i, 1);
    this.actives.unshift(item);
    if (!item.isModal && first) first.internalTriggerBlur();
    item.internalTriggerActive();
  }

  /**
   * 挂起一个 Focusable — 将其从栈中移除
   * 移除后如果还有剩余项，激活新的栈顶
   */
  internalSuspenseItem(item: Focusable) {
    const i = this.actives.indexOf(item);
    if (i > -1) {
      this.actives.splice(i, 1);
      this.first?.internalTriggerActive();
    }
  }
}

/** Focusable 的创建配置 */
export interface FocusableConfig {
  /** 判定"在范围内"的依据：DOM 元素（contains 判断）或自定义函数 */
  range: HTMLElement | ((e: MouseEvent) => boolean);
  /** 是否为 modal 模式，modal 不为非 modal 的激活而失焦 */
  modal?: boolean;
  /** ESC 键回调 */
  onEsc?: () => void;
  /** 失焦回调（点击外部或其它 Focusable 激活时触发） */
  onBlur?: () => void;
  /** 保存回调（Ctrl+S 等），返回 true 表示已处理 */
  onSave?: () => void;
  /** 激活回调（被推到栈顶时触发） */
  onActive?: () => void;
}

/**
 * 可聚焦项 — 代表一个弹出层（Popup/Dropdown 等）的焦点状态
 *
 * 使用方式：
 * 1. tracker.create(config) 创建 Focusable
 * 2. 弹出层打开时调用 focusable.active() 推入栈顶
 * 3. 弹出层关闭时调用 focusable.suspense() 或 purge() 移出栈
 * 4. 需要在组件挂载后调用 setRange() 注入真实 DOM
 */
export class Focusable {
  readonly isModal?: boolean;

  constructor(
    private tracker: FocusTracker,
    private config: FocusableConfig,
  ) {
    this.isModal = config.modal ?? false;
  }

  /** 激活当前 Focusable，推入焦点栈顶 */
  active() {
    this.tracker.internalActiveItem(this);
  }

  /** 挂起当前 Focusable，从焦点栈移除 */
  suspense() {
    this.tracker.internalSuspenseItem(this);
  }

  /** 销毁当前 Focusable（同 suspense，语义化别名） */
  purge() {
    this.tracker.internalSuspenseItem(this);
  }

  /** 挂载后把真实 DOM 注入，使 range 的 contains 判断生效 */
  setRange(range: HTMLElement | ((e: MouseEvent) => boolean)) {
    this.config.range = range;
  }

  /** 检查点击事件是否在 range 范围内 */
  internalCheckInRange(e: MouseEvent) {
    const { range } = this.config;
    if (!range) return false;
    if (typeof range === 'function') return range(e);
    return range.contains(e.target as HTMLElement);
  }

  /** 触发失焦回调 */
  internalTriggerBlur() {
    this.config.onBlur?.();
  }

  /** 触发保存回调，返回 true 表示已处理 */
  internalTriggerSave() {
    if (this.config.onSave) {
      this.config.onSave();
      return true;
    }
    return false;
  }

  /** 触发 ESC 回调 */
  internalTriggerEsc() {
    this.config.onEsc?.();
  }

  /** 触发激活回调 */
  internalTriggerActive() {
    this.config.onActive?.();
  }
}
