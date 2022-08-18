import browser from 'webextension-polyfill';

import { Prefs, BROWSER_NAMES } from './prefs';
import { log } from '../lib/logger';
import { promoNotifications } from './promoNotifications';
import credentials from './credentials';
import { UPGRADE_LICENSE_URL } from './config';
import tabs from './tabs';
import { FREE_GBS_ANCHOR } from '../lib/constants';

/**
 * Opens options tab with anchor if provided
 * @param {string | null} anchor
 * @return {Promise<void>}
 */
const openOptionsPage = async (anchor = null) => {
    const optionsUrl = browser.runtime.getURL('options.html');
    const targetUrl = `${optionsUrl}${anchor || ''}`;

    if (Prefs.browser === BROWSER_NAMES.FIREFOX) {
        // runtime.openOptionsPage() sometimes causes issue with multiple
        // options tabs in Firefox, so tabs.query() is used to find options tab by url
        const optionsTab = await tabs.getTabByUrl(optionsUrl);
        if (optionsTab) {
            await tabs.update(optionsTab.id, targetUrl);
        } else {
            await tabs.openTab(targetUrl);
        }
    } else {
        // runtime.openOptionsPage() could be used properly in other browsers
        await browser.runtime.openOptionsPage();
        const optionsTab = tabs.getActive();
        await tabs.update(optionsTab.id, targetUrl);
    }
};

const setIcon = async (details) => {
    try {
        await browser.browserAction.setIcon(details);
    } catch (e) {
        log.debug(e.message);
    }
};

const BADGE_COLOR = '#74a352';

const setBadge = async (details) => {
    try {
        await browser.browserAction.setBadgeText(details);
        const { tabId } = details;

        await browser.browserAction.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR });
    } catch (e) {
        log.debug(e.message);
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
    const promoNotification = await promoNotifications.getCurrentNotification();

    if (promoNotification) {
        details.path = promoNotification.icons.ENABLED;
    }

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

    const promoNotification = await promoNotifications.getCurrentNotification();

    if (promoNotification) {
        details.path = promoNotification.icons.DISABLED;
    }

    await setIcon(details);
    if (tabId) {
        details.tabId = tabId;
        await setIcon(details);
    }
};

/**
 * Sets browser action icon when traffic is off
 * @param tabId
 * @returns {Promise<void>}
 */
const setIconTrafficOff = async (tabId) => {
    const details = { path: Prefs.ICONS.TRAFFIC_OFF };
    await setIcon(details);
    if (tabId) {
        details.tabId = tabId;
        await setIcon(details);
    }
};

const setBadgeText = async (tabId, text) => {
    const details = { text };

    await setBadge(details);
    if (tabId) {
        details.tabId = tabId;
        await setBadge(details);
    }
};

const clearBadgeText = async (tabId) => {
    const details = { text: '' };

    await setBadge(details);
    if (tabId) {
        details.tabId = tabId;
        await setBadge(details);
    }
};

/**
 * Generates Premium Promo Page url with user email in parameter (if authenticated)
 * @returns {string}
 */
const getPremiumPromoPageUrl = async () => {
    const username = await credentials.getUsername();
    return `${UPGRADE_LICENSE_URL}${username ? `&email=${encodeURIComponent(username)}` : ''}`;
};

/**
 * Opens Premium Promo Page in new tab
 */
const openPremiumPromoPage = async () => {
    const url = await getPremiumPromoPageUrl();
    await tabs.openTab(url);
};

/**
 * Opens Options page on Referral Program section
 */
const openFreeGbsPage = async () => {
    await openOptionsPage(`#${FREE_GBS_ANCHOR}`);
};

const actions = {
    openOptionsPage,
    setIconEnabled,
    setIconDisabled,
    setIconTrafficOff,
    setBadgeText,
    clearBadgeText,
    getPremiumPromoPageUrl,
    openPremiumPromoPage,
    openFreeGbsPage,
};

export default actions;
