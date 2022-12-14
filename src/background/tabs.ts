import browser from 'webextension-polyfill';
import { PASSWORD_RECOVERY_URL } from './config';
import { notifier } from '../lib/notifier';
import { log } from '../lib/logger';

type Tab = browser.Tabs.Tab;
type SimpleTab = Pick<Tab, 'id' | 'url'>;

class Tabs {
    constructor() {
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
     * Converts chrome tab info into simplified presentation of tab
     * @param tab
     */
    prepareTab = (tab: Tab): SimpleTab => {
        const { id, url } = tab;
        return { id, url };
    };

    async getCurrent() {
        const { id: windowId } = await browser.windows.getCurrent();
        const tabs = await browser.tabs.query({ active: true, windowId });
        return tabs[0];
    }

    async getActive() {
        const tabs = await browser.tabs.query({ active: true });
        return tabs.map(this.prepareTab);
    }

    async openRecovery() {
        return browser.tabs.create({ url: PASSWORD_RECOVERY_URL });
    }

    async openTab(url: string) {
        return browser.tabs.create({ url, active: true });
    }

    /**
     * Closes one or more tabs.
     * @param tabsIds
     */
    async closeTab(tabsIds: number | number[]): Promise<void> {
        await browser.tabs.remove(tabsIds);
    }

    async openSocialAuthTab(authUrl: string) {
        await this.openTab(authUrl);
    }

    async reload(tabId: number) {
        try {
            await browser.tabs.reload(tabId);
        } catch (e: any) {
            log.error(e.message);
        }
    }

    async getTabByUrl(url: string) {
        const tabs = await browser.tabs.query({});
        return tabs.find((tab) => tab.url?.includes(url));
    }

    async update(tabId: number, url: string) {
        try {
            await browser.tabs.update(tabId, { url, active: true });
        } catch (e: any) {
            log.error(e.message);
        }
    }
}

export const tabs = new Tabs();
