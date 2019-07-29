import browser from 'webextension-polyfill';

const getBackgroundContext = async () => {
    const backgroundWindow = await browser.runtime.getBackgroundPage();
    return backgroundWindow.background;
};

const getSettingsModule = async () => {
    const backgroundContext = await getBackgroundContext();
    return backgroundContext.settings;
};

const background = {
    getSettingsModule,
};

export default background;
