import browser from 'webextension-polyfill';
import { customAlphabet } from 'nanoid';

import { AppearanceTheme } from '../../common/constants';
import { Prefs, SystemName } from '../../common/prefs';
import { appStatus } from '../appStatus';
import { type TelemetryProviderInterface } from '../providers/telemetryProvider';
import { type BrowserApi } from '../browserApi';
import { type StorageInterface } from '../browserApi/storage';
import { log } from '../../common/logger';
import { type TelemetryState } from '../schema/telemetry';
import { stateStorage } from '../stateStorage';
import { StorageKey } from '../schema';

import {
    type TelemetryScreenName,
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
    type TelemetrySendCustomEventData,
} from './telemetryTypes';

/**
 * Telemetry interface.
 */
export interface TelemetryInterface {
    /**
     * Initializes telemetry module.
     */
    init(): Promise<void>;

    /**
     * Sends a telemetry page view event using {@link telemetryProvider}.
     *
     * @param screenName Name of the screen.
     */
    sendPageViewEvent(screenName: TelemetryScreenName): Promise<void>;

    /**
     * Sends a telemetry custom event using {@link telemetryProvider}.
     *
     * @param eventData Custom event data.
     */
    sendCustomEvent(eventData: TelemetrySendCustomEventData): Promise<void>;
}

/**
 * Constructor parameters for {@link Telemetry}.
 */
export interface TelemetryParameters {
    /**
     * Browser API.
     */
    browserApi: BrowserApi;

    /**
     * Telemetry provider.
     */
    telemetryProvider: TelemetryProviderInterface;
}

/**
 * Telemetry service.
 *
 * FIXME:
 * - Implement checking if telemetry is enabled.
 * - Implement user agent data retrieval (device, os, probably browser info).
 * - Implement props data retrieval (appearanceTheme, loggedIn, licenseStatus, subscriptionDuration).
 * - Implement prev/current screen name reset logic.
 * - Correct prev/current logic if dialog is opened.
 */
export class Telemetry implements TelemetryInterface {
    /**
     * Application type sent in telemetry events
     */
    private static readonly APP_TYPE = 'VPN_EXTENSION';

    /**
     * Key for synthetic ID in local storage.
     */
    private static readonly SYNTHETIC_ID_KEY = 'telemetry.synthetic.id';

    /**
     * Synthetic ID alphabet.
     */
    private static readonly SYNTHETIC_ID_ALPHABET = 'abcdef123456789';

    /**
     * Synthetic ID size.
     */
    private static readonly SYNTHETIC_ID_SIZE = 8;

    /**
     * SystemName to TelemetryOs mapper.
     */
    private static readonly OS_MAPPER: Record<SystemName, TelemetryOs> = {
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
    private static readonly THEME_MAPPER: Record<AppearanceTheme, TelemetryTheme> = {
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

    /**
     * Telemetry state.
     */
    private state: TelemetryState;

    /**
     * Constructor.
     */
    constructor({
        browserApi,
        telemetryProvider,
    }: TelemetryParameters) {
        this.storage = browserApi.storage;
        this.telemetryProvider = telemetryProvider;
    }

    /**
     * Synthetic ID getter.
     */
    private get syntheticId(): string | null {
        return this.state.syntheticId;
    }

    /**
     * Synthetic ID setter.
     */
    private set syntheticId(syntheticId: string | null) {
        this.state.syntheticId = syntheticId;
        this.saveTelemetryState();
    }

    /**
     * Initializes telemetry module.
     */
    public async init(): Promise<void> {
        try {
            this.state = stateStorage.getItem(StorageKey.TelemetryState);
        } catch (e) {
            log.debug('Unable to init telemetry module, due to error:', e.message);
        }
        log.info('Telemetry module is ready');
    }

    /**
     * Sends a telemetry page view event using {@link telemetryProvider}.
     *
     * @param screenName Name of the screen.
     */
    public sendPageViewEvent = async (screenName: TelemetryScreenName): Promise<void> => {
        // FIXME: Add check if settings enabled or not

        // Save previous and current screen names
        this.state.prevScreenName = this.state.currentScreenName;
        this.state.currentScreenName = screenName;
        this.saveTelemetryState();

        const baseData = await this.getBaseData();
        const event: TelemetryPageViewEventData = {
            name: screenName,
            refName: this.state.prevScreenName ?? undefined,
        };

        await this.telemetryProvider.sendPageViewEvent(event, baseData);
    };

    /**
     * Sends a telemetry custom event using {@link telemetryProvider}.
     *
     * @param eventData Custom event data.
     */
    public sendCustomEvent = async (eventData: TelemetrySendCustomEventData): Promise<void> => {
        // FIXME: Add check if settings enabled or not
        const baseData = await this.getBaseData();
        const event: TelemetryCustomEventData = {
            ...eventData,
            refName: this.state.currentScreenName ?? undefined,
        };

        await this.telemetryProvider.sendCustomEvent(event, baseData);
    };

    /**
     * Saves telemetry state to state storage.
     */
    private saveTelemetryState() {
        stateStorage.setItem(StorageKey.TelemetryState, this.state);
    }

    /**
     * Retrieves base data for telemetry events based on state.
     *
     * @returns Base data for telemetry events.
     */
    private async getBaseData(): Promise<TelemetryBaseData> {
        const syntheticId = await this.getSyntheticId();
        const appType = Telemetry.APP_TYPE;
        const { version } = appStatus;
        const userAgent = await this.getUserAgent();
        const props = this.getProps();

        return {
            syntheticId,
            appType,
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

    /**
     * Retrieves synthetic ID from local storage. If it doesn't exist, generates a new one.
     *
     * @returns Synthetic ID.
     */
    private async gainSyntheticId(): Promise<string> {
        let syntheticId = await this.storage.get<string>(Telemetry.SYNTHETIC_ID_KEY);

        if (!syntheticId) {
            log.debug('Generating new app id');

            const nanoid = customAlphabet(
                Telemetry.SYNTHETIC_ID_ALPHABET,
                Telemetry.SYNTHETIC_ID_SIZE,
            );
            syntheticId = nanoid();

            await this.storage.set(Telemetry.SYNTHETIC_ID_KEY, syntheticId);
        }

        return syntheticId;
    }

    /**
     * Retrieves synthetic ID. If it doesn't exist, generates a new one.
     *
     * @returns Synthetic ID.
     */
    private async getSyntheticId(): Promise<string> {
        if (!this.syntheticId) {
            this.syntheticId = await this.gainSyntheticId();
        }

        return this.syntheticId;
    }
}
