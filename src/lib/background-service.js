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

const background = {
    getSettingsModule,
    getActionsModule,
};

export default background;
