import browser, { type Windows, type Tabs } from 'webextension-polyfill';

import { log } from '../common/logger';

/**
 * Helper class for browser.windows API.
 */
export class WindowsApi {
    /**
     * The windowId value that represents the absence of a browser window.
     * If the browser does not support this constant, it will be set to -1.
     */
    public static readonly WINDOW_ID_NONE = browser.windows?.WINDOW_ID_NONE || -1;

    /**
     * On focus changed events fallback for browsers that
     * do not support `browser.windows.onFocusChanged`.
     */
    public static readonly onFocusChanged = browser.windows?.onFocusChanged || {
        addListener() {
            log.debug('browser.windows.onFocusChanged is not supported');
        },
        removeListener() {
            log.debug('browser.windows.onFocusChanged is not supported');
        },
        hasListener() {
            log.debug('browser.windows.onFocusChanged is not supported');
            return false;
        },
    };

    /**
     * Checks if browser.windows API is supported.
     *
     * Do not use browser.windows API if it is not supported,
     * for example on Android: not supported in Firefox and does not work in Edge.
     *
     * @returns True if browser.windows API is supported, false otherwise.
     */
    private static isSupported() {
        return !!browser.windows
            && typeof browser.windows.update === 'function'
            && typeof browser.windows.create === 'function'
            && typeof browser.windows.getCurrent === 'function';
    }

    /**
     * Calls browser.windows.create with fallback to browser.tabs.create.
     * In case of fallback, compatible data will be reused.
     *
     * This covers cases:
     * - Firefox for Android, where browser.windows API is not available.
     *   https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2536
     * - Edge for Android, for some reason browser.windows.create does not open a new tab.
     *
     * @param createData Browser.windows.create argument.
     *
     * @returns Created window, tab or null, if no calls were made.
     */
    public static async create(
        createData?: Windows.CreateCreateDataType,
    ): Promise<Windows.Window | Tabs.Tab | null> {
        if (WindowsApi.isSupported()) {
            return browser.windows.create(createData);
        }

        const createProperties = createData || {};
        const { url, cookieStoreId } = createProperties;

        const firstUrl = Array.isArray(url) ? url[0] : url;
        const isUrlSpecified = typeof firstUrl === 'string';

        try {
            if (isUrlSpecified) {
                return await browser.tabs.create({
                    url: firstUrl,
                    cookieStoreId,
                });
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Updates the properties of a window with specified ID.
     *
     * @param windowId Window ID. May be undefined.
     * @param updateInfo Update info.
     */
    public static async update(
        windowId: number | undefined,
        updateInfo: Windows.UpdateUpdateInfoType,
    ): Promise<void> {
        if (!windowId) {
            log.debug('windowId is not specified');
            return;
        }

        if (!WindowsApi.isSupported()) {
            log.debug('browser.windows API is not supported');
            return;
        }

        await browser.windows.update(windowId, updateInfo);
    }

    /**
     * Returns the current browser window.
     *
     * @returns Promise that resolves to the current window or null if the API is not supported.
     */
    public static async getCurrent(): Promise<Windows.Window | null> {
        if (!WindowsApi.isSupported()) {
            log.debug('browser.windows API is not supported');
            return null;
        }

        return browser.windows.getCurrent();
    }
}
