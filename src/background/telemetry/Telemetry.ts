import browser from 'webextension-polyfill';

import { AppearanceTheme } from '../../common/constants';
import { Prefs, SystemName } from '../../common/prefs';
import { appStatus } from '../appStatus';
import { type TelemetryProviderInterface } from '../providers/telemetryProvider';
import { type BrowserApi } from '../browserApi';
import { type StorageInterface } from '../browserApi/storage';

import {
    type TelemetryScreenName,
    type TelemetryActionName,
    TelemetryLicenseStatus,
    TelemetryOs,
    TelemetrySubscriptionDuration,
    TelemetryTheme,
} from './telemetryEnums';
import {
    type TelemetryBaseData,
    type TelemetryProps,
    type TelemetryPageViewEventData,
    type TelemetryCustomEventData,
    type TelemetryUserAgent,
} from './telemetryTypes';

export interface TelemetryInterface {
    /**
     * Sends a telemetry page view event using {@link telemetryProvider}.
     *
     * @param screenName Name of the screen.
     */
    sendPageViewEvent(screenName: TelemetryScreenName): Promise<void>;

    /**
     * Sends a telemetry custom event using {@link telemetryProvider}.
     *
     * @param actionName Name of the action.
     */
    sendCustomEvent(actionName: TelemetryActionName): Promise<void>;
}

export interface TelemetryParameters {
    browserApi: BrowserApi;
    telemetryProvider: TelemetryProviderInterface;
}

export class Telemetry implements TelemetryInterface {
    /**
     * Application type sent in telemetry events
     */
    private static APP_TYPE = 'VPN_EXTENSION';

    /**
     * Key for synthetic ID in local storage.
     */
    private static SYNTHETIC_ID_KEY = 'telemetry.synthetic.id';

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
     * Browser local storage.
     */
    private storage: StorageInterface;

    /**
     * Telemetry provider.
     */
    private telemetryProvider: TelemetryProviderInterface;

    constructor({
        browserApi,
        telemetryProvider,
    }: TelemetryParameters) {
        this.storage = browserApi.storage;
        this.telemetryProvider = telemetryProvider;
    }

    /**
     * Sends a telemetry page view event using {@link telemetryProvider}.
     *
     * @param screenName Name of the screen.
     */
    public sendPageViewEvent = async (screenName: TelemetryScreenName): Promise<void> => {
        // FIXME: Add check if settings enabled or not
        const baseData = await this.getBaseData();
        const event: TelemetryPageViewEventData = {
            name: screenName,
            refName: undefined, // FIXME: Implement current screen name
        };

        this.telemetryProvider.sendPageViewEvent(event, baseData);
    };

    /**
     * Sends a telemetry custom event using {@link telemetryProvider}.
     *
     * @param actionName Name of the action.
     */
    public sendCustomEvent = async (actionName: TelemetryActionName): Promise<void> => {
        // FIXME: Add check if settings enabled or not
        const baseData = await this.getBaseData();
        const event: TelemetryCustomEventData = {
            name: actionName,
            refName: undefined, // FIXME: Implement current screen name
            action: undefined, // FIXME: What should I pass?
            label: undefined, // FIXME: What should I pass?
        };

        this.telemetryProvider.sendCustomEvent(event, baseData);
    };

    /**
     * Retrieves base data for telemetry events based on state.
     *
     * @returns Base data for telemetry events.
     */
    private async getBaseData(): Promise<TelemetryBaseData> {
        const { version } = appStatus;
        const userAgent = await this.getUserAgent();
        const props = this.getProps();

        return {
            syntheticId: 'FIXME: Take it from storage',
            appType: Telemetry.APP_TYPE,
            version,
            userAgent,
            props,
        };
    }

    /**
     * Sets user agent data for telemetry events.
     */
    private async getUserAgent(): Promise<TelemetryUserAgent> {
        const { os, arch } = await Prefs.getPlatformInfo();
        const osName = Telemetry.OS_MAPPER[os];

        return {
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

        const appearanceTheme = AppearanceTheme.System; // FIXME: How should I retrieve this data?
        const theme = appearanceTheme && Telemetry.THEME_MAPPER[appearanceTheme];

        return {
            appLocale: locale,
            systemLocale: locale,
            loggedIn: false, // FIXME: How should I retrieve this data?
            licenseStatus: TelemetryLicenseStatus.Free, // FIXME: How should I retrieve this data?
            subscriptionDuration: TelemetrySubscriptionDuration.Other, // FIXME: How should I retrieve this data?
            theme,
        };
    }
}
