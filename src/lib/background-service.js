import browser from 'webextension-polyfill';

const getBackgroundContext = async () => {
    const backgroundWindow = await browser.runtime.getBackgroundPage();
    return backgroundWindow.background;
};

const getSettings = async () => {
    const backgroundContext = await getBackgroundContext();
    return backgroundContext.settings;
};

const background = {
    getSettings,
};

export default background;
