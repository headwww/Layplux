import { ref, type Ref } from 'vue';

/**
 * 没个widget都会对应自己的pane的状态
 */
export type ViewMode = 'DockPinned' | 'DockUnpinned' | 'Undock';

export interface IPane {
  viewMode: Ref<ViewMode>;
  setViewMode: (mode: ViewMode) => void;
}

export function usePane(defaultViewMode: ViewMode = 'DockPinned'): IPane {
  const viewMode = ref<ViewMode>(defaultViewMode);

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode;
  }

  return {
    viewMode,
    setViewMode,
  };
}
