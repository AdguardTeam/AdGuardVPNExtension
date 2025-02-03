import browser from 'webextension-polyfill';
import { customAlphabet } from 'nanoid';

import { AppearanceTheme, SubscriptionType } from '../../common/constants';
import { Prefs, SystemName } from '../../common/prefs';
import { type TelemetryProviderInterface } from '../providers/telemetryProvider';
import { appStatus } from '../appStatus';
import { type StorageInterface } from '../browserApi/storage';
import { log } from '../../common/logger';
import { settings } from '../settings';
import { auth } from '../auth';
import { type CredentialsInterface } from '../credentials/Credentials';

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
} from './telemetryTypes';

/**
 * Telemetry interface.
 */
export interface TelemetryInterface {
    /**
     * Initializes telemetry module state.
     */
    initState(): Promise<void>;

    /**
     * Sends a telemetry page view event using {@link telemetryProvider}.
     *
     * @param screenName Name of the screen.
     */
    sendPageViewEvent(screenName: TelemetryScreenName): Promise<void>;

    /**
     * Reverts the previous page view event. This is used when a dialog is closed.
     */
    revertPageViewEvent(): Promise<void>;

    /**
     * Sends a telemetry custom event using {@link telemetryProvider}.
     *
     * @param eventData Custom event data.
     */
    sendCustomEvent(eventData: TelemetryCustomEventData): Promise<void>;
}

/**
 * Constructor parameters for {@link Telemetry}.
 */
export interface TelemetryParameters {
    /**
     * Browser local storage.
     */
    storage: StorageInterface;

    /**
     * Telemetry provider.
     */
    telemetryProvider: TelemetryProviderInterface;

    /**
     * Credentials instance.
     */
    credentials: CredentialsInterface;
}

/**
 * Telemetry service.
 * This service is responsible for sending telemetry events.
 *
 * Implementation details:
 *
 * On each new session launch (including first launch):
 *
 * Retrieve synthetic ID from local storage, if it doesn't exist or corrupted, generate a new one
 * and save it to local storage. Valid ID: 8 characters long, contains only [1-9a-f] characters.
 *
 * Common for all event dispatching methods:
 *   1) Check if extension can send events by making sure that user opted in setting and module is
 *      initialized. If module is not initialized and debug mode is enabled, we log a debug message.
 *   2) Retrieve base data (synthetic id, version, user agent, props) for telemetry events from other services.
 *   3) Send event using {@link telemetryProvider}.
 *
 * Notes about pageview events:
 * We have {@link currentScreenName} and {@link prevScreenName} props that are used to track
 * the current and previous screen names. When a new page view event is sent, we save the {@link currentScreenName}
 * to {@link prevScreenName} and set the new screen name to {@link currentScreenName}. This is used in two cases:
 * - Send `refName` in page view events.
 * - Revert to the previous screen name when nested screen (e.g. dialog) is closed.
 *
 * FIXME: Write about prev/current screen name reset logic when implemented.
 * FIXME: Implement user agent data retrieval (device, os, probably browser info).
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
     * SubscriptionType to TelemetrySubscriptionDuration mapper.
     */
    private static readonly DURATION_MAPPER: Record<SubscriptionType, TelemetrySubscriptionDuration> = {
        [SubscriptionType.Monthly]: TelemetrySubscriptionDuration.Monthly,
        [SubscriptionType.Yearly]: TelemetrySubscriptionDuration.Annual,
        [SubscriptionType.TwoYears]: TelemetrySubscriptionDuration.Other,
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
     * Credentials instance.
     */
    private credentials: CredentialsInterface;

    /**
     * Flag indicating whether telemetry module is initialized or not.
     */
    private isInitialized = false;

    /**
     * Synthetic ID.
     *
     * Initialized in {@link initState} method.
     */
    private syntheticId!: string;

    /**
     * Previous screen name.
     *
     * NOTE: This is not defined in state storage because
     * it's not needed to persist if extension is reloaded.
     */
    private prevScreenName: TelemetryScreenName | null = null;

    /**
     * Current screen name.
     *
     * NOTE: This is not defined in state storage because
     * it's not needed to persist if extension is reloaded.
     */
    private currentScreenName: TelemetryScreenName | null = null;

    /**
     * Constructor.
     */
    constructor({
        storage,
        telemetryProvider,
        credentials,
    }: TelemetryParameters) {
        this.storage = storage;
        this.telemetryProvider = telemetryProvider;
        this.credentials = credentials;
    }

    /**
     * Initializes telemetry module state.
     */
    public initState = async (): Promise<void> => {
        this.syntheticId = await this.gainSyntheticId();
        this.isInitialized = true;
    };

    /**
     * Retrieves synthetic ID from local storage. If it doesn't exist or corrupted, generates a new one.
     *
     * @returns Synthetic ID.
     */
    private async gainSyntheticId(): Promise<string> {
        let syntheticId = await this.storage.get<string>(Telemetry.SYNTHETIC_ID_KEY);

        // Generate new synthetic ID if it doesn't exist or corrupted in local storage
        if (!syntheticId || !Telemetry.isValidSyntheticId(syntheticId)) {
            log.debug('Generating new synthetic id');
            syntheticId = Telemetry.generateSyntheticId();
            await this.storage.set(Telemetry.SYNTHETIC_ID_KEY, syntheticId);
        }

        return syntheticId;
    }

    /**
     * Sends a telemetry page view event using {@link telemetryProvider}.
     *
     * This method is used internally to send page view events.
     */
    private async internalSendPageViewEvent(): Promise<void> {
        if (!this.canSendEvents() || !this.currentScreenName) {
            return;
        }

        if (!this.currentScreenName) {
            log.warn('Failed to send page view event: current screen name is not set', {
                currentScreenName: this.currentScreenName,
                prevScreenName: this.prevScreenName,
            });
            return;
        }

        const baseData = await this.getBaseData();
        const event: TelemetryPageViewEventData = {
            name: this.currentScreenName,
            refName: this.prevScreenName ?? undefined,
        };

        await this.telemetryProvider.sendPageViewEvent(event, baseData);
    }

    /**
     * Sends a telemetry page view event using {@link telemetryProvider}.
     *
     * @param screenName Name of the screen.
     */
    public sendPageViewEvent = async (screenName: TelemetryScreenName): Promise<void> => {
        // Save previous and current screen names
        this.prevScreenName = this.currentScreenName;
        this.currentScreenName = screenName;

        await this.internalSendPageViewEvent();
    };

    /**
     * Reverts the previous page view event. This is used when a dialog is closed.
     */
    public revertPageViewEvent = async (): Promise<void> => {
        // Do not revert if previous screen name is not set
        if (!this.prevScreenName) {
            return;
        }

        // Revert previous and current screen names
        const temp = this.currentScreenName;
        this.currentScreenName = this.prevScreenName;
        this.prevScreenName = temp;

        await this.internalSendPageViewEvent();
    };

    /**
     * Sends a telemetry custom event using {@link telemetryProvider}.
     *
     * @param eventData Custom event data.
     */
    public sendCustomEvent = async (event: TelemetryCustomEventData): Promise<void> => {
        if (!this.canSendEvents()) {
            return;
        }

        const baseData = await this.getBaseData();

        await this.telemetryProvider.sendCustomEvent(event, baseData);
    };

    /**
     * Checks if telemetry events can be sent.
     *
     * @returns True if telemetry events can be sent, false otherwise.
     */
    private canSendEvents(): boolean {
        // Do not send telemetry events if user opted out
        if (!settings.isHelpUsImproveEnabled()) {
            return false;
        }

        // Do not send telemetry events if module is not initialized
        // only after making sure that user opted in
        // NOTE: We are not throwing an error here because telemetry
        // should not block the application nor notify the user
        if (!this.isInitialized) {
            if (settings.isDebugModeEnabled()) {
                log.debug('Telemetry module is not initialized');
            }
            return false;
        }

        return true;
    }

    /**
     * Retrieves base data for telemetry events based on state.
     *
     * @returns Base data for telemetry events.
     */
    private async getBaseData(): Promise<TelemetryBaseData> {
        const [userAgent, props] = await Promise.all([
            this.getUserAgent(),
            this.getProps(),
        ]);

        return {
            syntheticId: this.syntheticId,
            appType: Telemetry.APP_TYPE,
            version: appStatus.version,
            userAgent,
            props,
        };
    }

    /**
     * Sets user agent data for telemetry events.
     *
     * @returns User agent data for telemetry events.
     */
    private async getUserAgent(): Promise<TelemetryUserAgent> {
        const { os, arch } = await Prefs.getPlatformInfo();

        return {
            device: {
                brand: 'FIXME: Can it be retrieved?',
                model: 'FIXME: Can it be retrieved?',
            },
            os: {
                name: Telemetry.OS_MAPPER[os],
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
    private async getProps(): Promise<TelemetryProps> {
        const locale = browser.i18n.getUILanguage();
        const appearanceTheme = settings.getAppearanceTheme();
        const loggedIn = !!(await auth.isAuthenticated(false));

        let licenseStatus: TelemetryLicenseStatus | undefined;
        let subscriptionDuration: TelemetrySubscriptionDuration | undefined;
        if (loggedIn) {
            const isPremiumToken = await this.credentials.isPremiumToken();
            if (isPremiumToken) {
                licenseStatus = TelemetryLicenseStatus.Premium;
            } else {
                licenseStatus = TelemetryLicenseStatus.Free;
            }

            if (licenseStatus !== TelemetryLicenseStatus.Free) {
                const subscriptionType = this.credentials.getSubscriptionType();

                if (subscriptionType) {
                    subscriptionDuration = Telemetry.DURATION_MAPPER[subscriptionType];
                } else {
                    // If subscription type is not sent from backend - it's a lifetime subscription.
                    subscriptionDuration = TelemetrySubscriptionDuration.Lifetime;
                }
            }
        }

        return {
            appLocale: locale,
            systemLocale: locale,
            loggedIn,
            licenseStatus,
            subscriptionDuration,
            theme: Telemetry.THEME_MAPPER[appearanceTheme],
        };
    }

    /**
     * Generates synthetic ID with the given length and alphabet.
     *
     * @returns Synthetic ID.
     */
    private static generateSyntheticId(): string {
        const nanoid = customAlphabet(
            Telemetry.SYNTHETIC_ID_ALPHABET,
            Telemetry.SYNTHETIC_ID_SIZE,
        );
        return nanoid();
    }

    /**
     * Checks if the given synthetic ID is valid.
     *
     * @param syntheticId Synthetic ID to check.
     * @returns True if the synthetic ID is valid, false otherwise.
     */
    private static isValidSyntheticId(syntheticId: string): boolean {
        if (syntheticId.length !== Telemetry.SYNTHETIC_ID_SIZE) {
            return false;
        }

        for (let i = 0; i < syntheticId.length; i += 1) {
            if (!Telemetry.SYNTHETIC_ID_ALPHABET.includes(syntheticId[i])) {
                return false;
            }
        }

        return true;
    }
}
