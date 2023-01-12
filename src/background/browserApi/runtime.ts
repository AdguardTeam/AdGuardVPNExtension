import browser, { Manifest } from 'webextension-polyfill';

const MANIFEST_VERSION_2 = 2;

interface SendMessageParameters {
    message: string;
    options?: {
        [s: string]: unknown,
    };
}

/**
 * This function moved into separate api file, in order to hide unhandled promise errors
 * @param args
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

const isManifestVersion2 = () => getManifest().manifest_version === MANIFEST_VERSION_2;

export const runtime = {
    sendMessage,
    getManifest,
    isManifestVersion2,
};
