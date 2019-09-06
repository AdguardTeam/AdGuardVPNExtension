import browser from 'webextension-polyfill';
import { PASSWORD_RECOVERY_URL } from './config';

class Tabs {
    async getCurrent() {
        const { id: windowId } = await browser.windows.getCurrent();
        const tabs = await browser.tabs.query({ active: true, windowId });
        return tabs[0];
    }

    async getPopup() {
        return browser.browserAction.getPopup();
    }

    // TODO [maximtop] change when get recovery url
    async openRecovery() {
        await browser.tabs.create({ url: PASSWORD_RECOVERY_URL });
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

    async closePopup() {
        const popup = await this.getPopup();
        popup.close();
    }

    async openSocialAuthTab(authUrl) {
        await this.openTab(authUrl);
    }

    async getAllTabs() {
        return browser.tabs.query({});
    }

    onCreated(callback) {
        browser.tabs.onCreated.addListener(callback);
    }

    onRemoved(callback) {
        browser.tabs.onRemoved.addListener(callback);
    }

    onUpdated(callback) {
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            callback(tab, changeInfo);
        });
    }
}

const tabs = new Tabs();

export default tabs;
