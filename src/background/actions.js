import browser from 'webextension-polyfill';
import { Prefs } from './prefs';

const openOptionsPage = async () => {
    return browser.runtime.openOptionsPage();
};

const setIconEnabled = async () => {
    return browser.browserAction.setIcon({ path: Prefs.ICONS.GREEN });
};

const setIconDisabled = async () => {
    return browser.browserAction.setIcon({ path: Prefs.ICONS.GREY });
};

const actions = {
    openOptionsPage,
    setIconEnabled,
    setIconDisabled,
};

export default actions;
