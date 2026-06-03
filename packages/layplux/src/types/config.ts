import type { Component, VNode } from 'vue';
import type { IWidget } from '../managers';

export type SkeletonConfigArea =
  | 'topArea'
  | 'bottomArea'
  | 'leftTopArea'
  | 'leftBottomArea'
  | 'rightTopArea'
  | 'rightBottomArea'
  | 'bottomLeftArea'
  | 'bottomRightArea';

// 组件的类型 交互型和面板型
export type SkeletonConfigType = 'interaction' | 'panel';

export interface WidgetBaseConfig {
  [extra: string]: any;
  // 组件的名称
  name: string;
  // 组件的类型 交互型和面板型
  type?: SkeletonConfigType;
  // 组件的位置
  area?: SkeletonConfigArea;
  // 组件自定义属性
  props?: Record<string, any>;
  // 组件内容
  content?: string | Component | VNode;
  // 组件内容自定义属性
  contentProps?: Record<string, any>;
  // 组件索引 用于排序
  index?: number;
}

// 如果是面板型组件，则需要配置面板内容
export interface PanelWidgetConfig extends WidgetBaseConfig {
  type: 'panel';
  content?: string | Component | VNode;
  props?: PanelWidgetProps;
}

export interface PanelWidgetProps {
  [key: string]: any;
  /**
   * 面板标题前的 icon
   */
  icon?: string | Component | VNode;
  /**
   * 面板标题
   */
  title?: string | Component | VNode;
}

// 如果是交互型组件，则需要配置交互内容
export interface InteractionWidgetConfig extends WidgetBaseConfig {
  type: 'interaction';
  content?: string | Component | VNode;
  props?: InteractionWidgetProps;
}

export type InteractionWidgetAlign = 'left' | 'center' | 'right';

export interface InteractionWidgetProps {
  [key: string]: any;
  align?: InteractionWidgetAlign;
  onInit?: (widget: IWidget) => void;
  title?: string | Component | VNode;
}

export type SkeletonConfig = PanelWidgetConfig | InteractionWidgetConfig | WidgetBaseConfig;

// 按照这个配置，生成一个 widget 对象
