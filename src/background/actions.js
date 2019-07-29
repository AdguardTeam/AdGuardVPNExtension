import browser from 'webextension-polyfill';

const openOptionsPage = async () => {
    await browser.runtime.openOptionsPage();
};

const actions = {
    openOptionsPage,
};

export default actions;
