import browser from 'webextension-polyfill';

const getBackground = async () => {
    const backgroundWindow = await browser.runtime.getBackgroundPage();
    return backgroundWindow.background;
};

const provider = {
    getEndpoints: async () => {
        const background = await getBackground();
        return background.provider.getEndpoints();
    },
};

const settings = {
    getSetting: async (id) => {
        const background = await getBackground();
        return background.settings.getSetting(id);
    },
    setSetting: async (id, value) => {
        const background = await getBackground();
        return background.settings.setSetting(id, value);
    },
};

const proxy = {
    canControlProxy: async () => {
        const background = await getBackground();
        return background.proxy.canControlProxy();
    },
};

const whitelist = {
    addToWhitelist: async (url) => {
        const background = await getBackground();
        return background.whitelist.addToWhitelist(url);
    },
    removeFromWhitelist: async (url) => {
        const background = await getBackground();
        return background.whitelist.removeFromWhitelist(url);
    },
    isWhitelisted: async (url) => {
        const background = await getBackground();
        return background.whitelist.isWhitelisted(url);
    },
};

const tabs = {
    getCurrentTabUrl: async () => {
        const background = await getBackground();
        return background.tabs.getCurrentTabUrl();
    },
};

const actions = {
    openOptionsPage: async () => {
        const background = await getBackground();
        return background.actions.openOptionsPage();
    },
};

const bgProvider = {
    provider,
    settings,
    proxy,
    whitelist,
    tabs,
    actions,
};

export default bgProvider;
