import browser from 'webextension-polyfill';

import { tabs } from './tabs';
// TODO convert to TS
import credentials from './credentials';
import { Prefs } from './prefs';
import { log } from '../lib/logger';
import { settings } from './settings';
import { UPGRADE_LICENSE_URL } from './config';
import { promoNotifications } from './promoNotifications';
import { FREE_GBS_ANCHOR, SETTINGS_IDS, THEME_URL_PARAMETER } from '../lib/constants';

type SetIconDetailsType = browser.Action.SetIconDetailsType;
type SetBadgeDetailsType = browser.Action.SetBadgeTextDetailsType;

/**
 * Opens options tab with anchor if provided
 * @param {string | null} anchorName
 * @return {Promise<void>}
 */
const openOptionsPage = async (anchorName: string | null = null): Promise<void> => {
    const manifest = browser.runtime.getManifest();
    // TODO find way to remove ts-ignore
    // @ts-ignore
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
        await new Promise<void>((resolve) => {
            view.chrome.tabs.getCurrent(async (tab) => {
                if (tab) {
                    await browser.tabs.update(tab.id, { active: true, url: targetUrl });
                    resolve();
                }
            });
        });
    } else {
        await browser.tabs.create({ url: targetUrl });
    }
};

const setIcon = async (details: SetIconDetailsType) => {
    try {
        await browser.browserAction.setIcon(details);
    } catch (e: any) {
        log.debug(e.message);
    }
};

const BADGE_COLOR = '#74a352';

const setBadge = async (details: SetBadgeDetailsType) => {
    try {
        await browser.browserAction.setBadgeText(details);
        const { tabId } = details;

        await browser.browserAction.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR });
    } catch (e: any) {
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
const setIconEnabled = async (tabId: number) => {
    const details: SetIconDetailsType = { path: Prefs.ICONS.ENABLED };
    const promoNotification = await promoNotifications.getCurrentNotification();

    if (promoNotification) {
        // TODO fix after promo notifications converted to TS
        // @ts-ignore
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
const setIconDisabled = async (tabId: number) => {
    const details: SetIconDetailsType = { path: Prefs.ICONS.DISABLED };

    const promoNotification = await promoNotifications.getCurrentNotification();

    if (promoNotification) {
        // TODO fix after promo notifications converted to TS
        // @ts-ignore
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
const setIconTrafficOff = async (tabId: number) => {
    const details: SetIconDetailsType = { path: Prefs.ICONS.TRAFFIC_OFF };
    await setIcon(details);
    if (tabId) {
        details.tabId = tabId;
        await setIcon(details);
    }
};

const setBadgeText = async (tabId: number, text: string) => {
    const details: SetBadgeDetailsType = { text };

    await setBadge(details);
    if (tabId) {
        details.tabId = tabId;
        await setBadge(details);
    }
};

const clearBadgeText = async (tabId: number) => {
    const details: SetBadgeDetailsType = { text: '' };

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

const openExportLogsPage = async () => {
    const url = browser.runtime.getURL('export.html');
    const currentTab = await tabs.getCurrent();
    const exportTab = await tabs.openTab(url);

    // this is a workaround for closing export tab and opening previous tab
    setTimeout(() => {
        if (exportTab?.id) {
            browser.tabs.remove(exportTab.id);
        }

        if (currentTab?.id) {
            browser.tabs.update(currentTab.id, { active: true });
        }
    }, 300);
};

export const actions = {
    openExportLogsPage,
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
