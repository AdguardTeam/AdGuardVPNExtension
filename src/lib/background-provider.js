import browser from 'webextension-polyfill';

const asyncProvideBg = func => async (...args) => {
    const { background } = await browser.runtime.getBackgroundPage();
    return func(...args, background);
};

const provider = {
    getEndpoints: asyncProvideBg(background => background.provider.getEndpoints()),
};

const settings = {
    getSetting: asyncProvideBg((id, background) => background.settings.getSetting(id)),
    setSetting: asyncProvideBg(
        (id, value, background) => background.settings.setSetting(id, value)
    ),
};

const proxy = {
    canControlProxy: asyncProvideBg(background => background.proxy.canControlProxy()),
};

const whitelist = {
    addToWhitelist: asyncProvideBg(
        (url, background) => background.whitelist.addToWhitelist(url)
    ),
    removeFromWhitelist: asyncProvideBg(
        (url, background) => background.whitelist.removeFromWhitelist(url)
    ),
    isWhitelisted: asyncProvideBg(
        (url, background) => background.whitelist.isWhitelisted(url)
    ),
};

const tabs = {
    getCurrentTabUrl: asyncProvideBg(background => background.tabs.getCurrentTabUrl()),
};

const actions = {
    openOptionsPage: asyncProvideBg(background => background.actions.openOptionsPage()),
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
