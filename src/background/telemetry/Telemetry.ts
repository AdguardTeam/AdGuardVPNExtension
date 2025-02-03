import browser from 'webextension-polyfill';
import { customAlphabet } from 'nanoid';

import { AppearanceTheme, SubscriptionType } from '../../common/constants';
import { Prefs, SystemName } from '../../common/prefs';
import { type TelemetryProviderInterface } from '../providers/telemetryProvider';
import { appStatus } from '../appStatus';
import { type StorageInterface } from '../browserApi/storage';
import { log } from '../../common/logger';
import { type TelemetryState } from '../schema/telemetry';
import { stateStorage } from '../stateStorage';
import { StorageKey } from '../schema';
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
    initState(): void;

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
 *
 * FIXME:
 * - Implement user agent data retrieval (device, os, probably browser info).
 * - Implement prev/current screen name reset logic.
 * - Add tests for telemetry api / provider / module.
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
     * Telemetry state.
     */
    private state: TelemetryState;

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
     * Initializes telemetry module state.
     */
    public initState(): void {
        this.state = stateStorage.getItem(StorageKey.TelemetryState);
    }

    /**
     * Saves telemetry state to state storage.
     */
    private saveTelemetryState() {
        stateStorage.setItem(StorageKey.TelemetryState, this.state);
    }

    /**
     * Sends a telemetry page view event using {@link telemetryProvider}.
     *
     * This method is used internally to send page view events.
     */
    private async internalSendPageViewEvent(): Promise<void> {
        // Do not send telemetry events if user opted out
        // or if current screen name is not set
        if (!settings.isHelpUsImproveEnabled() || !this.currentScreenName) {
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
        if (!settings.isHelpUsImproveEnabled()) {
            return;
        }

        const baseData = await this.getBaseData();

        await this.telemetryProvider.sendCustomEvent(event, baseData);
    };

    /**
     * Retrieves base data for telemetry events based on state.
     *
     * @returns Base data for telemetry events.
     */
    private async getBaseData(): Promise<TelemetryBaseData> {
        const [syntheticId, userAgent, props] = await Promise.all([
            this.getSyntheticId(),
            this.getUserAgent(),
            this.getProps(),
        ]);

        return {
            syntheticId,
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
            // FIXME: How should I determine Trial subscription?

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
     * Retrieves synthetic ID from local storage. If it doesn't exist, generates a new one.
     *
     * @returns Synthetic ID.
     */
    private async gainSyntheticId(): Promise<string> {
        let syntheticId = await this.storage.get<string>(Telemetry.SYNTHETIC_ID_KEY);

        if (!syntheticId) {
            log.debug('Generating new synthetic id');

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
