import browser, { type Manifest, type Runtime } from 'webextension-polyfill';

const MANIFEST_VERSION_2 = 2;

interface SendMessageParameters {
    message: string;
    options?: {
        [s: string]: unknown,
    };
}

export interface BrowserRuntime {
    sendMessage(...args: [SendMessageParameters]): Promise<void>;
    getManifest(): Manifest.WebExtensionManifest;
    isManifestVersion2(): boolean;
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

const isManifestVersion2 = () => getManifest().manifest_version === MANIFEST_VERSION_2;

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
    isManifestVersion2,
    getPlatformInfo,
    getPlatformOs,
};
