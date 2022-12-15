import browser from 'webextension-polyfill';

import { Prefs } from './prefs';
import { log } from '../lib/logger';
import { promoNotifications } from './promoNotifications';
import { credentials } from './credentials';
import { UPGRADE_LICENSE_URL } from './config';
import tabs from './tabs';
import { FREE_GBS_ANCHOR, SETTINGS_IDS, THEME_URL_PARAMETER } from '../lib/constants';
import { browserApi } from './browserApi';
import { settings } from './settings';

interface ActionsInterface {
    openOptionsPage(anchorName?: string): Promise<void>;
    setIconEnabled(tabId?: number): Promise<void>;
    setIconDisabled(tabId?: number): Promise<void>;
    setIconTrafficOff(tabId?: number): Promise<void>;
    setBadgeText(text: string, tabId?: number): Promise<void>;
    clearBadgeText(tabId?: number): Promise<void>;
    getPremiumPromoPageUrl(): Promise<string>;
    openPremiumPromoPage(): Promise<void>;
    openFreeGbsPage(): Promise<void>;
}

/**
 * Opens options tab with anchor if provided
 * @param {string | null} anchorName
 * @return {Promise<void>}
 */
const openOptionsPage = async (anchorName?: string): Promise<void> => {
    if (browserApi.runtime.isManifestVersion2()) {
        const manifest = browser.runtime.getManifest();
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
                    if (!tab?.id) {
                        return;
                    }
                    await tabs.update(tab?.id, targetUrl);
                    resolve();
                });
            });
        } else {
            await browser.tabs.create({ url: targetUrl });
        }
    } else {
        await browser.runtime.openOptionsPage();
        const { id, url } = await tabs.getCurrent();
        if (anchorName && id) {
            await tabs.update(id, `${url}#${anchorName}`);
            if (url?.includes(browser.runtime.id)) {
                await tabs.reload(id);
            }
        }
    }
};

// There are different browser actions implementation depending on manifest version:
// old browserAction API for manifest version 2
// Action API for manifest version 3
const browserAction = browserApi.runtime.isManifestVersion2() ? browser.browserAction : browser.action;

const setIcon = async (details: browser.Action.SetIconDetailsType): Promise<void> => {
    try {
        await browserAction.setIcon(details);
    } catch (e: any) {
        log.debug(e.message);
    }
};

const BADGE_COLOR = '#74a352';

const setBadge = async (details: browser.Action.Details): Promise<void> => {
    try {
        await browserAction.setBadgeText(details as browser.Action.SetBadgeTextDetailsType);
        const { tabId } = details;

        await browserAction.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR });
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
const setIconEnabled = async (tabId?: number): Promise<void> => {
    const details: browser.Action.SetIconDetailsType = { path: Prefs.ICONS.ENABLED };
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
const setIconDisabled = async (tabId?: number): Promise<void> => {
    const details: browser.Action.SetIconDetailsType = { path: Prefs.ICONS.DISABLED };

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
const setIconTrafficOff = async (tabId?: number): Promise<void> => {
    const details: browser.Action.SetIconDetailsType = { path: Prefs.ICONS.TRAFFIC_OFF };
    await setIcon(details);
    if (tabId) {
        details.tabId = tabId;
        await setIcon(details);
    }
};

const setBadgeText = async (text: string, tabId?: number): Promise<void> => {
    const details: browser.Action.SetBadgeTextDetailsType = { text };

    await setBadge(details);
    if (tabId) {
        details.tabId = tabId;
        await setBadge(details);
    }
};

const clearBadgeText = async (tabId?: number): Promise<void> => {
    const details: browser.Action.SetBadgeTextDetailsType = { text: '' };

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
const getPremiumPromoPageUrl = async (): Promise<string> => {
    const username = await credentials.getUsername();
    return `${UPGRADE_LICENSE_URL}${username ? `&email=${encodeURIComponent(username)}` : ''}`;
};

/**
 * Opens Premium Promo Page in new tab
 */
const openPremiumPromoPage = async (): Promise<void> => {
    const url = await getPremiumPromoPageUrl();
    await tabs.openTab(url);
};

/**
 * Opens Options page on Referral Program section
 */
const openFreeGbsPage = async (): Promise<void> => {
    await openOptionsPage(FREE_GBS_ANCHOR);
};

export const actions: ActionsInterface = {
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
