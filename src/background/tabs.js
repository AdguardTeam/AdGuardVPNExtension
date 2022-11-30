/* global chrome */

import { PASSWORD_RECOVERY_URL } from './config';
import { notifier } from '../lib/notifier';
import { log } from '../lib/logger';

class Tabs {
    constructor() {
        chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' || changeInfo.status === 'loading') {
                if (tab && tab.active) {
                    notifier.notifyListeners(notifier.types.TAB_UPDATED, this.prepareTab(tab));
                }
            }
        });

        chrome.tabs.onActivated.addListener(async ({ tabId }) => {
            let tab;
            try {
                tab = await chrome.tabs.get(tabId);
            } catch (e) {
                return; // ignore errors happening when we try to get removed tabs
            }
            if (tab && tab.active) {
                notifier.notifyListeners(notifier.types.TAB_ACTIVATED, this.prepareTab(tab));
            }
        });

        // notify listeners when tab activated from another window
        chrome.windows.onFocusChanged.addListener(async (windowId) => {
            if (windowId === chrome.windows.WINDOW_ID_NONE) {
                return;
            }
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                notifier.notifyListeners(notifier.types.TAB_ACTIVATED, this.prepareTab(tab));
            }
        });
    }

    /**
     * Converts chrome tab info into simplified presentation of tab
     * @param tab
     * @returns {{id: number, url: string}}
     */
    prepareTab = (tab) => {
        const { id, url } = tab;
        return { id, url };
    };

    async getCurrent() {
        const { id: windowId } = await chrome.windows.getCurrent();
        const tabs = await chrome.tabs.query({ active: true, windowId });
        return tabs[0];
    }

    async getActive() {
        const tabs = await chrome.tabs.query({ active: true });
        return tabs.map(this.prepareTab);
    }

    async openRecovery() {
        return chrome.tabs.create({ url: PASSWORD_RECOVERY_URL });
    }

    async openTab(url) {
        await chrome.tabs.create({ url, active: true });
    }

    /**
     * Closes one or more tabs.
     * @param {(number|number[])} tabsIds
     * @returns {Promise<void>}
     */
    async closeTab(tabsIds) {
        await chrome.tabs.remove(tabsIds);
    }

    async openSocialAuthTab(authUrl) {
        await this.openTab(authUrl);
    }

    async reload(tabId) {
        try {
            await chrome.tabs.reload(tabId);
        } catch (e) {
            log.error(e.message);
        }
    }

    async getTabByUrl(url) {
        const tabs = await chrome.tabs.query({});
        return tabs.find((tab) => tab.url?.includes(url));
    }

    async update(tabId, url) {
        try {
            await chrome.tabs.update(tabId, { url, active: true });
        } catch (e) {
            log.error(e.message);
        }
    }
}

const tabs = new Tabs();

export default tabs;
