import browser from 'webextension-polyfill';
import { Prefs } from './prefs';

const openOptionsPage = async () => {
    return browser.runtime.openOptionsPage();
};

const setIcon = async (details) => {
    try {
        await browser.browserAction.setIcon(details);
    } catch (e) {
        // ignore errors occurring if we try set icon for removed tabs
    }
};

/**
 * Sets icon enabled. In order to remove blinking we set icon twice:
 * 1. for general browser action
 * 2. for tab browser action if tabId is provided
 * @param tabId
 * @returns {Promise<void>}
 */
const setIconEnabled = async (tabId) => {
    const details = { path: Prefs.ICONS.ENABLED };
    await setIcon(details);
    if (tabId) {
        details.tabId = tabId;
        await setIcon(details);
    }
};

/**
 * Sets browser cation icon disabled. In order to remove blinking we set icon twice:
 * 1. for general browser action
 * 2. for tab browser action if tabId is provided
 * @param {number|null} tabId
 * @returns {Promise<void>}
 */
const setIconDisabled = async (tabId) => {
    const details = { path: Prefs.ICONS.DISABLED };
    await setIcon(details);
    if (tabId) {
        details.tabId = tabId;
        await setIcon(details);
    }
};

/**
 * Sets browser action icon for tabs with excluded url
 * @param tabId
 * @returns {Promise<void>}
 */
const setIconExcludedForUrl = async (tabId) => {
    const details = { path: Prefs.ICONS.DISABLED_FOR_URL };
    if (tabId) {
        details.tabId = tabId;
    } else {
        return;
    }
    await setIcon(details);
};

const actions = {
    openOptionsPage,
    setIconEnabled,
    setIconDisabled,
    setIconExcludedForUrl,
};

export default actions;
