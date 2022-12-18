import browser from 'webextension-polyfill';

import { tabs } from './tabs';
import { credentials } from './credentials';
import { Prefs } from './prefs';
import { log } from '../lib/logger';
import { settings } from './settings';
import { UPGRADE_LICENSE_URL } from './config';
import { promoNotifications } from './promoNotifications';
import { FREE_GBS_ANCHOR, SETTINGS_IDS, THEME_URL_PARAMETER } from '../lib/constants';
import { browserApi } from './browserApi';

type SetIconDetailsType = browser.Action.SetIconDetailsType;
type SetBadgeDetailsType = browser.Action.SetBadgeTextDetailsType;

// There are different browser actions implementation depending on manifest version:
// old browserAction API for manifest version 2
// Action API for manifest version 3
const browserAction = browserApi.runtime.isManifestVersion2() ? browser.browserAction : browser.action;

/**
 * Opens options tab with anchor if provided
 * @param {string | null} anchorName
 * @return {Promise<void>}
 */
const openOptionsPage = async (anchorName: string | null = null): Promise<void> => {
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

const setIcon = async (details: SetIconDetailsType): Promise<void> => {
    try {
        await browserAction.setIcon(details);
    } catch (e: any) {
        log.debug(e.message);
    }
};

const BADGE_COLOR = '#74a352';

const setBadge = async (details: SetBadgeDetailsType): Promise<void> => {
    try {
        await browserAction.setBadgeText(details);
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
const setIconEnabled = async (tabId: number): Promise<void> => {
    const details: SetIconDetailsType = { path: Prefs.ICONS.ENABLED };
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
const setIconDisabled = async (tabId: number): Promise<void> => {
    const details: SetIconDetailsType = { path: Prefs.ICONS.DISABLED };

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
const setIconTrafficOff = async (tabId: number): Promise<void> => {
    const details: SetIconDetailsType = { path: Prefs.ICONS.TRAFFIC_OFF };
    await setIcon(details);
    if (tabId) {
        details.tabId = tabId;
        await setIcon(details);
    }
};

const setBadgeText = async (text: string, tabId?: number) => {
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

    const CLOSE_EXPORT_TAB_TIMEOUT = 300;

    // this is a workaround for closing export tab and opening previous tab
    setTimeout(() => {
        if (exportTab?.id) {
            browser.tabs.remove(exportTab.id);
        }

        if (currentTab?.id) {
            browser.tabs.update(currentTab.id, { active: true });
        }
    }, CLOSE_EXPORT_TAB_TIMEOUT);
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
