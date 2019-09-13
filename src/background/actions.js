import browser from 'webextension-polyfill';
import { Prefs } from './prefs';

const openOptionsPage = async () => {
    await browser.runtime.openOptionsPage();
};

const setIconEnabled = async () => {
    browser.browserAction.setIcon({ path: Prefs.ICONS.GREEN });
};

const setIconDisabled = () => {
    browser.browserAction.setIcon({ path: Prefs.ICONS.GREY });
};

const actions = {
    openOptionsPage,
    setIconEnabled,
    setIconDisabled,
};

export default actions;
