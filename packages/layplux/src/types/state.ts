import type { ViewMode } from '../managers/pane';

export interface SkeletonState {
  /** 左侧面板宽度 (px)，默认 340 */
  leftWidth: number;
  /** 右侧面板宽度 (px)，默认 340 */
  rightWidth: number;
  /** 底部面板高度 (px)，默认 300 */
  bottomHeight: number;
  /** 左侧内部上下分割比例 (0~1)，默认 0.5 */
  leftSplitRatio: number;
  /** 右侧内部上下分割比例 (0~1)，默认 0.5 */
  rightSplitRatio: number;
  /** 底部内部左右分割比例 (0~1)，默认 0.5 */
  bottomSplitRatio: number;
  /** 每个 panel widget 的视图模式，key 为 widget name */
  viewModes: Record<string, ViewMode>;
  /** 每个区域当前激活的 widget name，key 为 area name */
  activeIds: Record<string, string | null>;
}
