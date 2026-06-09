import { defineComponent, ref, inject, type PropType, type Ref, type VNode, type Component } from 'vue';
import type { IWidget } from '../../managers';
import type { ViewMode } from '../../managers/pane';
import {
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
  DropdownSubmenu,
} from '../dropdown';
import { MoreIcon, MinimizeIcon } from '../icon';
import { createContent } from '../../utils';
import { getBuiltInLocale } from '../../locales';
import type { LaypluxLocale } from '../../types/locale';

export interface MenuItemConfig {
  type?: 'item' | 'divider';
  key?: string;
  label?: string;
  icon?: VNode;
  children?: MenuItemConfig[];
  /** 点击回调，参数为 key 和当前 widget */
  onClick?: (key: string, widget: IWidget) => void;
}

const viewModeKeys = new Set(['DockPinned', 'DockUnpinned', 'Undock']);

function findItem(items: MenuItemConfig[] | undefined, key: string): MenuItemConfig | undefined {
  if (!items) return;
  for (const item of items) {
    if (item.key === key) return item;
    if (item.children?.length) {
      const found = findItem(item.children, key);
      if (found) return found;
    }
  }
}

export const PanelView = defineComponent({
  name: 'PanelView',
  props: {
    anchor: String,
    title: String,
    widget: Object as PropType<IWidget>,
    menuItems: Array as PropType<MenuItemConfig[]>,
  },
  setup(props, { slots }) {
    const panelRef = ref<HTMLElement>();
    const defaultLocale = ref<LaypluxLocale>(getBuiltInLocale('zh-CN'));
    const locale = inject<Ref<LaypluxLocale>>('layplux-locale', defaultLocale);

    const handleClick = (key: string) => {
      const widget = props.widget;
      widget?.event?.emitGlobal(`panel:${widget.name}:menu-click`, { widget, key });
      const widgetProps = widget?.config.props;
      const panelItems = widgetProps?.panelMenuItems as MenuItemConfig[] | undefined;
      const panelItem = findItem(panelItems, key);
      if (panelItem?.onClick) {
        panelItem.onClick(key, widget!);
        return;
      }

      if (viewModeKeys.has(key)) {
        widget?.pane.setViewMode(key as ViewMode);
      } else if (key === 'help') {
        widgetProps?.onHelpClick?.();
      }
    };

    function handlePanelClick() {
      props.widget?.focusable.active();
    }

    function renderItems(items: MenuItemConfig[], currentMode?: ViewMode) {
      return items.map((item) => {
        if (item.type === 'divider') {
          return <DropdownDivider key={item.key ?? 'divider'} />;
        }

        const k = item.key ?? '';

        if (item.children?.length) {
          return (
            <DropdownSubmenu
              key={k}
              title={item.label}
              icon={item.icon}
              getContainer={() => panelRef.value!}
            >
              {renderItems(item.children, currentMode)}
            </DropdownSubmenu>
          );
        }

        const disabled = currentMode !== undefined && viewModeKeys.has(k) && currentMode === k;

        return (
          <DropdownItem key={k} eventKey={k} disabled={disabled}>
            {item.icon} {item.label}
          </DropdownItem>
        );
      });
    }

    return () => {
      const widget = props.widget;
      const currentMode = widget?.pane.viewMode.value;
      const widgetProps = widget?.config.props;
      const hasCustomItems = props.menuItems && props.menuItems.length > 0;
      const panelMenuItems = widgetProps?.panelMenuItems as MenuItemConfig[] | undefined;
      const hasPanelMenuItems = panelMenuItems && panelMenuItems.length > 0;
      const showHelp = widgetProps?.showHelp !== false;
      const loc = locale.value.panel;
      const finalInnerItems: MenuItemConfig[] = [
        {
          key: 'viewMode',
          label: loc.viewMode,
          children: [
            { key: 'DockPinned', label: loc.dockPinned },
            { key: 'DockUnpinned', label: loc.dockUnpinned },
            { key: 'Undock', label: loc.undock },
          ],
        },
        { type: 'divider' },
        ...(showHelp ? [{ key: 'help' as const, label: loc.help }] : []),
      ];
      const panelTitleExtra = widgetProps?.panelTitleExtra as
        | string
        | Component
        | VNode
        | undefined;
      const panelActionsExtra = widgetProps?.panelActionsExtra as
        | string
        | Component
        | VNode
        | undefined;

      return (
        <div ref={panelRef} id={widget?.id} class="layplux-panel" onClick={handlePanelClick}>
          <div class="layplux-panel__header">
            <span class="layplux-panel__title">{props.title ?? widget?.name}</span>

            {panelTitleExtra && createContent(panelTitleExtra)}

            <div class="layplux-panel__actions">
              {panelActionsExtra && createContent(panelActionsExtra)}
              {slots.actionsExtra?.()}

              <Dropdown
                trigger="click"
                placement="bottom-start"
                onClick={handleClick}
                getContainer={() => panelRef.value!}
              >
                {{
                  default: () => (
                    <button class="layplux-panel__action-btn" title={loc.more}>
                      <MoreIcon size={16} />
                    </button>
                  ),
                  overlay: () => (
                    <DropdownMenu>
                      {hasPanelMenuItems && renderItems(panelMenuItems)}
                      {hasPanelMenuItems && hasCustomItems && <DropdownDivider />}
                      {hasCustomItems && renderItems(props.menuItems)}
                      {(hasPanelMenuItems || hasCustomItems) && <DropdownDivider />}
                      {renderItems(finalInnerItems, currentMode)}
                    </DropdownMenu>
                  ),
                }}
              </Dropdown>

              <button
                class="layplux-panel__action-btn"
                title={loc.minimize}
                onClick={() => {
                  widget?.event?.emitGlobal(`panel:${widget.name}:minimize`, { widget });
                  widget?.container?.deactivate();
                }}
              >
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
