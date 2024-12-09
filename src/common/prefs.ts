import type { Runtime } from 'webextension-polyfill';

import { getUrl, runtime } from '../background/browserApi/runtime';

import { lazyGet } from './helpers';

const ICONS_PATH = 'assets/images/icons';

/**
 * Icon data for different sizes.
 */
type IconData = {
    /**
     * 19x19 icon size.
     */
    19: string;

    /**
     * 38x38 icon size.
     */
    38: string;

    /**
     * 128x128 icon size.
     */
    128?: string;
};

/**
 * Icon variants for different states.
 */
export type IconVariants = {
    [key: string]: IconData,
};

interface PrefsInterface {
    ICONS: IconVariants;
    browser: string;
    os?: Runtime.PlatformOs;

    /**
     * Returns the current OS.
     *
     * Uses native {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/getPlatformInfo | runtime.getPlatformInfo()}.
     */
    getOS(): Promise<Runtime.PlatformOs>;

    /**
     * Checks whether the current browser is Firefox.
     *
     * @returns True if the current browser is Firefox, false otherwise.
     */
    isFirefox(): boolean;

    /**
     * Checks whether the current OS is Windows.
     *
     * Uses native {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/getPlatformInfo | runtime.getPlatformInfo()}
     * to determine the OS.
     *
     * @returns Promise that will be fulfilled with `true` if the current OS is Windows, `false` otherwise.
     */
    isWindows(): Promise<boolean>;

    /**
     * Checks whether the current OS is MacOS.
     *
     * Uses native {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/getPlatformInfo | runtime.getPlatformInfo()}
     * to determine the OS.
     *
     * @returns Promise that will be fulfilled with `true` if the current OS is MacOS, `false` otherwise.
     */
    isMacOS(): Promise<boolean>;

    /**
     * Checks whether the current OS is Android.
     *
     * Uses native {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/getPlatformInfo | runtime.getPlatformInfo()}
     * to determine the OS.
     *
     * @returns Promise that will be fulfilled with `true` if the current OS is Android, `false` otherwise.
     */
    isAndroid(): Promise<boolean>;
}

enum BrowserName {
    Chrome = 'Chrome',
    Firefox = 'Firefox',
    Opera = 'Opera',
    Edge = 'Edge',
    EdgeChromium = 'EdgeChromium',
    YaBrowser = 'YaBrowser',
}

enum SystemName {
    MacOS = 'mac',
    Windows = 'win',
    Android = 'android',
}

export const Prefs: PrefsInterface = {
    get ICONS() {
        return lazyGet(Prefs, 'ICONS', () => ({
            ENABLED: {
                19: getUrl(`${ICONS_PATH}/enabled-19.png`),
                38: getUrl(`${ICONS_PATH}/enabled-38.png`),
                128: getUrl(`${ICONS_PATH}/enabled-128.png`),
            },
            DISABLED: {
                19: getUrl(`${ICONS_PATH}/disabled-19.png`),
                38: getUrl(`${ICONS_PATH}/disabled-38.png`),
                128: getUrl(`${ICONS_PATH}/disabled-128.png`),
            },
            TRAFFIC_OFF: {
                19: getUrl(`${ICONS_PATH}/traffic-off-19.png`),
                38: getUrl(`${ICONS_PATH}/traffic-off-38.png`),
                128: getUrl(`${ICONS_PATH}/traffic-off-128.png`),
            },
        }));
    },

    isFirefox(): boolean {
        return this.browser === BrowserName.Firefox;
    },

    get browser(): string {
        return lazyGet(Prefs, 'browser', () => {
            let browser;
            let { userAgent } = navigator;
            userAgent = userAgent.toLowerCase();
            if (userAgent.indexOf('yabrowser') >= 0) {
                browser = BrowserName.YaBrowser;
            } else if (userAgent.indexOf('edge') >= 0) {
                browser = BrowserName.Edge;
            } else if (userAgent.indexOf('edg') >= 0) {
                browser = BrowserName.EdgeChromium;
            } else if (userAgent.indexOf('opera') >= 0
                || userAgent.indexOf('opr') >= 0) {
                browser = BrowserName.Opera;
            } else if (userAgent.indexOf('firefox') >= 0) {
                browser = BrowserName.Firefox;
            } else {
                browser = BrowserName.Chrome;
            }
            return browser;
        });
    },

    async getOS(): Promise<Runtime.PlatformOs> {
        if (!this.os) {
            this.os = await runtime.getPlatformOs();
        }
        return this.os;
    },

    async isWindows(): Promise<boolean> {
        const os = await this.getOS();
        return os === SystemName.Windows;
    },

    async isMacOS(): Promise<boolean> {
        const os = await this.getOS();
        return os === SystemName.MacOS;
    },

    async isAndroid(): Promise<boolean> {
        const os = await this.getOS();
        return os === SystemName.Android;
    },
};
