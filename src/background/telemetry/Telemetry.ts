import browser from 'webextension-polyfill';
import { nanoid, customAlphabet } from 'nanoid';
import debounce from 'lodash/debounce';

import { type TelemetryProviderInterface } from '../providers/telemetryProvider';
import { type AppStatus } from '../appStatus/AppStatus';
import { type StorageInterface } from '../browserApi/storage';
import { type SettingsInterface } from '../settings/settings';
import { type AuthInterface } from '../auth';
import { type CredentialsInterface } from '../credentials/Credentials';
import { Prefs, SystemName } from '../../common/prefs';
import { AppearanceTheme, SubscriptionType } from '../../common/constants';
import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';

import {
    type TelemetryActionName,
    type TelemetryActionToScreenMap,
    TelemetryLicenseStatus,
    TelemetryOs,
    TelemetryScreenName,
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
     * @param pageId Page ID of the screen.
     */
    sendPageViewEventDebounced(
        screenName: TelemetryScreenName,
        pageId: string,
    ): Promise<void> | void;

    /**
     * Sends a telemetry custom event using {@link telemetryProvider}.
     *
     * @param actionName Name of the action.
     * @param screenName Name of the screen.
     * @param label Optional label for the event.
     */
    sendCustomEventDebounced<T extends TelemetryActionName>(
        actionName: T,
        screenName: TelemetryActionToScreenMap[T],
        label?: string,
    ): Promise<void> | void;

    /**
     * Adds opened page to the list of opened pages.
     *
     * @returns Page ID of new opened page, which can be used to remove it later.
     */
    addOpenedPage(): string;

    /**
     * Removes opened page from the list of opened pages.
     *
     * @param pageId ID of page to remove.
     */
    removeOpenedPage(pageId: string): void;
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
     * App status service.
     */
    appStatus: AppStatus;

    /**
     * Settings service.
     */
    settings: SettingsInterface;

    /**
     * Auth service.
     */
    auth: AuthInterface;

    /**
     * Credentials service.
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
 *   1) Retrieve synthetic ID from local storage, if it doesn't exist or corrupted, generate a new one
 *      and save it to local storage. Valid ID: 8 characters long, contains only [1-9a-f] characters.
 *   2) Parse and save user agent data in-memory to not calculate it for each event.
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
 * to {@link prevScreenName} and set the new screen name to {@link currentScreenName}.
 * This is used in two cases to send `refName` in page view events to keep track of the previous screen name.
 * Whenever there is no left opened pages, we reset both {@link prevScreenName} and {@link currentScreenName}
 * to `undefined`, see {@link openedPages} for more details.
 *
 * Both {@link currentScreenName} and {@link prevScreenName} are intentionally shared between
 * popup and options page instances to track cross-component navigation flows. This allows
 * accurate referral tracking when users navigate between different UI contexts (e.g. opening
 * options from popup). While this creates a shared navigation history across components,
 * product requirements approve this behavior to capture true user journey context.
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
     * This version will be sent to telemetry API if version is not detected.
     */
    private static readonly UNKNOWN_OS_VERSION = 'unknown';

    /**
     * Debounce timeout for sending events.
     */
    public static readonly SEND_EVENT_TIMEOUT = 300;

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
    private static readonly DURATION_MAPPER: Record<SubscriptionType | 'Unlimited', TelemetrySubscriptionDuration> = {
        [SubscriptionType.Monthly]: TelemetrySubscriptionDuration.Monthly,
        [SubscriptionType.Yearly]: TelemetrySubscriptionDuration.Annual,
        [SubscriptionType.TwoYears]: TelemetrySubscriptionDuration.Other,
        Unlimited: TelemetrySubscriptionDuration.Lifetime,
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
     * App status service.
     */
    private appStatus: AppStatus;

    /**
     * Settings service.
     */
    private settings: SettingsInterface;

    /**
     * Auth service.
     */
    private auth: AuthInterface;

    /**
     * Credentials service.
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
     * User agent data.
     *
     * Initialized in {@link initState} method.
     *
     * This data can be calculated once when session launched and reused for all events.
     */
    private userAgent!: TelemetryUserAgent;

    /**
     * Previous screen name.
     *
     * NOTE: This is not defined in state storage because
     * it's not needed to persist if extension is reloaded.
     */
    private prevScreenName: TelemetryScreenName | undefined = undefined;

    /**
     * Current screen name.
     *
     * NOTE: This is not defined in state storage because
     * it's not needed to persist if extension is reloaded.
     */
    private currentScreenName: TelemetryScreenName | undefined = undefined;

    /**
     * Page ID of the current screen.
     *
     * NOTE: This is not defined in state storage because
     * it's not needed to persist if extension is reloaded.
     */
    private currentScreenPageId: string | undefined = undefined;

    /**
     * Set of opened pages IDs.
     * This is needed to track all opened pages (popup, options) and whenever it gets empty
     * reset {@link prevScreenName} and {@link currentScreenName} to `undefined`.
     * We store IDs instead of booleans or counter simply to avoid case when user opens
     * multiple pages of options / popup by directly putting URL in the browser tab.
     *
     * NOTE: This is not defined in state storage because
     * it's not needed to persist if extension is reloaded.
     */
    private openedPages: Set<string> = new Set();

    /**
     * Constructor.
     */
    constructor({
        storage,
        telemetryProvider,
        appStatus,
        settings,
        auth,
        credentials,
    }: TelemetryParameters) {
        this.storage = storage;
        this.telemetryProvider = telemetryProvider;
        this.appStatus = appStatus;
        this.settings = settings;
        this.auth = auth;
        this.credentials = credentials;
        notifier.addSpecifiedListener(
            notifier.types.PORT_CONNECTED,
            this.handlePopupConnect.bind(this),
        );
        notifier.addSpecifiedListener(
            notifier.types.PORT_DISCONNECTED,
            this.handlePopupDisconnect.bind(this),
        );
    }

    /**
     * Initializes telemetry module state.
     */
    public initState = async (): Promise<void> => {
        this.syntheticId = await this.gainSyntheticId();
        this.userAgent = await Telemetry.getUserAgent();
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
     * @param screenName Name of the screen.
     * @param pageId Page ID of the screen.
     */
    private async sendPageViewEvent(
        screenName: TelemetryScreenName,
        pageId: string,
    ): Promise<void> {
        if (!this.canSendEvents()) {
            return;
        }

        /**
         * Do not send page view event if screen name is the same as the current
         * screen name and page ID is the same as the current screen page ID.
         * This condition as guard if UI renders same screen name twice
         * in a row to prevent flooding telemetry API with events.
         */
        if (
            screenName === this.currentScreenName
            && pageId === this.currentScreenPageId
        ) {
            log.debug(`Screen name '${screenName}' in page '${pageId}' is already sent as page view event`);
            return;
        }

        // Save previous and current screen names
        this.prevScreenName = this.currentScreenName;
        this.currentScreenName = screenName;

        this.currentScreenPageId = pageId;

        const baseData = await this.getBaseData();
        const event: TelemetryPageViewEventData = {
            name: this.currentScreenName,
            refName: this.prevScreenName ?? undefined,
        };

        await this.telemetryProvider.sendPageViewEvent(event, baseData);
    }

    /**
     * Debounced version of {@link sendPageViewEvent}.
     *
     * @see {@link sendPageViewEvent} - For implementation.
     * @see {@link SEND_EVENT_TIMEOUT} - For debounce timeout.
     */
    public sendPageViewEventDebounced = debounce(
        this.sendPageViewEvent.bind(this),
        Telemetry.SEND_EVENT_TIMEOUT,
    );

    /**
     * Sends a telemetry custom event using {@link telemetryProvider}.
     *
     * @param actionName Name of the action.
     * @param screenName Name of the screen.
     * @param label Optional label for the event.
     */
    private async sendCustomEvent<T extends TelemetryActionName>(
        actionName: T,
        screenName: TelemetryActionToScreenMap[T],
        label?: string,
    ): Promise<void> {
        if (!this.canSendEvents()) {
            return;
        }

        /**
         * ContextBasedScreen is a special case when custom event is sent
         * based on current active screen name. In this case, we need to
         * replace ContextBasedScreen with the actual screen name.
         *
         * If current screen name is not defined, we don't send screen name.
         * Because ref_name is optional in custom events.
         *
         * For example: Links of sidebar, sidebar is rendered in multiple screens
         * and when click event is sent, we need to know from which screen it was clicked.
         */
        let actualScreenName: TelemetryScreenName | undefined = screenName;
        if (actualScreenName === TelemetryScreenName.ContextBasedScreen) {
            actualScreenName = this.currentScreenName;
        }

        const baseData = await this.getBaseData();
        const event: TelemetryCustomEventData = {
            name: actionName,
            refName: actualScreenName,
            label,
        };

        await this.telemetryProvider.sendCustomEvent(event, baseData);
    }

    /**
     * Debounced version of {@link sendCustomEvent}.
     *
     * @see {@link sendCustomEvent} - For implementation.
     * @see {@link SEND_EVENT_TIMEOUT} - For debounce timeout.
     */
    public sendCustomEventDebounced = debounce(
        this.sendCustomEvent.bind(this),
        Telemetry.SEND_EVENT_TIMEOUT,
    );

    /**
     * Checks if telemetry events can be sent.
     *
     * @returns True if telemetry events can be sent, false otherwise.
     */
    private canSendEvents(): boolean {
        // Double check if user opted in to send telemetry events.
        // At this point we previously checked if settings enabled or not,
        // but in case if event is reached this point it means that bug appeared.
        if (!this.settings.isHelpUsImproveEnabled()) {
            log.debug('Telemetry is disabled by user but event is trying to be sent');
            return false;
        }

        // Do not send telemetry events if module is not initialized
        // only after making sure that user opted in
        // NOTE: We are not throwing an error here because telemetry
        // should neither block the application nor notify the user
        if (!this.isInitialized) {
            log.debug('Telemetry module is not initialized');
            return false;
        }

        return true;
    }

    /**
     * Handles popup connected event.
     * Adds `portName` to the list of opened pages.
     *
     * @param portName Name of the port popup connected to.
     */
    private handlePopupConnect(portName: string): void {
        this.openedPages.add(portName);
    }

    /**
     * Handles popup disconnected event.
     * Removes `portName` from the list of opened pages.
     *
     * @param portName Name of the port popup connected to.
     */
    private handlePopupDisconnect(portName: string): void {
        this.removeOpenedPage(portName);
    }

    /**
     * Adds opened page to the list of opened pages.
     *
     * @returns Page ID of new opened page, which can be used to remove it later.
     */
    public addOpenedPage = (): string => {
        const newPageId = nanoid();
        this.openedPages.add(newPageId);

        return newPageId;
    };

    /**
     * Removes opened page from the list of opened pages.
     *
     * @param pageId ID of page to remove.
     */
    public removeOpenedPage = (pageId: string): void => {
        if (!this.openedPages.has(pageId)) {
            log.debug(`Page with ID ${pageId} not found in opened pages list`);
            return;
        }

        this.openedPages.delete(pageId);

        if (this.openedPages.size === 0) {
            // Reset screen names if there are no opened pages
            this.prevScreenName = undefined;
            this.currentScreenName = undefined;
            this.currentScreenPageId = undefined;
        } else if (pageId === this.currentScreenPageId) {
            // Rotate forward screen names if current page is closed
            this.prevScreenName = this.currentScreenName;
            this.currentScreenName = undefined;
            this.currentScreenPageId = undefined;
        }
    };

    /**
     * Retrieves base data for telemetry events based on state.
     *
     * @returns Base data for telemetry events.
     */
    private async getBaseData(): Promise<TelemetryBaseData> {
        const props = await this.getProps();

        return {
            syntheticId: this.syntheticId,
            appType: Telemetry.APP_TYPE,
            version: this.appStatus.version,
            userAgent: this.userAgent,
            props,
        };
    }

    /**
     * Retrieves user agent data for telemetry events.
     *
     * @returns User agent data for telemetry events.
     */
    private static async getUserAgent(): Promise<TelemetryUserAgent> {
        // get platform related info
        const [{ os, arch }, version] = await Promise.all([
            Prefs.getPlatformInfo(),
            Prefs.getPlatformVersion(),
        ]);

        // get device related info
        const { model, vendor } = Prefs.device;
        let device: TelemetryUserAgent['device'] | undefined;

        // vendor needs to be present to include device info
        if (vendor) {
            device = {
                brand: vendor,
                model,
            };
        }

        return {
            device,
            os: {
                name: Telemetry.OS_MAPPER[os],
                platform: arch,
                version: version ?? Telemetry.UNKNOWN_OS_VERSION,
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
        const appearanceTheme = this.settings.getAppearanceTheme();
        const loggedIn = await this.auth.isAuthenticated(false);

        let licenseStatus: TelemetryLicenseStatus | undefined;
        if (loggedIn) {
            const isPremiumToken = await this.credentials.isPremiumToken();

            licenseStatus = isPremiumToken
                ? TelemetryLicenseStatus.Premium
                : TelemetryLicenseStatus.Free;
        }

        let subscriptionDuration: TelemetrySubscriptionDuration | undefined;
        if (licenseStatus === TelemetryLicenseStatus.Premium) {
            const subscriptionType = await this.credentials.getSubscriptionType();

            // If subscription type is not sent from backend - it's a lifetime subscription.
            subscriptionDuration = subscriptionType
                ? Telemetry.DURATION_MAPPER[subscriptionType]
                : Telemetry.DURATION_MAPPER.Unlimited;
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
        const syntheticId = nanoid();

        if (!Telemetry.isValidSyntheticId(syntheticId)) {
            throw new Error('Failed to generate valid synthetic ID');
        }

        return syntheticId;
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
