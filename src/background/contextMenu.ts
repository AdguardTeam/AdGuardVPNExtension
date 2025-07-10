import browser from 'webextension-polyfill';
import throttle from 'lodash/throttle';
import { defaults } from 'lodash';

import { notifier } from '../common/notifier';
import { translator } from '../common/translator';
import { isHttp } from '../common/utils/string';
import { log } from '../common/logger';
import { ExclusionsMode } from '../common/exclusionsConstants';
import { SETTINGS_IDS } from '../common/constants';

import { exclusions } from './exclusions';
import { tabs } from './tabs';
import { settings } from './settings';
import { actions } from './actions';

type ContextType = browser.Menus.ContextType;
type CreateCreatePropertiesType = browser.Menus.CreateCreatePropertiesType;

interface ContextMenuItem extends browser.Menus.CreateCreatePropertiesType {
    action?: (tab?: browser.Tabs.Tab) => Promise<void> | void;
}

interface ContextMenuItems {
    [key: string]: ContextMenuItem;
}

interface ContextMenuInterface {
    init(): void;
    updateBrowserActionItems(): Promise<void>;
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
        type: 'radio',
        title: translator.getMessage('context_menu_selective_mode'),
        action: () => exclusions.setMode(ExclusionsMode.Selective, true),
    },
    regular_mode: {
        id: 'regular_mode',
        type: 'radio',
        title: translator.getMessage('context_menu_general_mode'),
        action: () => exclusions.setMode(ExclusionsMode.Regular, true),
    },
    separator: {
        id: 'separator',
        type: 'separator',
    },
};

/**
 * This item is used separately because we need it to be always visible, even if extension is not working
 */
const BROWSER_ACTION_ITEMS: ContextMenuItems = {
    export_logs: {
        id: 'export_logs',
        title: translator.getMessage('context_menu_export_logs'),
        action: async () => {
            try {
                await actions.openExportLogsPage();
            } catch (e) {
                log.debug(e.message);
            }
        },
    },
    debug_level: {
        id: 'debug_level',
        title: translator.getMessage('context_menu_debug_level'),
        action: async () => {
            await settings.setSetting(
                SETTINGS_IDS.DEBUG_MODE_ENABLED,
                !settings.getSetting(SETTINGS_IDS.DEBUG_MODE_ENABLED),
            );
        },
        type: 'checkbox',
        checked: true,
    },
};

const contextMenuClickHandler = (
    info: browser.Menus.OnClickData,
    tab: browser.Tabs.Tab | undefined,
): void => {
    const contextMenuItem = CONTEXT_MENU_ITEMS[info?.menuItemId]
        || BROWSER_ACTION_ITEMS[info?.menuItemId];

    if (!contextMenuItem || !contextMenuItem.action) {
        return;
    }

    contextMenuItem.action(tab);
};

const removeContextMenuItem = async (id?: string) => {
    try {
        if (id) {
            await browser.contextMenus.remove(id);
        }
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
                    log.debug(browser.runtime.lastError.message);
                }
            });
        } catch (e) {
            log.debug(e);
        }
    }));
};

/**
 * Retrieves context menu items based on the given tab URL.
 *
 * @param tabUrl The URL of the tab for which context menu items are to be generated.
 *
 * @returns A promise that resolves to an array of context menu items.
 */
const getContextMenuItems = async (tabUrl: string | undefined): Promise<CreateCreatePropertiesType[]> => {
    if (!tabUrl) {
        return [];
    }

    const resultItems = [];

    if (isHttp(tabUrl)) {
        const isVpnEnabledByUrl = await exclusions.isVpnEnabledByUrl(tabUrl);
        const vpnSwitcher = isVpnEnabledByUrl
            ? { ...CONTEXT_MENU_ITEMS.disable_vpn }
            : { ...CONTEXT_MENU_ITEMS.enable_vpn };

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

    if (await exclusions.isInverted()) {
        selectiveModeItem.checked = true;
    } else {
        regularModeItem.checked = true;
    }

    resultItems.push(regularModeItem, selectiveModeItem);

    return resultItems;
};

/**
 * Updates the context menu items for the given tab.
 *
 * @param tab The tab for which the context menu items should be updated.
 */
const updateContextMenu = async (tab: { url?: string }): Promise<void> => {
    if (!settings.isContextMenuEnabled()) {
        await clearContextMenuItems();
        return;
    }
    const menuItems = await getContextMenuItems(tab.url);
    await renewContextMenuItems(menuItems);
};

/**
 * Adds context menu items to the browser action item
 *
 * @param item Context menu item to be added
 */
const addBrowserActionItem = async (item: ContextMenuItem): Promise<void> => {
    const props: browser.Menus.CreateCreatePropertiesType = {
        id: item.id,
        title: item.title,
        checked: item.checked,
        type: item.type,
        contexts: ['action'],
    };

    try {
        await browser.contextMenus.create(props, () => {
            if (browser.runtime.lastError) {
                log.debug(browser.runtime.lastError.message);
            }
        });
    } catch (e) {
        log.debug(`Error while adding browser action item with id: ${item.id} to context menu, ${e}`);
    }
};

/**
 * Retrieves the list of browser action items.
 *
 * The 'debug_level' item's checked status is determined by the current debug mode setting.
 *
 * @returns An array of browser action items.
 */
const getBrowserActionItems = (): ContextMenuItem[] => {
    const result: ContextMenuItem[] = [];
    result.push(BROWSER_ACTION_ITEMS.export_logs);

    const debugLevelItem = BROWSER_ACTION_ITEMS.debug_level;
    debugLevelItem.checked = settings.isDebugModeEnabled();
    result.push(debugLevelItem);

    return result;
};

/**
 * Updates browser action items
 */
const updateBrowserActionItems = async (): Promise<void> => {
    try {
        await Promise.all(Object.values(BROWSER_ACTION_ITEMS).map((item) => {
            return removeContextMenuItem(item.id);
        }));

        const browserActionItems = getBrowserActionItems();
        await Promise.all(browserActionItems.map((item) => {
            return addBrowserActionItem(item);
        }));
    } catch (e) {
        log.debug(e);
    }
};

const init = (): void => {
    const throttleTimeoutMs = 100;
    const throttledUpdater = throttle(updateContextMenu, throttleTimeoutMs);

    // we don't need to await this call, because init function is called synchronously
    updateBrowserActionItems();

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
    // exported externally because it depends on the settings, we should update this setting after settings module
    // initiates
    updateBrowserActionItems,
};
