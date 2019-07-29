import browser from 'webextension-polyfill';

const openOptionsPage = async () => {
    console.log(browser.runtime);
    await browser.runtime.openOptionsPage();
};

const actions = {
    openOptionsPage,
};

export default actions;
