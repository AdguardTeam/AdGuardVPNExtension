import browser from 'webextension-polyfill';

import { notifier } from '../lib/notifier';
import { log } from '../lib/logger';

import { PASSWORD_RECOVERY_URL } from './config';

export type PreparedTab = {
    id?: number,
    url?: string,
};

interface TabsInterface {
    init(): void;
    getCurrent(): Promise<browser.Tabs.Tab>;
    getActive(): Promise<PreparedTab[]>;
    openRecovery(): Promise<browser.Tabs.Tab>;
    openTab(url: string): Promise<browser.Tabs.Tab>;
    closeTab(tabsIds: number[] | number): Promise<void>;
    openSocialAuthTab(authUrl: string): Promise<void>;
    reload(tabId: number): Promise<void>;
    getTabByUrl(url: string): Promise<browser.Tabs.Tab | undefined>;
    update(tabId: number, url: string): Promise<void>;
    redirectCurrentTab(url: string): Promise<void>;
}

class Tabs implements TabsInterface {
    init(): void {
        browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' || changeInfo.status === 'loading') {
                if (tab && tab.active) {
                    notifier.notifyListeners(notifier.types.TAB_UPDATED, this.prepareTab(tab));
                }
            }
        });

        browser.tabs.onActivated.addListener(async ({ tabId }) => {
            let tab;
            try {
                tab = await browser.tabs.get(tabId);
            } catch (e) {
                return; // ignore errors happening when we try to get removed tabs
            }
            if (tab && tab.active) {
                notifier.notifyListeners(notifier.types.TAB_ACTIVATED, this.prepareTab(tab));
            }
        });

        // notify listeners when tab activated from another window
        browser.windows.onFocusChanged.addListener(async (windowId) => {
            if (windowId === browser.windows.WINDOW_ID_NONE) {
                return;
            }
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                notifier.notifyListeners(notifier.types.TAB_ACTIVATED, this.prepareTab(tab));
            }
        });
    }

    /**
     * Converts browser tab info into simplified presentation of tab
     * @param tab
     */
    prepareTab = (tab: browser.Tabs.Tab): PreparedTab => {
        const { id, url } = tab;
        return { id, url };
    };

    async getCurrent(): Promise<browser.Tabs.Tab> {
        const { id: windowId } = await browser.windows.getCurrent();
        const tabs = await browser.tabs.query({ active: true, windowId });
        return tabs[0];
    }

    async getActive(): Promise<PreparedTab[]> {
        const tabs = await browser.tabs.query({ active: true });
        return tabs.map(this.prepareTab);
    }

    async openRecovery(): Promise<browser.Tabs.Tab> {
        return browser.tabs.create({ url: PASSWORD_RECOVERY_URL });
    }

    async openTab(url: string): Promise<browser.Tabs.Tab> {
        return browser.tabs.create({ url, active: true });
    }

    /**
     * Closes one or more tabs.
     * @param tabsIds
     */
    async closeTab(tabsIds: number[] | number): Promise<void> {
        await browser.tabs.remove(tabsIds);
    }

    async openSocialAuthTab(authUrl: string): Promise<void> {
        await this.openTab(authUrl);
    }

    async reload(tabId: number): Promise<void> {
        try {
            await browser.tabs.reload(tabId);
        } catch (e) {
            log.error(e.message);
        }
    }

    async getTabByUrl(url: string): Promise<browser.Tabs.Tab | undefined> {
        const tabs = await browser.tabs.query({});
        return tabs.find((tab) => tab.url?.includes(url));
    }

    async update(tabId: number, url: string): Promise<void> {
        try {
            await browser.tabs.update(tabId, { url, active: true });
        } catch (e) {
            log.error(e.message);
        }
    }

    /**
     * Redirects current tab to the given url.
     * @param url
     */
    async redirectCurrentTab(url: string): Promise<void> {
        const tab = await this.getCurrent();
        await this.update(tab.id!, url);
    }
}

export const tabs = new Tabs();
