import browser from 'webextension-polyfill';
import throttle from 'lodash/throttle';
import { nanoid } from 'nanoid';
import { defaults } from 'lodash';

import { notifier } from '../lib/notifier';
import { exclusions } from './exclusions';
import tabs from './tabs';
import { translator } from '../common/translator';
import { settings } from './settings';
import { isHttp } from '../lib/string-utils';
import { log } from '../lib/logger';
import { ExclusionsModes } from '../common/exclusionsConstants';

interface ContextMenuItem extends browser.Menus.CreateCreatePropertiesType {
    action?: (tab?: browser.Tabs.Tab) => Promise<any> | void;
}

interface ContextMenuItems {
    [key: string]: ContextMenuItem;
}

interface ContextMenuInterface {
    init(): void;
}

// All contexts except "browser_action", "page_action" and "launcher"
const contexts: browser.Menus.ContextType[] = ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio'];

const renewContextMenuItems = async (
    menuItems: browser.Menus.CreateCreatePropertiesType[],
): Promise<void> => {
    await browser.contextMenus.removeAll();
    await Promise.all(menuItems.map(async (itemOptions) => {
        const {
            id,
            title,
            type,
            checked,
        } = itemOptions;

        try {
            const createProperties = defaults({
                id,
                title,
                checked,
                type,
            }, { contexts });

            await browser.contextMenus.create(createProperties, () => {
                if (browser.runtime.lastError) {
                    log.error(browser.runtime.lastError.message);
                }
            });
        } catch (e) {
            log.error(e);
        }
    }));
};

const clearContextMenuItems = async (): Promise<void> => {
    await browser.contextMenus.removeAll();
};

const CONTEXT_MENU_ITEMS: ContextMenuItems = {
    enable_vpn: {
        id: 'enable_vpn',
        title: translator.getMessage('context_menu_enable_vpn'),
        action: async (tab?: browser.Tabs.Tab) => {
            if (tab?.url) {
                await exclusions.enableVpnByUrl(tab.url);
            }
        },
    },
    disable_vpn: {
        id: 'disable_vpn',
        title: translator.getMessage('context_menu_disable_vpn'),
        action: async (tab?: browser.Tabs.Tab) => {
            if (tab?.url) {
                await exclusions.disableVpnByUrl(tab.url);
            }
        },
    },
    selective_mode: {
        id: 'selective_mode',
        type: 'radio',
        title: translator.getMessage('context_menu_selective_mode'),
        action: () => exclusions.setMode(ExclusionsModes.Selective, true),
    },
    regular_mode: {
        id: 'regular_mode',
        type: 'radio',
        title: translator.getMessage('context_menu_general_mode'),
        action: () => exclusions.setMode(ExclusionsModes.Regular, true),
    },
    separator: {
        id: nanoid(),
        type: 'separator',
    },
};

const contextMenuClickHandler = (
    info: browser.Menus.OnClickData,
    tab: browser.Tabs.Tab | undefined,
): void => {
    const contextMenu = CONTEXT_MENU_ITEMS[info?.menuItemId];

    if (!contextMenu || !contextMenu.action) {
        return;
    }

    contextMenu.action(tab);
};

const getContextMenuItems = (tabUrl: string | undefined): browser.Menus.CreateCreatePropertiesType[] => {
    if (!tabUrl) {
        return [];
    }

    const resultItems = [];

    if (isHttp(tabUrl)) {
        const vpnSwitcher = exclusions.isVpnEnabledByUrl(tabUrl)
            ? { ...CONTEXT_MENU_ITEMS.disable_vpn }
            : { ...CONTEXT_MENU_ITEMS.enable_vpn };

        resultItems.push(vpnSwitcher);
    }

    const separator = { ...CONTEXT_MENU_ITEMS.separator };
    resultItems.push(separator);

    const regularModeItem: browser.Menus.CreateCreatePropertiesType = {
        ...CONTEXT_MENU_ITEMS.regular_mode,
    };

    const selectiveModeItem: browser.Menus.CreateCreatePropertiesType = {
        ...CONTEXT_MENU_ITEMS.selective_mode,
    };

    if (exclusions.isInverted()) {
        selectiveModeItem.checked = true;
    } else {
        regularModeItem.checked = true;
    }

    resultItems.push(regularModeItem, selectiveModeItem);

    return resultItems;
};

const updateContextMenu = async (tab: { url?: string }): Promise<void> => {
    if (!settings.isContextMenuEnabled()) {
        await clearContextMenuItems();
        return;
    }
    const menuItems = getContextMenuItems(tab.url);
    await renewContextMenuItems(menuItems);
};

const init = (): void => {
    const throttleTimeoutMs = 100;
    const throttledUpdater = throttle(updateContextMenu, throttleTimeoutMs);

    browser.contextMenus.onClicked.addListener(contextMenuClickHandler);

    notifier.addSpecifiedListener(notifier.types.TAB_UPDATED, throttledUpdater);
    notifier.addSpecifiedListener(notifier.types.TAB_ACTIVATED, throttledUpdater);

    // actualize context menu on exclusions update
    notifier.addSpecifiedListener(notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE, async () => {
        const tab = await tabs.getCurrent();
        throttledUpdater(tab);
    });
};

export const contextMenu: ContextMenuInterface = {
    init,
};
