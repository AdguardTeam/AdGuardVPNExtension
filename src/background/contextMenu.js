import browser from 'webextension-polyfill';
import throttle from 'lodash/throttle';
import notifier from '../lib/notifier';
import exclusions from './exclusions';
import tabs from './tabs';
import translator from '../lib/translator';

const renewContextMenuItems = async (menuItems) => {
    await browser.contextMenus.removeAll();
    menuItems.forEach((itemOptions) => {
        browser.contextMenus.create({ contexts: ['all'], ...itemOptions });
    });
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
};

const getContextMenuItems = (tabUrl) => {
    if (!tabUrl) {
        return [];
    }

    let vpnSwitcher;

    if (exclusions.isVpnEnabledByUrl(tabUrl)) {
        vpnSwitcher = CONTEXT_MENU_ITEMS.disable_vpn;
        vpnSwitcher.onclick = () => exclusions.disableVpnByUrl(tabUrl);
    } else {
        vpnSwitcher = CONTEXT_MENU_ITEMS.enable_vpn;
        vpnSwitcher.onclick = () => exclusions.enableVpnByUrl(tabUrl);
    }

    return [vpnSwitcher];
};

const updateContextMenu = async (tabUrl) => {
    const menuItems = getContextMenuItems(tabUrl);
    await renewContextMenuItems(menuItems);
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
