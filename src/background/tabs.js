import browser from 'webextension-polyfill';
import { PASSWORD_RECOVERY_URL } from './config';

class Tabs {
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
