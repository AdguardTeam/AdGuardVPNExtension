import type { Runtime } from 'webextension-polyfill';
import UAParser, { type IDevice, type UAParserInstance } from 'ua-parser-js';

import { getUrl, runtime } from '../background/browserApi/runtime';

import { lazyGet } from './helpers';

declare global {
    interface UserAgentVendor {
        brand?: string;
        version?: string;
    }

    interface UserAgentHighEntropyValues {
        brands?: UserAgentVendor[];
        mobile?: boolean;
        platform?: string;
        architecture?: string;
        bitness?: string;
        formFactor?: string;
        fullVersionList?: UserAgentVendor[];
        model?: string;
        platformVersion?: string;
        uaFullVersion?: string;
        wow64?: boolean;
    }

    type UserAgentHighEntropyHint = keyof UserAgentHighEntropyValues;

    interface Navigator {
        userAgentData?: {
            getHighEntropyValues: (hints: UserAgentHighEntropyHint[]) => Promise<UserAgentHighEntropyValues>;
        };
    }
}

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

/**
 * Re-structured Runtime.PlatformInfo.
 * The only difference is that `os` type re-defined as `SystemName` enum.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/PlatformInfo | Runtime.PlatformInfo}
 */
interface PlatformInfo {
    /**
     * The operating system the browser is running on.
     */
    os: SystemName;

    /**
     * The architecture of the operating system.
     */
    arch: Runtime.PlatformArch;
}

/**
 * Browser name enum.
 */
export enum BrowserName {
    Chrome = 'Chrome',
    Firefox = 'Firefox',
    Opera = 'Opera',
    Edge = 'Edge',
    EdgeChromium = 'EdgeChromium',
    YaBrowser = 'YaBrowser',
}

/**
 * System name enum.
 */
export enum SystemName {
    MacOS = 'mac',
    iOS = 'ios',
    Windows = 'win',
    Android = 'android',
    ChromeOS = 'cros',
    Linux = 'linux',
    OpenBSD = 'openbsd',
    Fuchsia = 'fuchsia',
}

/**
 * Preferences class.
 *
 * Utility class for getting icon urls, platform info, device runtime.
 */
export class Preferences {
    /**
     * Cache storage for lazy getters.
     */
    private static cache: Record<string, any> = {};

    /**
     * Clears the cache.
     *
     * NOTE: This method is used for testing purposes.
     */
    public static clearCache(): void {
        Preferences.cache = {};
    }

    /* ICON RELATED PREFERENCES */

    /**
     * Path to icons.
     */
    private static readonly ICONS_PATH = 'assets/images/icons';

    /**
     * Icon variants getter.
     */
    public get ICONS(): IconVariants {
        return lazyGet(Preferences.cache, 'ICONS', (): IconVariants => ({
            ENABLED: {
                19: getUrl(`${Preferences.ICONS_PATH}/enabled-19.png`),
                38: getUrl(`${Preferences.ICONS_PATH}/enabled-38.png`),
                128: getUrl(`${Preferences.ICONS_PATH}/enabled-128.png`),
            },
            DISABLED: {
                19: getUrl(`${Preferences.ICONS_PATH}/disabled-19.png`),
                38: getUrl(`${Preferences.ICONS_PATH}/disabled-38.png`),
                128: getUrl(`${Preferences.ICONS_PATH}/disabled-128.png`),
            },
            TRAFFIC_OFF: {
                19: getUrl(`${Preferences.ICONS_PATH}/traffic-off-19.png`),
                38: getUrl(`${Preferences.ICONS_PATH}/traffic-off-38.png`),
                128: getUrl(`${Preferences.ICONS_PATH}/traffic-off-128.png`),
            },
        }));
    }

    /* BROWSER RELATED PREFERENCES */

    /**
     * Browser name getter.
     */
    public get browser(): BrowserName {
        return lazyGet(Preferences.cache, 'browser', (): BrowserName => {
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
    }

    /**
     * Checks whether the current browser is Firefox.
     *
     * @returns True if the current browser is Firefox, false otherwise.
     */
    public isFirefox(): boolean {
        return this.browser === BrowserName.Firefox;
    }

    /* PLATFORM RELATED PREFERENCES */

    /**
     * UA parser instance getter.
     */
    private static get uaParser(): UAParserInstance {
        return lazyGet(Preferences.cache, 'uaParser', () => new UAParser(navigator.userAgent));
    }

    /**
     * Platform info promise getter.
     */
    private static get platformInfoPromise(): Promise<PlatformInfo> {
        return lazyGet(Preferences.cache, 'platformInfoPromise', async (): Promise<PlatformInfo> => {
            const { os, arch } = await runtime.getPlatformInfo();

            return {
                // Runtime.PlatformInfo.os and SystemName is interchangeable
                os: os as SystemName,
                arch,
            };
        });
    }

    /**
     * Returns the platform info (os, arch).
     *
     * Uses native {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/getPlatformInfo | runtime.getPlatformInfo()}.
     *
     * @returns Promise that will be fulfilled with platform info.
     */
    public async getPlatformInfo(): Promise<PlatformInfo> {
        return Preferences.platformInfoPromise;
    }

    /**
     * Get OS name.
     *
     * @returns OS name.
     */
    public async getOS(): Promise<SystemName> {
        const platformInfo = await this.getPlatformInfo();
        return platformInfo.os;
    }

    /**
     * Checks whether the current OS is Windows.
     *
     * @returns Promise that will be fulfilled with `true` if the current OS is Windows, `false` otherwise.
     */
    public async isWindows(): Promise<boolean> {
        const os = await this.getOS();
        return os === SystemName.Windows;
    }

    /**
     * Checks whether the current OS is MacOS.
     *
     * @returns Promise that will be fulfilled with `true` if the current OS is MacOS, `false` otherwise.
     */
    public async isMacOS(): Promise<boolean> {
        const os = await this.getOS();
        return os === SystemName.MacOS;
    }

    /**
     * Checks whether the current OS is Android.
     *
     * @returns Promise that will be fulfilled with `true` if the current OS is Android, `false` otherwise.
     */
    public async isAndroid(): Promise<boolean> {
        const os = await this.getOS();
        return os === SystemName.Android;
    }

    /**
     * Platform version query to `navigator.userAgentData.getHighEntropyValues()`.
     */
    private static readonly PLATFORM_VERSION_ENTROPY = 'platformVersion';

    /**
     * Windows 10 OS version.
     */
    private static readonly WINDOWS_10_OS_VERSION = '10';

    /**
     * Windows 11 OS version.
     */
    private static readonly WINDOWS_11_OS_VERSION = '11';

    /**
     * Windows 11 is specified as 13 and above in entropy version.
     */
    private static readonly MIN_WINDOWS_11_PLATFORM_VERSION = 13;

    /**
     * Platform version promise getter.
     */
    private static get platformVersionPromise(): Promise<string | undefined> {
        return lazyGet(Preferences.cache, 'platformVersionPromise', async (): Promise<string | undefined> => {
            let { version } = Preferences.uaParser.getOS();

            if (typeof version === 'undefined') {
                return version;
            }

            // use static promise to not depend on this.isMacOS() and this.isWindows()
            const { os } = await Preferences.platformInfoPromise;

            if (os === SystemName.Windows && version === Preferences.WINDOWS_10_OS_VERSION) {
                // windows 11 is parsed as windows 10 from user agent
                version = await Preferences.getActualWindowsVersion(version);
            } else if (os === SystemName.MacOS) {
                // mac os version can be parsed from user agent as 10.15.7
                // so it also might be more specific version like 13.5.2
                version = await Preferences.getActualMacosVersion(version);
            }

            return version;
        });
    }

    /**
     * Returns the platform version.
     *
     * Detects version from `navigator.userAgent` and `navigator.userAgentData.getHighEntropyValues()`.
     *
     * @returns Promise that will be fulfilled with platform version if possible to detect, undefined otherwise.
     */
    public async getPlatformVersion(): Promise<string | undefined> {
        return Preferences.platformVersionPromise;
    }

    /**
     * Returns current platform version.
     * Uses NavigatorUAData.getHighEntropyValues() to get platform version.
     *
     * @returns Actual platform version as string if possible to detect, undefined otherwise.
     */
    private static async getEntropyPlatformVersion(): Promise<string | undefined> {
        try {
            const ua = await navigator.userAgentData?.getHighEntropyValues([Preferences.PLATFORM_VERSION_ENTROPY]);
            if (ua) {
                return ua[Preferences.PLATFORM_VERSION_ENTROPY];
            }
        } catch (e) {
            // do nothing
        }
        return undefined;
    }

    /**
     * Returns actual Windows version if it is parsed from user agent as Windows 10.
     *
     * @see {@link https://learn.microsoft.com/en-us/microsoft-edge/web-platform/how-to-detect-win11#sample-code-for-detecting-windows-11}.
     *
     * @returns Actual Windows version.
     */
    private static async getActualWindowsVersion(version: string): Promise<string> {
        let actualVersion = version;
        const entropyPlatformVersion = await Preferences.getEntropyPlatformVersion();

        if (typeof entropyPlatformVersion === 'undefined') {
            return actualVersion;
        }

        const rawMajorPlatformVersion = entropyPlatformVersion.split('.')[0];
        const majorPlatformVersion = rawMajorPlatformVersion && parseInt(rawMajorPlatformVersion, 10);

        if (!majorPlatformVersion || Number.isNaN(majorPlatformVersion)) {
            return actualVersion;
        }

        if (majorPlatformVersion >= Preferences.MIN_WINDOWS_11_PLATFORM_VERSION) {
            actualVersion = Preferences.WINDOWS_11_OS_VERSION;
        }

        return actualVersion;
    }

    /**
     * Returns actual MacOS version if it is possible to detect, otherwise returns passed `version`.
     *
     * @param version MacOS version parsed from user agent.
     *
     * @returns Actual MacOS version.
     */
    private static async getActualMacosVersion(version: string): Promise<string> {
        const entropyPlatformVersion = await Preferences.getEntropyPlatformVersion();
        return entropyPlatformVersion || version;
    }

    /**
     * Device info getter.
     */
    public get device(): IDevice {
        return lazyGet(Preferences.cache, 'device', (): IDevice => Preferences.uaParser.getDevice());
    }
}

export const Prefs = new Preferences();
