import browser, { type Runtime } from 'webextension-polyfill';

import { AppearanceTheme } from '../../common/constants';
import { Prefs, SystemName } from '../../common/prefs';
import { appStatus } from '../appStatus';
import { telemetryApi } from '../api/telemetryApi';

/**
 * Screen names passed to telemetry.
 */
export enum TelemetryScreenName {
    WelcomeScreen = 'welcome_screen',
    // FIXME: Add rest of screen names
}

/**
 * Event names passed to telemetry.
 */
export enum TelemetryActionName {
    OnboardingPurchaseClick = 'onboarding_purchase_click',
    // FIXME: Add rest of action names
}

/**
 * Operating system names passed to telemetry.
 */
export enum TelemetryOs {
    MacOS = 'Mac',
    iOS = 'iOS',
    Windows = 'Windows',
    Android = 'Android',
    ChromeOS = 'ChromeOS',
    Linux = 'Linux',
    OpenBSD = 'OpenBSD',
    Fuchsia = 'Fuchsia',
}

/**
 * User agent info.
 */
export interface TelemetryUserAgent {
    /**
     * Device info.
     */
    device?: {
        /**
         * Device brand, e.g. 'Apple', 'Samsung'.
         */
        brand: string;

        /**
         * Device model, e.g. 'iPhone', 'SM-S901U1'.
         */
        model?: string;
    };

    /**
     * Operating system info.
     */
    os: {
        /**
         * Operating system name, e.g. 'Windows', 'Android', 'iOS', 'Mac'.
         */
        name: TelemetryOs;

        /**
         * Platform name, e.g. 'arm', 'mips', 'amd64', 'x64', etc.
         */
        platform?: Runtime.PlatformArch;

        /**
         * Operating system version.
         */
        version: string;
    };
}

/**
 * License status names passed to telemetry.
 */
export enum TelemetryLicenseStatus {
    Free = 'FREE',
    Trial = 'TRIAL',
    Premium = 'PREMIUM',
}

/**
 * Subscription duration names passed to telemetry.
 */
export enum TelemetrySubscriptionDuration {
    Monthly = 'MONTHLY',
    Annual = 'ANNUAL',
    Lifetime = 'LIFETIME',
    Other = 'OTHER',
}

/**
 * UI theme names passed to telemetry.
 */
export enum TelemetryTheme {
    Light = 'LIGHT',
    Dark = 'DARK',
    System = 'SYSTEM',
}

/**
 * Custom properties for the event.
 */
export interface TelemetryProps {
    /**
     * Selected in application locale, e.g. "en-US".
     */
    appLocale: string;

    /**
     * System locale, e.g. "en-US".
     */
    systemLocale: string;

    /**
     * User login status.
     */
    loggedIn?: boolean;

    /**
     * License status.
     */
    licenseStatus?: TelemetryLicenseStatus;

    /**
     * Subscription duration.
     */
    subscriptionDuration?: TelemetrySubscriptionDuration;

    /**
     * UI theme.
     */
    theme?: TelemetryTheme;
}

/**
 * Telemetry base data. All telemetry events must contain this data.
 */
export interface TelemetryBaseData {
    /**
     * Unique and random synthetic identifier for telemetry tracking.
     * Doesn't relate to the original application identifier using for other API requests.
     * It must be eight characters long and consist of characters [a-f1-9].
     */
    syntheticId: string;

    /**
     * Short version of application, e.g. "2.14 beta 1".
     */
    version: string;

    /**
     * User agent info.
     */
    userAgent: TelemetryUserAgent;

    /**
     * Custom properties for the event.
     */
    props?: TelemetryProps;
}

/**
 * Page view data.
 */
export interface TelemetryPageViewData {
    /**
     * Name of shown page, e.g. 'settings_screen'.
     */
    name: TelemetryScreenName;

    /**
     * Name of referer page, e.g. 'stats_screen'.
     */
    refName?: TelemetryScreenName;
}

/**
 * Page view event type.
 */
export interface TelemetryPageViewEvent extends TelemetryBaseData {
    /**
     * Special type of event, refers to page view. Must specify pageview or event, not both.
     * If both pageview and event are present, the pageview will be used.
     */
    pageview: TelemetryPageViewData;
}

/**
 * Custom event data.
 */
export interface TelemetryCustomEventData {
    /**
     * Name of this custom event, e.g. 'purchase'.
     */
    name: TelemetryActionName;

    /**
     * Name of page where custom event occurs, e.g. 'login_screen'.
     */
    refName?: TelemetryScreenName;

    /**
     * Action name.
     */
    action?: string;

    /**
     * Label name.
     */
    label?: string;
}

/**
 * Custom event type.
 */
export interface TelemetryCustomEvent extends TelemetryBaseData {
    /**
     * Custom type of event. Must specify pageview or event, not both.
     * If both pageview and event are present, the pageview will be used.
     */
    event: TelemetryCustomEventData;
}

/**
 * Union type for telemetry event data
 */
export type TelemetryEventData = TelemetryPageViewData | TelemetryCustomEventData;

/**
 * Union type for telemetry events.
 */
export type TelemetryEvent = TelemetryPageViewEvent | TelemetryCustomEvent;

/**
 * Options for sending telemetry event.
 */
export interface TelemetrySendEventData {
    /**
     * Unique and random synthetic identifier for telemetry tracking.
     * Doesn't relate to the original application identifier using for other API requests.
     * It must be eight characters long and consist of characters [a-f1-9].
     */
    syntheticId: TelemetryBaseData['syntheticId'];

    /**
     * User authentication status.
     */
    loggedIn?: TelemetryProps['loggedIn'];

    /**
     * License status.
     */
    licenseStatus?: TelemetryProps['licenseStatus'];

    /**
     * Subscription duration.
     */
    subscriptionDuration?: TelemetryProps['subscriptionDuration'];

    /**
     * Appearance theme.
     */
    appearanceTheme?: AppearanceTheme;
}

/**
 * Telemetry provider interface.
 */
export interface TelemetryProviderInterface {
    /**
     * Sends telemetry pageview event.
     *
     * @param event Page view event data.
     * @param data Data for sending telemetry event.
     */
    sendPageViewEvent(event: TelemetryPageViewData, data: TelemetrySendEventData): Promise<void>;

    /**
     * Sends telemetry custom event.
     *
     * @param event Custom event data.
     * @param data Data for sending telemetry event.
     */
    sendCustomEvent(event: TelemetryCustomEventData, data: TelemetrySendEventData): Promise<void>;
}

/**
 * SystemName to TelemetryOs mapper.
 */
const OS_MAPPER: Record<SystemName, TelemetryOs> = {
    [SystemName.MacOS]: TelemetryOs.MacOS,
    [SystemName.iOS]: TelemetryOs.iOS,
    [SystemName.Windows]: TelemetryOs.Windows,
    [SystemName.Android]: TelemetryOs.Android,
    [SystemName.ChromeOS]: TelemetryOs.ChromeOS,
    [SystemName.Linux]: TelemetryOs.Linux,
    [SystemName.OpenBSD]: TelemetryOs.OpenBSD,
    [SystemName.Fuchsia]: TelemetryOs.Fuchsia,
};

/**
 * AppearanceTheme to TelemetryTheme mapper.
 */
const THEME_MAPPER: Record<AppearanceTheme, TelemetryTheme> = {
    [AppearanceTheme.Light]: TelemetryTheme.Light,
    [AppearanceTheme.Dark]: TelemetryTheme.Dark,
    [AppearanceTheme.System]: TelemetryTheme.System,
};

/**
 * Creates telemetry base data for the event.
 *
 * @param options Options for sending telemetry event.
 * @returns Telemetry base data.
 */
const getBaseData = async (options: TelemetrySendEventData): Promise<TelemetryBaseData> => {
    const {
        syntheticId,
        loggedIn,
        licenseStatus,
        subscriptionDuration,
        appearanceTheme,
    } = options;

    const { os, arch } = await Prefs.getPlatformInfo();
    const osName = OS_MAPPER[os];
    const userAgent: TelemetryUserAgent = {
        device: {
            brand: 'FIXME: Can it be retrieved?',
            model: 'FIXME: Can it be retrieved?',
        },
        os: {
            name: osName,
            platform: arch,
            version: 'FIXME: Can it be retrieved?',
        },
    };

    const locale = browser.i18n.getUILanguage();
    const theme = appearanceTheme && THEME_MAPPER[appearanceTheme];
    const props: TelemetryProps = {
        appLocale: locale,
        systemLocale: locale,
        loggedIn,
        licenseStatus,
        subscriptionDuration,
        theme,
    };

    return {
        syntheticId,
        version: appStatus.appVersion,
        userAgent,
        props,
    };
};

const sendEvent = async (event: TelemetryEvent): Promise<void> => {
    try {
        await telemetryApi.sendEvent(event);
    } catch {
        // FIXME: What should we do in case of error? Retry?
    }
};

/**
 * Sends telemetry pageview event.
 *
 * @param event Page view event data.
 * @param data Data for sending telemetry event.
 */
const sendPageViewEvent = async (
    event: TelemetryPageViewData,
    data: TelemetrySendEventData,
): Promise<void> => {
    const baseData = await getBaseData(data);
    const telemetryData: TelemetryPageViewEvent = {
        ...baseData,
        pageview: event,
    };

    await sendEvent(telemetryData);
};

/**
 * Sends telemetry custom event.
 *
 * @param event Custom event data.
 * @param data Data for sending telemetry event.
 */
const sendCustomEvent = async (
    event: TelemetryCustomEventData,
    data: TelemetrySendEventData,
): Promise<void> => {
    const baseData = await getBaseData(data);
    const telemetryData: TelemetryCustomEvent = {
        ...baseData,
        event,
    };

    await sendEvent(telemetryData);
};

export const telemetryProvider: TelemetryProviderInterface = {
    sendPageViewEvent,
    sendCustomEvent,
};
