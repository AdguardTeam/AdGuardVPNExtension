import { type Runtime } from 'webextension-polyfill';

import { type ExperimentSlotValues } from '../abTestManager/ABTestManager';

import {
    type TelemetryScreenName,
    type TelemetryActionName,
    type TelemetryOs,
    type TelemetryLicenseStatus,
    type TelemetrySubscriptionDuration,
    type TelemetryTheme,
    type TelemetryWebsiteExclusion,
} from './telemetryEnums';

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

    /**
     * Browser info.
     */
    browser: {
        /**
         * Browser name, e.g. 'Chrome', 'Firefox'.
         */
        name: string;

        /**
         * Browser version, e.g. '145.0.0.0'.
         */
        version: string;
    };
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

    /**
     * Assigned variant for A/B experiment slot 1.
     */
    experiment_1?: string;

    /**
     * Assigned variant for A/B experiment slot 2.
     */
    experiment_2?: string;

    /**
     * Assigned variant for A/B experiment slot 3.
     */
    experiment_3?: string;

    /**
     * Website exclusions mode: OFF if there are no enabled exclusions in the
     * currently selected mode, otherwise GENERAL or SELECTIVE depending on
     * the current mode. Omitted when exclusions stats could not be read.
     */
    websiteExclusions?: TelemetryWebsiteExclusion;
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
     * Application type sent in telemetry events. ('VPN_EXTENSION')
     */
    appType: 'VPN_EXTENSION';

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
export interface TelemetryPageViewEventData {
    /**
     * Name of shown page, e.g. 'general_settings_screen'.
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
    pageview: TelemetryPageViewEventData;
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
 * Union type for telemetry events.
 */
export type TelemetryEvent = TelemetryPageViewEvent | TelemetryCustomEvent;

/**
 * Telemetry event data passed to the API. For documentation see:
 * - {@link TelemetryBaseData}
 * - {@link TelemetryUserAgent}
 * - {@link TelemetryProps}
 */
export interface TelemetryApiEventData {
    synthetic_id: TelemetryBaseData['syntheticId'];
    app_type: TelemetryBaseData['appType'];
    version: TelemetryBaseData['version'];
    user_agent: TelemetryUserAgent;
    pageview?: {
        name: TelemetryPageViewEventData['name'];
        ref_name?: TelemetryPageViewEventData['refName'];
    };
    event?: {
        name: TelemetryCustomEventData['name'];
        ref_name?: TelemetryCustomEventData['refName'];
        action?: TelemetryCustomEventData['action'];
        label?: TelemetryCustomEventData['label'];
    };
    props?: {
        app_locale: TelemetryProps['appLocale'];
        system_locale: TelemetryProps['systemLocale'];
        logged_in?: TelemetryProps['loggedIn'];
        license_status?: TelemetryProps['licenseStatus'];
        subscription_duration?: TelemetryProps['subscriptionDuration'];
        theme?: TelemetryProps['theme'];
        experiment_1?: TelemetryProps['experiment_1'];
        experiment_2?: TelemetryProps['experiment_2'];
        experiment_3?: TelemetryProps['experiment_3'];
        website_exclusions?: TelemetryProps['websiteExclusions'];
    };
}

/**
 * Request payload for the /api/v1/session_start endpoint.
 */
export interface SessionStartRequest {
    /**
     * Synthetic telemetry identifier.
     */
    synthetic_id: string;

    /**
     * Application type.
     */
    app_type: 'VPN_EXTENSION';

    /**
     * Extension version string.
     */
    version: string;

    /**
     * User agent info.
     */
    user_agent: TelemetryUserAgent;

    /**
     * Common telemetry props (locale, theme, etc.).
     */
    props?: {
        app_locale: string;
        system_locale: string;
        theme?: string;
        logged_in?: boolean;
        license_status?: string;
        subscription_duration?: string;
        website_exclusions?: TelemetryProps['websiteExclusions'];
    };

    /**
     * Map of experiment slots to experiment IDs for which no variant is currently cached.
     * Only unassigned slots are included.
     */
    tests: ExperimentSlotValues;
}
