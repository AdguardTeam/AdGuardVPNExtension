import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';
import { type StorageInterface } from '../browserApi/storage';
import { type ConnectivityStateChangeEvent, type WsConnectivityInfoMsgTraffic } from '../connectivity';
import { type CredentialsInterface } from '../credentials/Credentials';
import { type LocationInterface, ConnectivityStateType } from '../schema';
import { type TimersInterface } from '../timers/AbstractTimers';

import { type StatisticsStorageInterface } from './StatisticsStorage';

type NotifierArg =
    WsConnectivityInfoMsgTraffic
    | LocationInterface
    | ConnectivityStateChangeEvent
    | boolean;

/**
 * Statistics provider interface.
 */
export interface StatisticsProviderInterface {
    /**
     * Initializes the statistics provider.
     */
    init(): Promise<void>;

    /**
     * Sets is statistics collection disabled or not.
     *
     * @param isDisabled Indicates whether the statistics collection is disabled.
     */
    setIsDisabled(isDisabled: boolean): Promise<void>;

    /**
     * Checks if the statistics collection is disabled.
     *
     * @returns True if statistics collection is disabled, false otherwise.
     */
    getIsDisabled(): boolean;
}

/**
 * Constructor parameters for {@link StatisticsProvider}.
 */
export interface StatisticsProviderParameters {
    /**
     * Browser local storage.
     */
    storage: StorageInterface;

    /**
     * Storage for statistics.
     */
    statisticsStorage: StatisticsStorageInterface;

    /**
     * Timers instance.
     */
    timers: TimersInterface;

    /**
     * Credentials service instance.
     */
    credentials: CredentialsInterface;
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
 * - Is the user selected a location?
 *
 * If any of these checks fail, the statistics storage will not be updated.
 */
export class StatisticsProvider implements StatisticsProviderInterface {
    /**
     * Key for {@link isDisabled} in the browser local storage.
     */
    private static readonly STATISTICS_DISABLED_KEY = 'statistics.disabled';

    /**
     * Default value for {@link isDisabled} if it is not set in the browser local storage.
     */
    private static readonly DEFAULT_IS_DISABLED = false;

    /**
     * Update duration interval in milliseconds (1 minute).
     */
    private static readonly TIMER_UPDATE_INTERVAL_MS = 60 * 1000;

    /**
     * List of events that are used to update the statistics storage.
     */
    private static readonly NOTIFIER_EVENTS = [
        notifier.types.TRAFFIC_STATS_UPDATED,
        notifier.types.CURRENT_LOCATION_UPDATED,
        notifier.types.TOKEN_PREMIUM_STATE_UPDATED,
        notifier.types.CONNECTIVITY_STATE_CHANGED,
    ];

    /**
     * Browser local storage.
     */
    private storage: StorageInterface;

    /**
     * Storage for statistics.
     */
    private statisticsStorage: StatisticsStorageInterface;

    /**
     * Timers instance.
     */
    private timers: TimersInterface;

    /**
     * Credentials service instance.
     */
    private credentials: CredentialsInterface;

    /**
     * Flag indicating whether telemetry module is initialized or not.
     */
    private isInitialized = false;

    /**
     * Indicates whether the logged in user's token is premium.
     * Initially set to `null` and will be updated after the first event from notifier.
     *
     * NOTE: It's not stored in state storage because after extension restart
     * it will be retrieved from events sent by notifier at startup.
     */
    private isPremiumToken: boolean | null = null;

    /**
     * Indicates whether the user is connected to the Proxy currently or not.
     */
    private isConnected = false;

    /**
     * Current selected location ID.
     *
     * NOTE: It's not stored in state storage because after extension restart
     * it will be retrieved from events sent by notifier at startup.
     */
    private locationId: string | null = null;

    /**
     * ID of the interval that updates the connection duration statistics.
     *
     * NOTE: It's not stored in state storage because
     * intervals from previous session is not exists.
     */
    private durationIntervalId: number | null = null;

    /**
     * Indicates whether the statistics collection is disabled or not.
     *
     * Initialized in {@link init} method.
     */
    private isDisabled: boolean;

    /**
     * Constructor.
     */
    constructor({
        storage,
        statisticsStorage,
        timers,
        credentials,
    }: StatisticsProviderParameters) {
        this.storage = storage;
        this.statisticsStorage = statisticsStorage;
        this.timers = timers;
        this.credentials = credentials;
    }

    /** @inheritdoc */
    public init = async (): Promise<void> => {
        try {
            await this.gainIsDisabled();
            notifier.addSpecifiedListener(
                StatisticsProvider.NOTIFIER_EVENTS,
                this.handleNotifierEvent.bind(this),
            );
            this.isInitialized = true;
            log.info('[vpn.StatisticsProvider]: Statistics provider ready');
        } catch (e) {
            log.error('[vpn.StatisticsProvider]: Unable to initialize statistics provider, due to error:', e);
        }
    };

    /**
     * Saves the {@link isDisabled} value to local storage and updates the memory state.
     *
     * @param isDisabled Indicates whether the statistics collection is disabled.
     */
    private async saveIsDisabled(isDisabled: boolean): Promise<void> {
        this.isDisabled = isDisabled;
        await this.storage.set<boolean>(
            StatisticsProvider.STATISTICS_DISABLED_KEY,
            this.isDisabled,
        );
    }

    /**
     * Reads the {@link isDisabled} from local storage and saves it to memory,
     * if not found in local storage, it initializes it with default value.
     */
    private async gainIsDisabled(): Promise<void> {
        const isDisabled = await this.storage.get<boolean>(
            StatisticsProvider.STATISTICS_DISABLED_KEY,
        );

        if (typeof isDisabled === 'boolean') {
            this.isDisabled = isDisabled;
        } else {
            await this.saveIsDisabled(StatisticsProvider.DEFAULT_IS_DISABLED);
        }
    }

    /** @inheritdoc */
    public setIsDisabled = async (isDisabled: boolean): Promise<void> => {
        this.assertInitialized();

        await this.saveIsDisabled(isDisabled);

        /**
         * If user was connected and now disables / enables stats collection:
         * - Disables: We should treat it as disconnected and clear the duration interval,
         *   and end duration statistics, so that it won't be updated anymore.
         * - Enables: We should treat it as connected and start the duration interval,
         *   and start duration statistics, so that it will be updated from now on.
         */
        if (this.isConnected) {
            // At this point, locationId should already exist, if not - we consider it as an error
            if (!this.locationId) {
                log.error(
                    `[vpn.StatisticsProvider]: Cannot ${isDisabled ? 'end' : 'restart'} duration after ${isDisabled ? 'disabling' : 'enabling'} statistics, "locationId" is not set.`,
                );
                return;
            }

            if (this.isDisabled) {
                await this.statisticsStorage.endDuration(this.locationId);
                this.clearDurationInterval();
            } else {
                await this.statisticsStorage.startDuration(this.locationId);
                this.startDurationInterval();
            }
        }
    };

    /** @inheritdoc */
    public getIsDisabled = (): boolean => {
        this.assertInitialized();

        return this.isDisabled;
    };

    /**
     * Checks if the statistics can be collected or not.
     * Statistics can be collected if:
     * - Statistics collection is not disabled
     * - User is a premium user
     * - Location is selected
     *
     * @returns Promise with true if statistics can be collected, false otherwise.
     */
    private async canCollectStatistics(): Promise<boolean> {
        // Retrieve the premium token state if it is not set yet
        if (this.isPremiumToken === null) {
            this.isPremiumToken = await this.credentials.isPremiumToken();
        }

        return (
            !this.isDisabled
            && this.isPremiumToken
            && !!this.locationId
        );
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
            StatisticsProvider.TIMER_UPDATE_INTERVAL_MS,
        );
    }

    /**
     * Handles event from the notifier.
     *
     * @param event Event type.
     * @param arg Event arguments.
     *
     * @returns Promise of handled event.
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
        /**
         * Note: We do not check if the user is connected because the traffic statistics
         * are sent only when the user is connected to WebSocket. But there might be
         * case when WebSocket sends this event later when user is already disconnected from Proxy.
         */
        const canCollectStatistics = await this.canCollectStatistics();
        if (!canCollectStatistics) {
            return;
        }

        // Add traffic statistics to storage
        // Note: locationId is already checked in canCollectStatistics()
        await this.statisticsStorage.addTraffic(this.locationId!, {
            downloadedBytes: bytesDownloaded,
            uploadedBytes: bytesUploaded,
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
        this.isConnected = value === ConnectivityStateType.Connected;

        const canCollectStatistics = await this.canCollectStatistics();
        if (!canCollectStatistics) {
            return;
        }

        // Note: locationId is already checked in canCollectStatistics()
        if (this.isConnected) {
            await this.statisticsStorage.startDuration(this.locationId!);
            this.startDurationInterval();
        } else {
            await this.statisticsStorage.endDuration(this.locationId!);
            this.clearDurationInterval();
        }
    }

    /**
     * Handles timer update event.
     * This event is fired at regular intervals to update the duration statistics.
     */
    private async handleTimerUpdate(): Promise<void> {
        /**
         * Note: We do not check if the user is connected because interval is started
         * only when user is connected to Proxy. Otherwise, the interval is cleared.
         */
        const canCollectStatistics = await this.canCollectStatistics();
        if (!canCollectStatistics) {
            return;
        }

        // Note: locationId is already checked in canCollectStatistics()
        await this.statisticsStorage.updateDuration(this.locationId!);
    }

    /**
     * Asserts that the statistics provider is initialized.
     * Used to protect against calling public methods before initialization.
     *
     * @throws Error if the statistics storage is not initialized.
     */
    private assertInitialized(): void {
        if (!this.isInitialized) {
            throw new Error('Statistics storage is not initialized yet. Please call init() method first.');
        }
    }
}
