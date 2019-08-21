import browser from 'webextension-polyfill';

class Tabs {
    async getCurrent() {
        const { id: windowId } = await browser.windows.getLastFocused({});
        const tabs = await browser.tabs.query({ active: true, windowId });
        return tabs[0];
    }

    async getCurrentTabUrl() {
        const tab = await this.getCurrent();
        return tab.url;
    }

    async getPopup() {
        return browser.browserAction.getPopup();
    }

    // TODO [maximtop] change when get recovery url
    async openRecovery() {
        const recoveryUrl = 'http://example.org#recovery';
        await browser.tabs.create({ url: recoveryUrl });
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
        const tabs = await browser.tabs.query({});
        return tabs;
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
