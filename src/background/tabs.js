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
}

const tabs = new Tabs();

export default tabs;
