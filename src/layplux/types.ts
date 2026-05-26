import type { Component } from 'vue';

// ── Tool Window ──────────────────────────────────────────────

export type ToolWindowAnchor = 'left' | 'right' | 'bottom';
export type ToolWindowType = 'docked' | 'sliding' | 'undocked';
export type ToolWindowState = 'disabled' | 'enabled' | 'ready' | 'error';

export interface ToolWindowConfig {
  id: string;
  anchor: ToolWindowAnchor;
  title: string;
  icon?: Component;
  type?: ToolWindowType;
  isSplit?: boolean;
  factory: () => Component | Promise<Component>;
}

export interface ToolWindowHandle {
  readonly id: string;
  readonly state: ToolWindowState;
  enable(): void;
  disable(): void;
  error(message: string): void;
  activate(): void;
  hide(): void;
  dispose(): void;
}

// ── Content (tab inside tool window) ─────────────────────────

export interface ContentInfo {
  id: string;
  displayName: string;
  component: Component;
  isCloseable?: boolean;
}

export interface ContentManager {
  readonly activeContentId: string | null;
  addContent(content: ContentInfo): Disposable;
  removeContent(id: string): void;
  setSelectedContent(id: string): void;
  getAllContents(): ContentInfo[];
  readonly activeContent: ContentInfo | null;
}

// ── Action ───────────────────────────────────────────────────

export interface ActionConfig {
  id: string;
  text: string;
  description?: string;
  icon?: Component;
  keyboard?: KeyboardShortcut | KeyboardShortcut[];
  group?: string;
  update: (ctx: ActionContext) => ActionPresentation;
  actionPerformed: (ctx: ActionContext) => void;
}

export interface ActionPresentation {
  enabled: boolean;
  visible: boolean;
  text?: string;
  icon?: Component;
}

export interface KeyboardShortcut {
  modifier: 'ctrl' | 'alt' | 'shift' | 'meta';
  key: string;
}

export interface ActionContext {
  getData<T>(key: string): T | undefined;
  readonly layplux: unknown;
  readonly focusComponent: string;
}

// ── Editor ───────────────────────────────────────────────────

export interface EditorProviderConfig {
  id: string;
  factory: () => Component;
}

// ── Status Bar ───────────────────────────────────────────────

export interface StatusWidgetConfig {
  id: string;
  position: 'left' | 'center' | 'right';
  factory: () => Component;
  update?: () => void;
}

// ── Focus ────────────────────────────────────────────────────

export type FocusRegion = 'editor' | `toolWindow:${string}` | 'statusBar';

// ── Layout Persistence ───────────────────────────────────────

export interface ToolWindowLayoutState {
  id: string;
  anchor: ToolWindowAnchor;
  type: ToolWindowType;
  visible: boolean;
  splitProportion?: number;
}

export interface LayoutState {
  version: number;
  toolWindows: ToolWindowLayoutState[];
}

// ── Disposable ───────────────────────────────────────────────

export interface Disposable {
  dispose(): void;
}
