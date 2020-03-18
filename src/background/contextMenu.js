import browser from 'webextension-polyfill';
import throttle from 'lodash/throttle';
import notifier from '../lib/notifier';
import exclusions from './exclusions';
import tabs from './tabs';
import translator from '../lib/translator';
import settings from './settings/settings';

// All contexts except "browser_action", "page_action" and "launcher"
const contexts = ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio'];

const renewContextMenuItems = async (menuItems) => {
    await browser.contextMenus.removeAll();
    // eslint-disable-next-line no-restricted-syntax
    for (const itemOptions of menuItems) {
        // eslint-disable-next-line no-await-in-loop
        await browser.contextMenus.create({ contexts, ...itemOptions });
    }
};

const clearContextMenuItems = async () => {
    await browser.contextMenus.removeAll();
};

const CONTEXT_MENU_ITEMS = {
    enable_vpn: {
        id: 'enable_vpn',
        title: translator.translate('context_menu_enable_vpn'),
    },
    disable_vpn: {
        id: 'disable_vpn',
        title: translator.translate('context_menu_disable_vpn'),
    },
    selective_mode: {
        id: 'selective_mode',
        type: 'radio',
        title: translator.translate('context_menu_selective_mode'),
        onclick: () => exclusions.setCurrentHandler(exclusions.TYPES.WHITELIST),
    },
    regular_mode: {
        id: 'regular_mode',
        type: 'radio',
        title: translator.translate('context_menu_regular_mode'),
        onclick: () => exclusions.setCurrentHandler(exclusions.TYPES.BLACKLIST),
    },
};

const getContextMenuItems = (tabUrl) => {
    if (!tabUrl) {
        return [];
    }

    let vpnSwitcher;

    if (exclusions.isVpnEnabledByUrl(tabUrl)) {
        vpnSwitcher = { ...CONTEXT_MENU_ITEMS.disable_vpn };
        vpnSwitcher.onclick = () => exclusions.disableVpnByUrl(tabUrl);
    } else {
        vpnSwitcher = { ...CONTEXT_MENU_ITEMS.enable_vpn };
        vpnSwitcher.onclick = () => exclusions.enableVpnByUrl(tabUrl);
    }

    const regularModeItem = {
        ...CONTEXT_MENU_ITEMS.regular_mode,
    };

    const selectiveModeItem = {
        ...CONTEXT_MENU_ITEMS.selective_mode,
    };

    if (exclusions.isInverted()) {
        selectiveModeItem.checked = true;
    } else {
        regularModeItem.checked = true;
    }

    return [vpnSwitcher, regularModeItem, selectiveModeItem];
};

const updateContextMenu = async (tabUrl) => {
    if (settings.isContextMenuEnabled()) {
        const menuItems = getContextMenuItems(tabUrl);
        await renewContextMenuItems(menuItems);
    } else {
        await clearContextMenuItems();
    }
};

const init = async () => {
    const throttleTimeoutMs = 100;
    const throttledUpdater = throttle(updateContextMenu, throttleTimeoutMs);

    notifier.addSpecifiedListener(notifier.types.TAB_UPDATED, throttledUpdater);
    notifier.addSpecifiedListener(notifier.types.TAB_ACTIVATED, throttledUpdater);

    // actualize context menu on exclusions update
    notifier.addSpecifiedListener(notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE, async () => {
        const tab = await tabs.getCurrent();
        throttledUpdater(tab.url);
    });
};

const contextMenu = {
    init,
};

export default contextMenu;
