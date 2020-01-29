import browser from 'webextension-polyfill';
import { PASSWORD_RECOVERY_URL } from './config';
import notifier from '../lib/notifier';

class Tabs {
    constructor() {
        browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' || changeInfo.status === 'loading') {
                if (tab && tab.active) {
                    notifier.notifyListeners(notifier.types.TAB_UPDATED, tab.url);
                }
            }
        });

        browser.tabs.onActivated.addListener(async ({ tabId }) => {
            const tab = await browser.tabs.get(tabId);
            if (tab && tab.active) {
                notifier.notifyListeners(notifier.types.TAB_ACTIVATED, tab.url);
            }
        });
    }

    async getCurrent() {
        const { id: windowId } = await browser.windows.getCurrent();
        const tabs = await browser.tabs.query({ active: true, windowId });
        return tabs[0];
    }

    async openRecovery() {
        return browser.tabs.create({ url: PASSWORD_RECOVERY_URL });
    }

    async openTab(url) {
        await browser.tabs.create({ url, active: true });
    }

    /**
     * Closes one or more tabs.
     * @param {(number|number[])} tabsIds
     * @returns {Promise<void>}
     */
    async closeTab(tabsIds) {
        await browser.tabs.remove(tabsIds);
    }

    async openSocialAuthTab(authUrl) {
        await this.openTab(authUrl);
    }
}

const tabs = new Tabs();

export default tabs;
