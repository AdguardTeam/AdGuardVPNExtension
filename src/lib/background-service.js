import browser from 'webextension-polyfill';

const getBackgroundContext = async () => {
    const backgroundWindow = await browser.runtime.getBackgroundPage();
    return backgroundWindow.background;
};

const getSettingsModule = async () => {
    const backgroundContext = await getBackgroundContext();
    return backgroundContext.settings;
};

const getActionsModule = async () => {
    const backgroundContext = await getBackgroundContext();
    return backgroundContext.actions;
};

const getProxyModule = async () => {
    const backgroundContext = await getBackgroundContext();
    return backgroundContext.proxy;
};

const getApiModule = async () => {
    const backgroundContext = await getBackgroundContext();
    return backgroundContext.api;
};

const getProviderModule = async () => {
    const backgroundContext = await getBackgroundContext();
    return backgroundContext.provider;
};

const getWhitelistModule = async () => {
    const backgroundContext = await getBackgroundContext();
    return backgroundContext.whitelist;
};

const getTabsModule = async () => {
    const backgroundContext = await getBackgroundContext();
    return backgroundContext.tabs;
};

const background = {
    getSettingsModule,
    getActionsModule,
    getProxyModule,
    getApiModule,
    getProviderModule,
    getWhitelistModule,
    getTabsModule,
};

export default background;
