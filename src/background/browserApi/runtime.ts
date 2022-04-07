import browser, { Manifest } from 'webextension-polyfill';

interface SendMessageParameters {
    message: any;
    options?: {
        [s: string]: unknown,
    };
}

/**
 * This function moved into separate api file, in order to hide unhandled promise errors
 * @param args
 * @returns {Promise<void>}
 */
const sendMessage = async (...args: [SendMessageParameters]): Promise<void> => {
    try {
        await browser.runtime.sendMessage(...args);
    } catch (e) {
        // ignore
    }
};

export const getUrl = (url: string): string => browser.runtime.getURL(url);

const getManifest = (): Manifest.WebExtensionManifest => {
    return browser.runtime.getManifest();
};

export default {
    sendMessage,
    getManifest,
};
