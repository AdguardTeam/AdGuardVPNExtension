import browser from 'webextension-polyfill';

import { AppearanceTheme } from '../../common/constants';
import { Prefs, SystemName } from '../../common/prefs';
import { appStatus } from '../appStatus';
import { telemetryProvider } from '../providers/telemetryProvider';

import {
    TelemetryLicenseStatus,
    TelemetryOs,
    TelemetrySubscriptionDuration,
    TelemetryTheme,
} from './telemetryEnums';
import {
    type TelemetryBaseData,
    type TelemetryUserAgent,
    type TelemetryProps,
    type TelemetryPageViewEventData,
    type TelemetryCustomEventData,
} from './telemetryTypes';

export interface TelemetryInterface {
    /**
     * Sends a telemetry page view event using {@link telemetryProvider}.
     *
     * @param event Page view event data.
     */
    sendPageViewEvent(event: TelemetryPageViewEventData): Promise<void>;

    /**
     * Sends a telemetry custom event using {@link telemetryProvider}.
     *
     * @param event Custom event data.
     */
    sendCustomEvent(event: TelemetryCustomEventData): Promise<void>;
}

export class Telemetry implements TelemetryInterface {
    /**
     * Application type sent in telemetry events
     */
    private static APP_TYPE = 'VPN_EXTENSION';

    /**
     * SystemName to TelemetryOs mapper.
     */
    private static OS_MAPPER: Record<SystemName, TelemetryOs> = {
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
    private static THEME_MAPPER: Record<AppearanceTheme, TelemetryTheme> = {
        [AppearanceTheme.Light]: TelemetryTheme.Light,
        [AppearanceTheme.Dark]: TelemetryTheme.Dark,
        [AppearanceTheme.System]: TelemetryTheme.System,
    };

    /**
     * User agent data for telemetry events.
     * Initialized in {@link init} method.
     */
    private userAgent!: TelemetryUserAgent;

    async init(): Promise<void> {
        await this.updateUserAgent();
    }

    /**
     * Sends a telemetry page view event using {@link telemetryProvider}.
     *
     * @param event Page view event data.
     */
    public sendPageViewEvent = async (event: TelemetryPageViewEventData): Promise<void> => {
        const baseData = this.getBaseData();
        telemetryProvider.sendPageViewEvent(event, baseData);
    };

    /**
     * Sends a telemetry custom event using {@link telemetryProvider}.
     *
     * @param event Custom event data.
     */
    public sendCustomEvent = async (event: TelemetryCustomEventData): Promise<void> => {
        const baseData = this.getBaseData();
        telemetryProvider.sendCustomEvent(event, baseData);
    };

    /**
     * Retrieves base data for telemetry events based on state.
     *
     * @returns Base data for telemetry events.
     */
    private getBaseData(): TelemetryBaseData {
        const props = this.getProps();

        return {
            syntheticId: 'FIXME: Take it from storage',
            appType: Telemetry.APP_TYPE,
            version: appStatus.version,
            userAgent: this.userAgent,
            props,
        };
    }

    /**
     * Sets user agent data for telemetry events.
     */
    private async updateUserAgent(): Promise<void> {
        const { os, arch } = await Prefs.getPlatformInfo();
        const osName = Telemetry.OS_MAPPER[os];

        this.userAgent = {
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
    }

    /**
     * Retrieves props data passed in telemetry events.
     *
     * @returns Props data for telemetry events.
     */
    private getProps(): TelemetryProps {
        const locale = browser.i18n.getUILanguage();

        const appearanceTheme = AppearanceTheme.System; // FIXME: Take it from fields
        const theme = appearanceTheme && Telemetry.THEME_MAPPER[appearanceTheme];

        return {
            appLocale: locale,
            systemLocale: locale,
            loggedIn: false, // FIXME: Take it from fields
            licenseStatus: TelemetryLicenseStatus.Free, // FIXME: Take it from fields
            subscriptionDuration: TelemetrySubscriptionDuration.Other, // FIXME: Take it from fields
            theme,
        };
    }
}
