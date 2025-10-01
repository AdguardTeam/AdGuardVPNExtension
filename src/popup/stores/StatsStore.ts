import {
    action,
    computed,
    observable,
    runInAction,
} from 'mobx';
import browser from 'webextension-polyfill';

import {
    StatisticsRange,
    type StatisticsByRange,
    type StatisticsData,
} from '../../background/statistics/statisticsTypes';
import { messenger } from '../../common/messenger';
import { log } from '../../common/logger';
import { MEGABYTE_BYTES } from '../components/Stats/utils';

import { type RootStore } from './RootStore';
import { type LocationData } from './VpnStore';

/**
 * Data and duration usage for a specific location.
 */
export interface LocationUsage {
    /**
     * Location info.
     */
    location: LocationData;

    /**
     * Data and duration usage for the location.
     */
    usage: StatisticsData;
}

export class StatsStore {
    /**
     * Range session storage key.
     */
    private static readonly RANGE_STORAGE_KEY = 'statistics.range';

    /**
     * Default range for statistics.
     */
    private static readonly DEFAULT_RANGE = StatisticsRange.Days7;

    /**
     * Default total statistics data.
     */
    private static readonly DEFAULT_TOTAL: StatisticsData = {
        downloadedBytes: 0,
        uploadedBytes: 0,
        durationMs: 0,
    };

    /**
     * Root store instance.
     */
    rootStore: RootStore;

    /**
     * Constructor.
     */
    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    /**
     * Initializes the stats store by retrieving the range from session storage.
     */
    @action init = async (): Promise<void> => {
        this.range = await this.getRangeFromStorage();
    };

    /**
     * Flag indicating whether the stats screen is open.
     */
    @observable isStatsScreenOpen = false;

    /**
     * Flag indicating whether the all locations screen is open.
     */
    @observable isAllLocationsScreenOpen = false;

    /**
     * ID of the selected location. Used to show stats for a specific location.
     */
    @observable selectedLocationId: string | null = null;

    /**
     * Stats range to show data for.
     */
    @observable range: StatisticsRange = StatsStore.DEFAULT_RANGE;

    /**
     * Date when the stats collection started.
     */
    @observable firstStatsDate = new Date();

    /**
     * Total statistics data for all locations and the selected range.
     */
    @observable totalUsage: StatisticsData = StatsStore.DEFAULT_TOTAL;

    /**
     * Statistics data for all locations.
     */
    @observable locations: LocationUsage[] = [];

    /**
     * Is stats menu open.
     */
    @observable isMenuOpen = false;

    /**
     * Is stats info modal open.
     */
    @observable isStatsInfoModalOpen = false;

    /**
     * Is disable modal open.
     */
    @observable isDisableModalOpen = false;

    /**
     * Is clear modal open.
     */
    @observable isClearModalOpen = false;

    /**
     * Flag indicating whether the first statistics retrieval has occurred.
     * This is needed to retrieve only once when stats screen is opened,
     * because after it will be update via notifier events.
     */
    @observable isFirstStatisticsRetrieved = false;

    /**
     * Flag indicating whether statistics data is currently being loaded.
     */
    @observable isStatisticsLoading = false;

    /**
     * Flag indicating whether stats screen is disabled.
     * True if stats are not collected currently, false otherwise.
     */
    @observable isStatsDisabled = false;

    /**
     * Is stats screen open or not.
     */
    @computed get isOpenStatsScreen(): boolean {
        // Do not render the stats screen if user is not a premium user
        if (!this.rootStore.vpnStore.isPremiumToken) {
            return false;
        }

        // Render the stats screen if it is open
        return this.isStatsScreenOpen;
    }

    /**
     * Data usage for the selected location.
     */
    @computed get selectedLocation(): LocationUsage | null {
        if (!this.selectedLocationId) {
            return null;
        }

        const locationData = this.locations.find(
            (locationUsage) => locationUsage.location.id === this.selectedLocationId,
        );

        return locationData || null;
    }

    /**
     * Update statistics data after range update.
     *
     * @param statisticsByRange Statistics data for the selected range.
     */
    @action setStatisticsByRange = (statisticsByRange: StatisticsByRange): void => {
        const {
            isDisabled,
            startedTimestamp,
            total,
            locations,
        } = statisticsByRange;

        const enrichedLocations: LocationUsage[] = [];
        for (let i = 0; i < locations.length; i += 1) {
            const { locationId, data } = locations[i];

            // Skip locations that have small data usage
            if (
                data.downloadedBytes < MEGABYTE_BYTES
                && data.uploadedBytes < MEGABYTE_BYTES
            ) {
                // eslint-disable-next-line no-continue
                continue;
            }

            const locationData = this.rootStore.vpnStore.locations.find(
                (location) => location.id === locationId,
            );

            if (locationData) {
                enrichedLocations.push({
                    location: locationData,
                    usage: data,
                });
            }
        }

        enrichedLocations.sort((a, b) => {
            // If downloaded data is equal, sort by uploaded data
            if (a.usage.downloadedBytes === b.usage.downloadedBytes) {
                // If uploaded data is also equal, sort by duration
                if (a.usage.uploadedBytes === b.usage.uploadedBytes) {
                    // Sort by duration data in descending order
                    return b.usage.durationMs - a.usage.durationMs;
                }

                // Sort by uploaded data in descending order
                return b.usage.uploadedBytes - a.usage.uploadedBytes;
            }

            // Sort by downloaded data in descending order
            return b.usage.downloadedBytes - a.usage.downloadedBytes;
        });

        this.isStatsDisabled = isDisabled;
        this.firstStatsDate = new Date(startedTimestamp);
        this.totalUsage = total;
        this.locations = enrichedLocations;
    };

    /**
     * Open the stats screen.
     */
    @action openStatsScreen = (): void => {
        // Do nothing if user is not a premium user
        if (!this.rootStore.vpnStore.isPremiumToken) {
            return;
        }

        this.isStatsScreenOpen = true;
    };

    /**
     * Close the stats screen.
     */
    @action closeStatsScreen = (): void => {
        // Do nothing if user is not a premium user
        if (!this.rootStore.vpnStore.isPremiumToken) {
            return;
        }

        this.isStatsScreenOpen = false;
    };

    /**
     * Open the all locations screen.
     */
    @action openAllLocationsScreen = (): void => {
        // Do nothing if the stats screen is not open
        if (!this.isStatsScreenOpen) {
            return;
        }

        this.isAllLocationsScreenOpen = true;
    };

    /**
     * Close the all locations screen.
     */
    @action closeAllLocationsScreen = (): void => {
        // Do nothing if the stats screen is not open
        if (!this.isStatsScreenOpen) {
            return;
        }

        this.isAllLocationsScreenOpen = false;
    };

    /**
     * Open the location screen.
     *
     * @param locationId ID of the location to show stats for.
     */
    @action openLocationScreen = (locationId: string): void => {
        // Do nothing if the stats screen is not open
        if (!this.isStatsScreenOpen) {
            return;
        }

        this.selectedLocationId = locationId;
    };

    /**
     * Close the location screen.
     */
    @action closeLocationScreen = (): void => {
        // Do nothing if the stats screen is not open
        if (!this.isStatsScreenOpen) {
            return;
        }

        this.selectedLocationId = null;
    };

    /**
     * Updates the statistics data for the current range.
     *
     * @param isRequestedFromUiRender True if update is requested from UI render, false otherwise.
     */
    @action updateStatistics = async (isRequestedFromUiRender = false): Promise<void> => {
        /**
         * Negative XOR check to ensure following:
         * - If first stats retrieved before and it's called from UI render,
         *   we don't need to update statistics because update is handled via notifier.
         * - If first stats not retrieved before and it's called from UI render,
         *   we need to retrieve first stats.
         * - If first stats retrieved before and it's not called from UI render,
         *   it means it was called from notifier update event, we should update stats.
         * - If first stats not retrieved before and it's not called from UI render,
         *   we don't need to update statistics because first stats should be initiated
         *   from UI render.
         */
        if (!(this.isFirstStatisticsRetrieved !== isRequestedFromUiRender)) {
            return;
        }

        this.setIsStatisticsLoading(true);

        const statisticsByRange = await messenger.getStatsByRange(this.range);
        this.setStatisticsByRange(statisticsByRange);
        this.setIsFirstStatisticsRetrieved(true);

        this.setIsStatisticsLoading(false);
    };

    /**
     * Update the stats range both in store and in background,
     * and receives the new statistics data for that range.
     *
     * @param range New range value.
     */
    @action updateRange = async (range: StatisticsRange): Promise<void> => {
        this.range = range;
        await this.saveRangeToStorage(range);
        await this.updateStatistics();
    };

    /**
     * Disables or enables stats collection both in store and in background.
     *
     * @param isDisabled True if stats collection should be disabled, false otherwise.
     */
    @action updateIsStatsDisabled = async (isDisabled: boolean): Promise<void> => {
        this.isStatsDisabled = isDisabled;
        await messenger.setStatisticsIsDisabled(isDisabled);
    };

    /**
     * Clear all stats.
     */
    @action clearAllStats = async (): Promise<void> => {
        await messenger.clearStatistics();

        runInAction(() => {
            this.locations = [];
            this.totalUsage = StatsStore.DEFAULT_TOTAL;
            this.firstStatsDate = new Date();
            this.selectedLocationId = null;
        });
    };

    /**
     * Set the stats menu open state.
     *
     * @param isMenuOpen True if the menu is open, false otherwise.
     */
    @action setIsMenuOpen = (isMenuOpen: boolean): void => {
        this.isMenuOpen = isMenuOpen;
    };

    /**
     * Set the stats info modal open state.
     *
     * @param isStatsInfoModalOpen True if the modal is open, false otherwise.
     */
    @action setIsStatsInfoModalOpen = (isStatsInfoModalOpen: boolean): void => {
        this.isStatsInfoModalOpen = isStatsInfoModalOpen;
    };

    /**
     * Set the disable modal open state.
     *
     * @param isDisableModalOpen True if the modal is open, false otherwise.
     */
    @action setIsDisableModalOpen = (isDisableModalOpen: boolean): void => {
        this.isDisableModalOpen = isDisableModalOpen;
    };

    /**
     * Set the clear modal open state.
     *
     * @param isClearModalOpen True if the modal is open, false otherwise.
     */
    @action setIsClearModalOpen = (isClearModalOpen: boolean): void => {
        this.isClearModalOpen = isClearModalOpen;
    };

    /**
     * Sets the flag indicating whether the first statistics retrieval has occurred.
     *
     * @param isFirstStatisticsRetrieved True if the first statistics retrieval has occurred, false otherwise.
     */
    @action setIsFirstStatisticsRetrieved = (isFirstStatisticsRetrieved: boolean): void => {
        this.isFirstStatisticsRetrieved = isFirstStatisticsRetrieved;
    };

    /**
     * Sets the loading state for statistics.
     *
     * @param isStatisticsLoading True if statistics are currently loading, false otherwise.
     */
    @action setIsStatisticsLoading = (isStatisticsLoading: boolean): void => {
        this.isStatisticsLoading = isStatisticsLoading;
    };

    /**
     * Retrieves the statistics range from session storage.
     *
     * @returns Promise with statistics range from storage,
     * or the default range if not set or invalid.
     */
    private async getRangeFromStorage(): Promise<StatisticsRange> {
        try {
            const storageRange = await browser.storage.session.get(StatsStore.RANGE_STORAGE_KEY);
            const range = storageRange[StatsStore.RANGE_STORAGE_KEY];

            if (range && Object.values(StatisticsRange).includes(range as StatisticsRange)) {
                return range as StatisticsRange;
            }

            // If the range is not set or invalid, return the default range
            return StatsStore.DEFAULT_RANGE;
        } catch (e) {
            // If there is an error retrieving the range, return the default range
            log.error('Failed to retrieve statistics range from storage:', e);
            return StatsStore.DEFAULT_RANGE;
        }
    }

    /**
     * Saves the statistics range to session storage.
     *
     * @param range The statistics range to save.
     */
    private async saveRangeToStorage(range: StatisticsRange): Promise<void> {
        await browser.storage.session.set({
            [StatsStore.RANGE_STORAGE_KEY]: range,
        });
    }
}
