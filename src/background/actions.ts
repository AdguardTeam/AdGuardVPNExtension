import browser from 'webextension-polyfill';

import { Prefs } from '../common/prefs';
import { log } from '../common/logger';
import { SETTINGS_IDS, THEME_URL_PARAMETER } from '../common/constants';
import { getForwarderUrl } from '../common/helpers';
import { tabs } from '../common/tabs';
import { WindowsApi } from '../common/windowsApi';

import { credentials } from './credentials';
import { forwarder } from './forwarder';
import { settings } from './settings';
import { FORWARDER_URL_QUERIES, type ForwarderUrlQueryKey } from './config';
import { promoNotifications } from './promoNotifications';

type SetIconDetailsType = browser.Action.SetIconDetailsType;
type SetBadgeDetailsType = browser.Action.SetBadgeTextDetailsType;

const OPTIONS_PAGE_PATH = '/options.html';

const FREE_GBS_ANCHOR = 'free-gbs';

/**
 * Opens options page in Firefox with queryString if provided.
 * There is a bug with browser.runtime.openOptionsPage() method in Firefox
 * similar to https://bugs.chromium.org/p/chromium/issues/detail?id=1369940,
 * so we use a temporary solution to open а single options page in Firefox.
 */
const openOptionsPageFirefox = async (queryString: string = ''): Promise<void> => {
    const manifest = browser.runtime.getManifest();
    // options page url set in options_ui.page in manifest.firefox.ts
    let optionsUrl = manifest.options_ui!.page;

    if (!optionsUrl.includes('://')) {
        optionsUrl = browser.runtime.getURL(optionsUrl);
    }

    const targetUrl = `${optionsUrl}${queryString}`;
    const optionsTabs = await browser.tabs.query({ url: optionsUrl });

    if (!optionsTabs.length) {
        await tabs.openTab(targetUrl);
        return;
    }

    const { windowId, id: tabId } = optionsTabs[0];
    await browser.tabs.update(tabId, { url: targetUrl, active: true });
    if (windowId) {
        await WindowsApi.update(windowId, { focused: true });
    }
};

interface OpenOptionsPageParams {
    anchorName?: string;
    queryParams?: { [key: string]: string };
}

/**
 * Builds query string from params object.
 *
 * @param params
 *
 * @returns Query string.
 */
export const buildQueryString = (params: OpenOptionsPageParams): string => {
    const {
        anchorName = '',
        queryParams = {},
    } = params;

    // Convert queryParams object to query string
    const queryParamsStr = new URLSearchParams(queryParams).toString();
    const queryString = queryParamsStr ? `?${queryParamsStr}` : '';

    if (anchorName === '') {
        return queryString;
    }

    return `${queryString}#${anchorName}`;
};

/**
 * Opens options tab with anchor if provided
 */
const openOptionsPage = async (
    params: OpenOptionsPageParams = {},
): Promise<void> => {
    const { anchorName, queryParams } = params;

    const queryString = buildQueryString({
        anchorName,
        queryParams: {
            ...queryParams,
            [THEME_URL_PARAMETER]: settings.getSetting(SETTINGS_IDS.APPEARANCE_THEME),
        },
    });

    // We use temporary solution for Firefox because of a bug with browser.runtime.openOptionsPage() method
    // TODO: remove when bug will be fixed
    if (Prefs.isFirefox()) {
        await openOptionsPageFirefox(queryString);
        return;
    }

    await browser.runtime.openOptionsPage();
    const optionsTab = await tabs.getCurrent();
    const { id } = optionsTab;
    const newOptionsStr = `${OPTIONS_PAGE_PATH}${queryString}`;
    if (id) {
        await tabs.update(id, newOptionsStr);
    }
};

const setIcon = async (details: SetIconDetailsType): Promise<void> => {
    try {
        await browser.action.setIcon(details);
    } catch (e) {
        log.debug(e.message);
    }
};

const BADGE_COLOR = '#74a352';

const setBadge = async (details: SetBadgeDetailsType): Promise<void> => {
    try {
        await browser.action.setBadgeText(details);
        const { tabId } = details;

        await browser.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR });
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

const setBadgeText = async (text: string, tabId?: number): Promise<void> => {
    const details: SetBadgeDetailsType = { text };

    await setBadge(details);
    if (tabId) {
        details.tabId = tabId;
        await setBadge(details);
    }
};

const clearBadgeText = async (tabId: number): Promise<void> => {
    const details: SetBadgeDetailsType = { text: '' };

    await setBadge(details);
    if (tabId) {
        details.tabId = tabId;
        await setBadge(details);
    }
};

/**
 * Constructs forwarder URL with email query param if user is logged in.
 *
 * @param forwarderUrlQueryKey Forwarder query key.
 * @returns Constructed forwarder URL.
 */
const getForwarderUrlWithEmail = async (forwarderUrlQueryKey: ForwarderUrlQueryKey): Promise<string> => {
    const username = await credentials.getUsername();
    const forwarderDomain = await forwarder.updateAndGetDomain();
    const url = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES[forwarderUrlQueryKey]);
    return `${url}${username ? `&email=${encodeURIComponent(username)}` : ''}`;
};

/**
 * Opens forwarder URL in new tab by appending email query param if user is logged in.
 *
 * @param forwarderUrlQueryKey Forwarder query key.
 */
const openForwarderUrlWithEmail = async (forwarderUrlQueryKey: ForwarderUrlQueryKey): Promise<void> => {
    const url = await getForwarderUrlWithEmail(forwarderUrlQueryKey);
    await tabs.openTab(url);
};

/**
 * Opens Options page on Referral Program section
 */
const openFreeGbsPage = async (): Promise<void> => {
    await openOptionsPage({ anchorName: FREE_GBS_ANCHOR });
};

const openExportLogsPage = async (): Promise<void> => {
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
    getForwarderUrlWithEmail,
    openForwarderUrlWithEmail,
    openFreeGbsPage,
};
