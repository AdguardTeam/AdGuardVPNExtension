import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';
import { type ConnectivityStateChangeEvent, type WsConnectivityInfoMsgTraffic } from '../connectivity';
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
}

/**
 * Constructor parameters for {@link StatisticsProvider}.
 */
export interface StatisticsProviderParameters {
    /**
     * Storage for statistics.
     */
    statisticsStorage: StatisticsStorageInterface;

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
 * - Is the user selected a location?
 *
 * If any of these checks fail, the statistics storage will not be updated.
 */
export class StatisticsProvider implements StatisticsProviderInterface {
    /**
     * Update duration interval in milliseconds (5 minutes).
     */
    private static readonly TIMER_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

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
     * Storage for statistics.
     */
    private statisticsStorage: StatisticsStorageInterface;

    /**
     * Timers instance.
     */
    private timers: TimersInterface;

    /**
     * Indicates whether the logged in user's token is premium.
     *
     * NOTE: It's not stored in state storage because after extension restart
     * it will be retrieved from events sent by notifier at startup.
     */
    private isPremiumToken = false;

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
     * Constructor.
     */
    constructor({
        statisticsStorage,
        timers,
    }: StatisticsProviderParameters) {
        this.statisticsStorage = statisticsStorage;
        this.timers = timers;

        notifier.addSpecifiedListener(
            StatisticsProvider.NOTIFIER_EVENTS,
            this.handleNotifierEvent.bind(this),
        );
    }

    /** @inheritdoc */
    public init = async (): Promise<void> => {
        try {
            await this.statisticsStorage.init();
            log.info('Statistics provider ready');
        } catch (e) {
            log.error('Unable to initialize statistics provider, due to error:', e);
        }
    };

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
         * Do nothing if we can't add statistics because of any of the following:
         * - User is not a premium
         * - Location ID is not set
         *
         * Note: We do not check if the user is connected because the traffic statistics
         * are sent only when the user is connected to WebSocket. But there might be
         * case when WebSocket sends this event later when user is already disconnected from Proxy.
         */
        if (!this.isPremiumToken || !this.locationId) {
            return;
        }

        // Add traffic statistics to storage
        await this.statisticsStorage.addTraffic(this.locationId, {
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
        /**
         * Do nothing if we can't add statistics because of any of the following:
         * - User is not a premium
         * - Location ID is not set
         */
        if (!this.isPremiumToken || !this.locationId) {
            return;
        }

        if (value === ConnectivityStateType.Connected) {
            await this.statisticsStorage.startDuration(this.locationId);
            this.startDurationInterval();
        } else {
            await this.statisticsStorage.endDuration(this.locationId);
            this.clearDurationInterval();
        }
    }

    /**
     * Handles timer update event.
     * This event is fired at regular intervals to update the duration statistics.
     */
    private async handleTimerUpdate(): Promise<void> {
        /**
         * Do nothing if we can't add statistics because of any of the following:
         * - User is not a premium
         * - Location ID is not set
         *
         * Note: We do not check if the user is connected because interval is started
         * only when user is connected to Proxy. Otherwise, the interval is cleared.
         */
        if (!this.isPremiumToken || !this.locationId) {
            return;
        }

        await this.statisticsStorage.updateDuration(this.locationId);
    }
}
