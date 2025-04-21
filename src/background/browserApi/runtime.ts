import browser, { type Manifest, type Runtime } from 'webextension-polyfill';

interface SendMessageParameters {
    message: string;
    options?: {
        [s: string]: unknown,
    };
}

export interface BrowserRuntime {
    sendMessage(...args: [SendMessageParameters]): Promise<void>;
    getManifest(): Manifest.WebExtensionManifest;
    getPlatformInfo(): Promise<Runtime.PlatformInfo>;
    getPlatformOs(): Promise<Runtime.PlatformOs>;
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

const getPlatformInfo = async (): Promise<Runtime.PlatformInfo> => {
    return browser.runtime.getPlatformInfo();
};

const getPlatformOs = async (): Promise<Runtime.PlatformOs> => {
    const platformInfo = await getPlatformInfo();
    return platformInfo.os;
};

export const runtime: BrowserRuntime = {
    sendMessage,
    getManifest,
    getPlatformInfo,
    getPlatformOs,
};
