import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';
import { type ConnectivityStateChangeEvent, type WsConnectivityInfoMsgTraffic } from '../connectivity';
import { type CredentialsInterface } from '../credentials/Credentials';
import { StorageKey, type LocationInterface, ConnectivityStateType } from '../schema';
import { type StatisticsState } from '../schema/statistics';
import { type StateStorageInterface } from '../stateStorage/stateStorage';
import { type TimersInterface } from '../timers/AbstractTimers';

import { type StatisticsStorageInterface } from './StatisticsStorage';
import { type StatisticsAccountData, type AddStatisticsDataBase } from './statisticsTypes';

/**
 * Methods that are forwarded to the statistics storage.
 */
type StorageForwardedMethods = Pick<StatisticsStorageInterface, 'getAccountStatistics' | 'clearAccountStatistics'>;

type NotifierArg =
    WsConnectivityInfoMsgTraffic
    | LocationInterface
    | ConnectivityStateChangeEvent
    | boolean
    | undefined;

/**
 * Statistics provider interface.
 */
export interface StatisticsProviderInterface extends StorageForwardedMethods {
    /**
     * Initializes the statistics provider.
     */
    init(): Promise<void>;
}

/**
 * Constructor parameters for {@link StatisticsProvider}.
 */
export interface StatisticsProviderParameters {
    /**
     * Browser session storage.
     */
    stateStorage: StateStorageInterface;

    /**
     * Storage for statistics.
     */
    statisticsStorage: StatisticsStorageInterface;

    /**
     * Credentials instance.
     */
    credentials: CredentialsInterface;

    /**
     * Timers instance.
     */
    timers: TimersInterface;
}

/**
 * Statistics provider.
 * This class is responsible for providing statistics data to {@link StatisticsStorageInterface}.
 * It listens to events from the {@link notifier} and updates the statistics storage accordingly.
 * Also, it sets interval to update the connection duration data every 5 minutes.
 * Interval is started only when the user is connected to the Proxy.
 *
 * Before updating the statistics storage, it performs following checks:
 * - Is the user a premium user?
 * - Is the user authenticated?
 * - Is the user selected a location?
 *
 * If any of these checks fail, the statistics storage will not be updated.
 */
export class StatisticsProvider implements StatisticsProviderInterface {
    /**
     * Update duration interval in milliseconds (5 minutes).
     */
    private static readonly TIMER_UPDATE_INTERVAL = 5 * 60 * 1000;

    /**
     * List of events that are used to update the statistics storage.
     */
    private static readonly NOTIFIER_EVENTS = [
        notifier.types.TRAFFIC_STATS_UPDATED,
        notifier.types.CURRENT_LOCATION_UPDATED,
        notifier.types.TOKEN_PREMIUM_STATE_UPDATED,
        notifier.types.CONNECTIVITY_STATE_CHANGED,
        notifier.types.USER_AUTHENTICATED,
        notifier.types.USER_DEAUTHENTICATED,
    ];

    /**
     * Browser session storage.
     */
    private stateStorage: StateStorageInterface;

    /**
     * Storage for statistics.
     */
    private statisticsStorage: StatisticsStorageInterface;

    /**
     * Credentials instance.
     */
    private credentials: CredentialsInterface;

    /**
     * Timers instance.
     */
    private timers: TimersInterface;

    /**
     * State of the statistics provider.
     *
     * Initialized in {@link init} method.
     */
    private state: StatisticsState;

    /**
     * Constructor.
     */
    constructor({
        stateStorage,
        statisticsStorage,
        credentials,
        timers,
    }: StatisticsProviderParameters) {
        this.stateStorage = stateStorage;
        this.statisticsStorage = statisticsStorage;
        this.credentials = credentials;
        this.timers = timers;

        notifier.addSpecifiedListener(
            StatisticsProvider.NOTIFIER_EVENTS,
            this.handleNotifierEvent.bind(this),
        );
    }

    /**
     * Saves the current state of the statistics provider to session storage.
     */
    private saveState(): void {
        this.stateStorage.setItem(StorageKey.StatisticsState, this.state);
    }

    /**
     * `isPremiumToken` state property getter.
     */
    private get isPremiumToken(): boolean {
        return this.state.isPremiumToken;
    }

    /**
     * `isPremiumToken` state property setter.
     */
    private set isPremiumToken(value: boolean) {
        this.state.isPremiumToken = value;
        this.saveState();
    }

    /**
     * `locationId` state property getter.
     */
    private get locationId(): string | null {
        return this.state.locationId;
    }

    /**
     * `locationId` state property setter.
     */
    private set locationId(value: string | null) {
        this.state.locationId = value;
        this.saveState();
    }

    /**
     * `accountId` state property getter.
     */
    private get accountId(): string | null {
        return this.state.accountId;
    }

    /**
     * `accountId` state property setter.
     */
    private set accountId(value: string | null) {
        this.state.accountId = value;
        this.saveState();
    }

    /**
     * `durationIntervalId` state property getter.
     */
    private get durationIntervalId(): number | null {
        return this.state.durationIntervalId;
    }

    /**
     * `durationIntervalId` state property setter.
     */
    private set durationIntervalId(value: number | null) {
        this.state.durationIntervalId = value;
        this.saveState();
    }

    /**
     * Initializes the statistics provider.
     */
    public init = async (): Promise<void> => {
        try {
            this.state = this.stateStorage.getItem(StorageKey.StatisticsState);
            await this.statisticsStorage.init();
            log.info('Statistics provider ready');
        } catch (e) {
            log.error('Unable to initialize statistics provider, due to error:', e);
        }
    };

    /**
     * Gets statistics data for the given account ID.
     *
     * @param accountId Account ID to get statistics for.
     *
     * @returns Statistics data for the given account ID,
     * or `null` if stats didn't started collecting yet.
     */
    public getAccountStatistics = (accountId: string): StatisticsAccountData | null => {
        return this.statisticsStorage.getAccountStatistics(accountId);
    };

    /**
     * Clears all statistics for the given account ID.
     *
     * @param accountId Account ID to clear statistics for.
     */
    public clearAccountStatistics = async (accountId: string): Promise<void> => {
        await this.statisticsStorage.clearAccountStatistics(accountId);
    };

    /**
     * Retrieves the base data for adding statistics.
     *
     * @returns Base data for adding statistics or null if account ID / location ID is not set,
     * or if the token is not premium.
     */
    private getAddBaseData(): AddStatisticsDataBase | null {
        if (!this.isPremiumToken || !this.accountId || !this.locationId) {
            return null;
        }

        return {
            accountId: this.accountId,
            locationId: this.locationId,
        };
    }

    /**
     * Clears the duration interval.
     */
    private clearDurationInterval(): void {
        if (this.durationIntervalId) {
            this.timers.clearInterval(this.durationIntervalId);
            this.durationIntervalId = null;
        }
    }

    /**
     * Starts the duration interval.
     */
    private startDurationInterval(): void {
        this.clearDurationInterval();

        this.durationIntervalId = this.timers.setInterval(
            this.handleTimerUpdate.bind(this),
            StatisticsProvider.TIMER_UPDATE_INTERVAL,
        );
    }

    /**
     * Handles event from the notifier.
     *
     * @param event Event type.
     * @param args Event arguments.
     */
    // eslint-disable-next-line consistent-return
    private handleNotifierEvent(event: string, arg: NotifierArg): void | Promise<void> {
        switch (event) {
            case notifier.types.TRAFFIC_STATS_UPDATED:
                return this.handleTrafficStatsUpdated(arg as WsConnectivityInfoMsgTraffic);
            case notifier.types.CURRENT_LOCATION_UPDATED:
                return this.handleCurrentLocationUpdated(arg as LocationInterface);
            case notifier.types.TOKEN_PREMIUM_STATE_UPDATED:
                return this.handleTokenPremiumStateUpdated(arg as boolean);
            case notifier.types.CONNECTIVITY_STATE_CHANGED:
                return this.handleConnectivityStateChanged(arg as ConnectivityStateChangeEvent);
            case notifier.types.USER_AUTHENTICATED:
                return this.handleUserAuthenticated();
            case notifier.types.USER_DEAUTHENTICATED:
                return this.handleUserDeauthenticated();
            default:
                // Do nothing
                break;
        }
    }

    /**
     * Handles traffic statistics event by updating the statistics storage.
     * This event is fired when websocket sends traffic usage data.
     *
     * @param event Stats event data.
     */
    private async handleTrafficStatsUpdated({
        bytesDownloaded,
        bytesUploaded,
    }: WsConnectivityInfoMsgTraffic): Promise<void> {
        const baseData = this.getAddBaseData();

        /**
         * Do nothing if we can't add statistics because of any of the following:
         * - User is not a premium
         * - Account ID is not set
         * - Location ID is not set
         *
         * Note: We do not check if the user is connected because the traffic statistics
         * are sent only when the user is connected to WebSocket. But there might be
         * case when WebSocket sends this event later when user is already disconnected from Proxy.
         */
        if (!baseData) {
            return;
        }

        // Add traffic statistics to storage
        await this.statisticsStorage.addTraffic({
            ...baseData,
            downloaded: bytesDownloaded,
            uploaded: bytesUploaded,
        });
    }

    /**
     * Handles current location updated event.
     * This event is fired when user selects a new location.
     *
     * @param location Updated location.
     */
    private handleCurrentLocationUpdated({ id }: LocationInterface): void {
        this.locationId = id;
    }

    /**
     * Handles token premium state updated event.
     * This event is fired when user's token is updated and sends isPremiumToken flag.
     *
     * @param isPremiumToken Indicates whether the token is premium.
     */
    private handleTokenPremiumStateUpdated(isPremiumToken: boolean): void {
        this.isPremiumToken = isPremiumToken;
    }

    /**
     * Handles connectivity state changed event.
     * This event is fired when the connectivity state changes.
     *
     * @param state Connectivity state change event data.
     */
    private async handleConnectivityStateChanged({ value }: ConnectivityStateChangeEvent): Promise<void> {
        const baseData = this.getAddBaseData();

        /**
         * Do nothing if we can't add statistics because of any of the following:
         * - User is not a premium
         * - Account ID is not set
         * - Location ID is not set
         */
        if (!baseData) {
            return;
        }

        if (value === ConnectivityStateType.Connected) {
            await this.statisticsStorage.startDuration(baseData);
            this.startDurationInterval();
        } else {
            await this.statisticsStorage.endDuration(baseData);
            this.clearDurationInterval();
        }
    }

    /**
     * Handles user authenticated event.
     * This event is fired when user is authenticated.
     */
    private async handleUserAuthenticated(): Promise<void> {
        const accountId = await this.credentials.getUsername();

        if (accountId) {
            this.accountId = accountId;
            await this.statisticsStorage.addAccount(accountId);
        }
    }

    /**
     * Handles user logged out event.
     * This event is fired when user is deauthenticated.
     */
    private handleUserDeauthenticated(): void {
        this.accountId = null;
    }

    /**
     * Handles timer update event.
     * This event is fired at regular intervals to update the duration statistics.
     */
    private async handleTimerUpdate(): Promise<void> {
        const baseData = this.getAddBaseData();

        /**
         * Do nothing if we can't add statistics because of any of the following:
         * - User is not a premium
         * - Account ID is not set
         * - Location ID is not set
         *
         * Note: We do not check if the user is connected because interval is started
         * only when user is connected to Proxy. Otherwise, the interval is cleared.
         */
        if (!baseData) {
            return;
        }

        await this.statisticsStorage.updateDuration(baseData);
    }
}
