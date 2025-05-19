import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';
import { type ConnectivityStateChangeEvent, type WsConnectivityInfoMsgTraffic } from '../connectivity';
import { type CredentialsInterface } from '../credentials/Credentials';
import { StorageKey, type LocationInterface, ConnectivityStateType } from '../schema';
import { type StatisticsState } from '../schema/statistics';
import { type StateStorageInterface } from '../stateStorage/stateStorage.abstract';

import { type StatisticsStorageInterface } from './StatisticsStorage';
import { type AddStatisticsDataBase } from './statisticsTypes';

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
}

/**
 * FIXME: Add jsdoc
 * FIXME: Add tests
 */
export class StatisticsProvider implements StatisticsProviderInterface {
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
    }: StatisticsProviderParameters) {
        this.stateStorage = stateStorage;
        this.statisticsStorage = statisticsStorage;
        this.credentials = credentials;

        notifier.addSpecifiedListener(
            notifier.types.TRAFFIC_STATS_UPDATED,
            this.handleTrafficStatsUpdated.bind(this),
        );
        notifier.addSpecifiedListener(
            notifier.types.CURRENT_LOCATION_UPDATED,
            this.handleCurrentLocationUpdated.bind(this),
        );
        notifier.addSpecifiedListener(
            notifier.types.TOKEN_PREMIUM_STATE_UPDATED,
            this.handleTokenPremiumStateUpdated.bind(this),
        );
        notifier.addSpecifiedListener(
            notifier.types.CONNECTIVITY_STATE_CHANGED,
            this.handleConnectivityStateChanged.bind(this),
        );
        notifier.addSpecifiedListener(
            notifier.types.USER_AUTHENTICATED,
            this.handleUserAuthenticated.bind(this),
        );
        notifier.addSpecifiedListener(
            notifier.types.USER_DEAUTHENTICATED,
            this.handleUserDeauthenticated.bind(this),
        );
    }

    /**
     * Saves the current state of the statistics provider to session storage.
     */
    private saveState(): void {
        this.stateStorage.setItem(StorageKey.StatisticsState, this.state);
    }

    /**
     * `isConnected` state property getter.
     */
    private get isConnected(): boolean {
        return this.state.isConnected;
    }

    /**
     * `isConnected` state property setter.
     */
    private set isConnected(value: boolean) {
        this.state.isConnected = value;
        this.saveState();
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
     * Initializes the statistics provider.
     */
    public async init(): Promise<void> {
        try {
            this.state = this.stateStorage.getItem(StorageKey.StatisticsState);
            await this.statisticsStorage.init();
            log.info('Statistics provider ready');
        } catch (e) {
            log.error('Unable to initialize statistics provider, due to error:', e);
        }
    }

    /**
     * Retrieves the base data for adding statistics.
     *
     * @returns Base data for adding statistics or null if not connected,
     * not a premium token or accountId/locationId is not set.
     */
    private getAddBaseData(): AddStatisticsDataBase | null {
        if (!this.isConnected
            || !this.isPremiumToken
            || !this.accountId
            || !this.locationId) {
            return null;
        }

        return {
            accountId: this.accountId,
            locationId: this.locationId,
        };
    }

    /**
     * Handles traffic statistics event by updating the statistics storage.
     * This event is fired when websocket sends traffic usage data.
     *
     * @param event Stats event data.
     */
    private handleTrafficStatsUpdated(event: WsConnectivityInfoMsgTraffic): void {
        const baseData = this.getAddBaseData();

        /**
         * Do nothing if we can't add statistics because:
         * 1. Is not connected
         * 2. User is not a premium
         * 3. Account ID or location ID is not set
         */
        if (!baseData) {
            return;
        }

        // Add traffic statistics to storage
        this.statisticsStorage.addTraffic({
            ...baseData,
            downloaded: event.bytesDownloaded,
            uploaded: event.bytesUploaded,
        });
    }

    /**
     * Handles current location updated event.
     * This event is fired when user selects a new location.
     *
     * @param location Updated location.
     */
    private handleCurrentLocationUpdated(location: LocationInterface): void {
        this.locationId = location.id;
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
    private handleConnectivityStateChanged(state: ConnectivityStateChangeEvent): void {
        const isConnected = state.value === ConnectivityStateType.Connected;
        this.isConnected = isConnected;

        const baseData = this.getAddBaseData();

        /**
         * Do nothing if we can't add statistics because:
         * 1. Is not connected
         * 2. User is not a premium
         * 3. Account ID or location ID is not set
         */
        if (!baseData) {
            return;
        }

        if (isConnected) {
            this.statisticsStorage.startDuration(baseData);
        } else {
            this.statisticsStorage.endDuration(baseData);
        }
    }

    /**
     * Handles user authenticated event.
     * This event is fired when user is authenticated.
     */
    private async handleUserAuthenticated(): Promise<void> {
        this.accountId = await this.credentials.getUsername();
    }

    /**
     * Handles user logged out event.
     * This event is fired when user is deauthenticated.
     */
    private handleUserDeauthenticated(): void {
        this.accountId = null;
    }
}
