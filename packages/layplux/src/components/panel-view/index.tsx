import { defineComponent, type PropType, type VNode } from 'vue';
import type { IWidget } from '../../managers';
import type { ViewMode } from '../../managers/pane';
import {
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
  DropdownSubmenu,
} from '../dropdown';
import { MoreIcon, MinimizeIcon, ChevronRightIcon } from '../icon';

interface MenuItemConfig {
  key: string;
  label: string;
  icon?: VNode;
  children?: MenuItemConfig[];
}

const innerItems: MenuItemConfig[] = [
  {
    key: 'viewMode',
    label: '视图模式',
    icon: <ChevronRightIcon size={16} />,
    children: [
      { key: 'DockPinned', label: '停靠固定' },
      { key: 'DockUnpinned', label: '停靠不固定' },
      { key: 'Undock', label: '取消停靠' },
    ],
  },
  {
    key: 'resize',
    label: '调整大小',
    children: [
      { key: 'extendLeft', label: '延伸至左侧', icon: <ChevronRightIcon size={16} /> },
      { key: 'extendRight', label: '延伸至右侧' },
      { key: 'extendTop', label: '延伸至顶部' },
      { key: 'extendBottom', label: '延伸至底部' },
    ],
  },
  { key: 'help', label: '帮助' },
];

const viewModeKeys = new Set(['DockPinned', 'DockUnpinned', 'Undock']);

function renderItems(items: MenuItemConfig[], currentMode?: ViewMode) {
  return items.map((item) => {
    if (item.children?.length) {
      return (
        <DropdownSubmenu key={item.key} title={item.label} icon={item.icon}>
          {renderItems(item.children, currentMode)}
        </DropdownSubmenu>
      );
    }

    const disabled =
      currentMode !== undefined && viewModeKeys.has(item.key) && currentMode === item.key;

    return (
      <DropdownItem key={item.key} eventKey={item.key} disabled={disabled}>
        {item.icon} {item.label}
      </DropdownItem>
    );
  });
}

export const PanelView = defineComponent({
  name: 'PanelView',
  props: {
    anchor: String,
    title: String,
    widget: Object as PropType<IWidget>,
    menuItems: Array as PropType<MenuItemConfig[]>,
    onMenuClick: Function as PropType<(key: string) => void>,
    onHelpClick: Function as PropType<() => void>,
    onMinimize: Function as PropType<() => void>,
  },
  setup(props, { slots }) {
    const handleClick = (key: string) => {
      if (viewModeKeys.has(key)) {
        props.widget?.pane.setViewMode(key as ViewMode);
      } else if (key === 'help') {
        props.onHelpClick?.();
      } else {
        props.onMenuClick?.(key);
      }
    };

    return () => {
      const widget = props.widget;
      const currentMode = widget?.pane.viewMode.value;
      const hasCustomItems = props.menuItems && props.menuItems.length > 0;

      return (
        <div class="layplux-panel">
          <div class="layplux-panel__header">
            <span class="layplux-panel__title">{props.title ?? widget?.name}</span>

            <div class="layplux-panel__actions">
              {slots.actionsExtra?.()}

              <Dropdown trigger="click" placement="bottom-start" onClick={handleClick}>
                {{
                  default: () => (
                    <button class="layplux-panel__action-btn" title="更多">
                      <MoreIcon size={16} />
                    </button>
                  ),
                  overlay: () => (
                    <DropdownMenu>
                      {hasCustomItems && renderItems(props.menuItems)}
                      {hasCustomItems && <DropdownDivider />}
                      {renderItems(innerItems, currentMode)}
                    </DropdownMenu>
                  ),
                }}
              </Dropdown>

              <button class="layplux-panel__action-btn" title="最小化" onClick={props.onMinimize}>
                <MinimizeIcon size={16} />
              </button>
            </div>
          </div>

          <div id={props.anchor} class="layplux-panel__body" />
        </div>
      );
    };
  },
});
