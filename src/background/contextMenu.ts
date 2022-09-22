import browser, { Menus } from 'webextension-polyfill';
import throttle from 'lodash/throttle';

import notifier from '../lib/notifier';
import { exclusions } from './exclusions';
import tabs from './tabs';
import { translator } from '../common/translator';
import { settings } from './settings';
import { isHttp } from '../lib/string-utils';
import { log } from '../lib/logger';
import { ExclusionsModes } from '../common/exclusionsConstants';

interface ContextMenuInterface {
    init(): void;
}

// All contexts except "browser_action", "page_action" and "launcher"
const contexts: Menus.ContextType[] = ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio'];

const renewContextMenuItems = async (
    menuItems: Menus.CreateCreatePropertiesType[],
): Promise<void> => {
    await browser.contextMenus.removeAll();
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

const clearContextMenuItems = async (): Promise<void> => {
    await browser.contextMenus.removeAll();
};

const CONTEXT_MENU_ITEMS = {
    enable_vpn: {
        id: 'enable_vpn',
        title: translator.getMessage('context_menu_enable_vpn'),
    },
    disable_vpn: {
        id: 'disable_vpn',
        title: translator.getMessage('context_menu_disable_vpn'),
    },
    selective_mode: {
        id: 'selective_mode',
        type: 'radio' as Menus.ItemType,
        title: translator.getMessage('context_menu_selective_mode'),
        onclick: () => exclusions.setMode(ExclusionsModes.Selective, true),
    },
    regular_mode: {
        id: 'regular_mode',
        type: 'radio' as Menus.ItemType,
        title: translator.getMessage('context_menu_general_mode'),
        onclick: () => exclusions.setMode(ExclusionsModes.Regular, true),
    },
    separator: {
        id: 'separator',
        type: 'separator' as Menus.ItemType,
    },
};

const getContextMenuItems = (tabUrl: string | undefined): Menus.CreateCreatePropertiesType[] => {
    if (!tabUrl) {
        return [];
    }

    const resultItems = [];

    if (isHttp(tabUrl)) {
        let vpnSwitcher: Menus.CreateCreatePropertiesType;
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

    const regularModeItem: Menus.CreateCreatePropertiesType = {
        ...CONTEXT_MENU_ITEMS.regular_mode,
    };

    const selectiveModeItem: Menus.CreateCreatePropertiesType = {
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
