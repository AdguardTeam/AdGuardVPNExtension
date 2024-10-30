import type browser from 'webextension-polyfill';

/**
 * A promisified version of the chrome.proxy.settings.clear method.
 * This function clears the existing proxy settings and returns a Promise that resolves when the operation is completed.
 * @returns A Promise that resolves when the proxy settings have been cleared.
 */
export const promisifiedClearProxy = (): Promise<void> => {
    return new Promise((resolve) => {
        chrome.proxy.settings.clear({}, () => {
            resolve();
        });
    });
};

/**
 * A promisified version of the chrome.proxy.settings.set method.
 * This function applies new proxy settings based on the provided configuration and returns
 * a Promise that resolves when the operation is completed.
 * @param config - The configuration for the proxy settings. It includes the value of the new settings and
 * the scope in which they should be applied.
 * @returns A Promise that resolves when the proxy settings have been updated.
 */
export const promisifiedSetProxy = (config: chrome.types.ChromeSettingSetDetails): Promise<void> => {
    return new Promise((resolve) => {
        chrome.proxy.settings.set(config, () => {
            resolve();
        });
    });
};

/**
 * Wraps the Chrome proxy settings get function into a Promise.
 *
 * @param config - The configuration object to be passed to the chrome.proxy.settings.get method. Defaults to an empty
 * object.
 * @returns - A promise that resolves with the details of the proxy settings.
 */
export const promisifiedGetProxy = (config = {}): Promise<browser.Types.SettingGetCallbackDetailsType> => {
    return new Promise((resolve) => {
        chrome.proxy.settings.get(config, (details) => {
            resolve(details);
        });
    });
};
