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
import { browserAction } from './browserAction';

type SetIconDetailsType = browser.Action.SetIconDetailsType;
type SetBadgeDetailsType = browser.Action.SetBadgeTextDetailsType;

const OPTIONS_PAGE_PATH = '/options.html';

/**
 * Opens options tab with anchor if provided
 */
const openOptionsPage = async (anchorName: string | null = null): Promise<void> => {
    if (browserApi.runtime.isManifestVersion2()) {
        const manifest = browser.runtime.getManifest();
        // options_page in Chrome manifest, options_ui in Firefox manifest
        // @ts-ignore (options_page property doesn't exist in polyfill)
        let optionsUrl = manifest.options_page || manifest.options_ui?.page;

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
        const optionsTab = await tabs.getCurrent();
        const { id } = optionsTab;
        if (anchorName && id) {
            await tabs.update(id, `${OPTIONS_PAGE_PATH}#${anchorName}`);
        }
    }
};

const setIcon = async (details: SetIconDetailsType): Promise<void> => {
    try {
        await browserAction.setIcon(details);
    } catch (e) {
        log.debug(e.message);
    }
};

const BADGE_COLOR = '#74a352';

const setBadge = async (details: SetBadgeDetailsType): Promise<void> => {
    try {
        await browserAction.setBadgeText(details);
        const { tabId } = details;

        await browserAction.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR });
    } catch (e) {
        log.debug(e.message);
    }
};

/**
 * Sets icon enabled. In order to remove blinking we set icon twice:
 * 1. for general browser action
 * 2. for tab browser action if tabId is provided
 * @param tabId
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
 * @param tabId
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
 */
const getPremiumPromoPageUrl = async (): Promise<string> => {
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
