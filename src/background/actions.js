import browser from 'webextension-polyfill';

import { Prefs } from './prefs';
import { log } from '../lib/logger';
import { promoNotifications } from './promoNotifications';
import credentials from './credentials';
import { UPGRADE_LICENSE_URL } from './config';
import tabs from './tabs';
import { FREE_GBS_ANCHOR, SETTINGS_IDS, THEME_URL_PARAMETER } from '../lib/constants';
import { settings } from './settings';

/**
 * Opens options tab with anchor if provided
 * @param {string | null} anchorName
 * @return {Promise<void>}
 */
const openOptionsPage = async (anchorName = null) => {
    const manifest = browser.runtime.getManifest();
    let optionsUrl = manifest.options_ui?.page || manifest.options_page;
    if (!optionsUrl.includes('://')) {
        optionsUrl = browser.runtime.getURL(optionsUrl);
    }

    const theme = settings.getSetting(SETTINGS_IDS.APPEARANCE_THEME);
    const anchor = anchorName ? `#${anchorName}` : '';
    const targetUrl = `${optionsUrl}?${THEME_URL_PARAMETER}=${theme}${anchor}`;

    // there is the bug with chrome.runtime.openOptionsPage() method
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1369940
    // we use temporary solution to open а single options page
    const view = browser.extension.getViews()
        .find((wnd) => wnd.location.href.startsWith(optionsUrl));
    if (view) {
        await new Promise((resolve) => {
            view.chrome.tabs.getCurrent((tab) => {
                browser.tabs.update(tab.id, { active: true, url: targetUrl });
                resolve();
            });
        });
    } else {
        await browser.tabs.create({ url: targetUrl });
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
    await openOptionsPage(FREE_GBS_ANCHOR);
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
