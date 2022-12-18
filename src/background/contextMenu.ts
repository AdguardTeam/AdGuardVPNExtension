import browser from 'webextension-polyfill';
import throttle from 'lodash/throttle';
import { nanoid } from 'nanoid';
import { defaults } from 'lodash';

import { notifier } from '../lib/notifier';
import { exclusions } from './exclusions';
import { tabs } from './tabs';
import { translator } from '../common/translator';
import { settings } from './settings';
import { isHttp } from '../lib/string-utils';
import { log } from '../lib/logger';
import { ExclusionsModes } from '../common/exclusionsConstants';
import { actions } from './actions';

type ItemType = browser.Menus.ItemType;
type ContextType = browser.Menus.ContextType;
type CreateCreatePropertiesType = browser.Menus.CreateCreatePropertiesType;

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
const contexts: ContextType[] = ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio'];

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
        type: 'radio' as ItemType,
        title: translator.getMessage('context_menu_selective_mode'),
        action: () => exclusions.setMode(ExclusionsModes.Selective, true),
    },
    regular_mode: {
        id: 'regular_mode',
        type: 'radio' as ItemType,
        title: translator.getMessage('context_menu_general_mode'),
        action: () => exclusions.setMode(ExclusionsModes.Regular, true),
    },
    separator: {
        id: 'separator',
        type: 'separator' as ItemType,
    },
};

/**
 * This item is used separately because we need it to be always visible, even if extension is not working
 */
const BROWSER_ACTION_ITEMS = {
    export_logs: {
        id: 'export_logs',
        title: translator.getMessage('context_menu_export_logs'),
        onclick: async () => {
            try {
                await actions.openExportLogsPage();
            } catch (e: any) {
                log.debug(e.message);
            }
        },
    },
};

const removeContextMenuItem = async (id: string) => {
    try {
        await browser.contextMenus.remove(id);
    } catch (e) {
        // ignore, this error is not critical and can fire every time when we try to remove non-existing item
    }
};

/**
 * Clears all context menu items except browser action items
 */
const clearContextMenuItems = async (): Promise<void> => {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of Object.values(CONTEXT_MENU_ITEMS)) {
        // eslint-disable-next-line no-await-in-loop
        await removeContextMenuItem(item.id);
    }
};

const renewContextMenuItems = async (menuItems: CreateCreatePropertiesType[]): Promise<void> => {
    await clearContextMenuItems();
    await Promise.all(menuItems.map(async (itemOptions) => {
        try {
            const createProperties = { contexts, ...itemOptions };
            await browser.contextMenus.create(createProperties, () => {
                if (browser.runtime.lastError) {
                    log.debug(browser.runtime.lastError.message);
                }
            });
        } catch (e) {
            log.debug(e);
        }
    }));
};

const getContextMenuItems = (tabUrl: string | undefined): CreateCreatePropertiesType[] => {
    if (!tabUrl) {
        return [];
    }

    const resultItems = [];

    if (isHttp(tabUrl)) {
        let vpnSwitcher: CreateCreatePropertiesType;
        if (exclusions.isVpnEnabledByUrl(tabUrl)) {
            vpnSwitcher = { ...CONTEXT_MENU_ITEMS.disable_vpn };
            vpnSwitcher.onclick = () => exclusions.disableVpnByUrl(tabUrl);
        } else {
            vpnSwitcher = { ...CONTEXT_MENU_ITEMS.enable_vpn };
            vpnSwitcher.onclick = () => exclusions.enableVpnByUrl(tabUrl);
        }
        resultItems.push(vpnSwitcher);
    }

    const separator = { ...CONTEXT_MENU_ITEMS.separator };
    resultItems.push(separator);

    const regularModeItem: CreateCreatePropertiesType = {
        ...CONTEXT_MENU_ITEMS.regular_mode,
    };

    const selectiveModeItem: CreateCreatePropertiesType = {
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

/**
 * Adds browser action items
 */
const addBrowserActionItems = async (): Promise<void> => {
    const exportLogsItem = BROWSER_ACTION_ITEMS.export_logs;

    try {
        await removeContextMenuItem(exportLogsItem.id);
        await browser.contextMenus.create({
            contexts: ['browser_action'],
            ...exportLogsItem,
        }, () => {
            if (browser.runtime.lastError) {
                log.debug(browser.runtime.lastError.message);
            }
        });
    } catch (e) {
        log.debug(e);
    }
};

const init = (): void => {
    const throttleTimeoutMs = 100;
    const throttledUpdater = throttle(updateContextMenu, throttleTimeoutMs);

    addBrowserActionItems();

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
