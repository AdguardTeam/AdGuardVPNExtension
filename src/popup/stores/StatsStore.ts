import {
    action,
    computed,
    observable,
    runInAction,
} from 'mobx';
import browser from 'webextension-polyfill';

import {
    StatisticsRange,
    type RangeStatistics,
    type StatisticsData,
} from '../../background/statistics/statisticsTypes';
import { messenger } from '../../common/messenger';

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
     * Is why safe modal open.
     */
    @observable isWhySafeModalOpen = false;

    /**
     * Is clear modal open.
     */
    @observable isClearModalOpen = false;

    /**
     * Should stats screen be rendered.
     */
    @computed get shouldRenderStatsScreen() {
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
     * @param rangeStatistics Statistics data for the selected range,
     * if `null` then it will reset the statistics data to default values.
     */
    @action setRangeStatistics = (rangeStatistics: RangeStatistics | null) => {
        if (!rangeStatistics) {
            this.totalUsage = StatsStore.DEFAULT_TOTAL;
            this.firstStatsDate = new Date();
            this.locations = [];
            return;
        }

        const { total, locations, startedTimestamp } = rangeStatistics;

        const newLocations: LocationUsage[] = [];
        for (let i = 0; i < locations.length; i += 1) {
            const { locationId, data } = locations[i];
            const locationData = this.rootStore.vpnStore.locations.find(
                (location) => location.id === locationId,
            );

            if (locationData) {
                newLocations.push({
                    location: locationData,
                    usage: data,
                });
            }
        }

        newLocations.sort((a, b) => {
            // If downloaded data is equal, sort by uploaded data
            if (a.usage.downloadedBytes === b.usage.downloadedBytes) {
                // If uploaded data is also equal, sort by duration
                if (a.usage.uploadedBytes === b.usage.uploadedBytes) {
                    return b.usage.durationMs - a.usage.durationMs;
                }

                return b.usage.uploadedBytes - a.usage.uploadedBytes;
            }

            // Sort by downloaded data in descending order
            return b.usage.downloadedBytes - a.usage.downloadedBytes;
        });

        this.totalUsage = total;
        this.firstStatsDate = new Date(startedTimestamp);
        this.locations = newLocations;
    };

    /**
     * Open the stats screen.
     */
    @action openStatsScreen = () => {
        // Do nothing if user is not a premium user
        if (!this.rootStore.vpnStore.isPremiumToken) {
            return;
        }

        this.isStatsScreenOpen = true;
    };

    /**
     * Close the stats screen.
     */
    @action closeStatsScreen = () => {
        // Do nothing if user is not a premium user
        if (!this.rootStore.vpnStore.isPremiumToken) {
            return;
        }

        this.isStatsScreenOpen = false;
    };

    /**
     * Open the all locations screen.
     */
    @action openAllLocationsScreen = () => {
        // Do nothing if the stats screen is not open
        if (!this.isStatsScreenOpen) {
            return;
        }

        this.isAllLocationsScreenOpen = true;
    };

    /**
     * Close the all locations screen.
     */
    @action closeAllLocationsScreen = () => {
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
    @action openLocationScreen = (locationId: string) => {
        // Do nothing if the stats screen is not open
        if (!this.isStatsScreenOpen) {
            return;
        }

        this.selectedLocationId = locationId;
    };

    /**
     * Close the location screen.
     */
    @action closeLocationScreen = () => {
        // Do nothing if the stats screen is not open
        if (!this.isStatsScreenOpen) {
            return;
        }

        this.selectedLocationId = null;
    };

    /**
     * Updates the statistics data for the current range.
     */
    @action updateStatistics = async () => {
        const rangeStatistics = await messenger.getRangeStatistics(this.range);
        this.setRangeStatistics(rangeStatistics);
    };

    /**
     * Update the stats range both in store and in background,
     * and receives the new statistics data for that range.
     *
     * @param range New range value.
     */
    @action updateRange = async (range: StatisticsRange) => {
        this.range = range;
        await this.saveRangeToStorage(range);
        await this.updateStatistics();
    };

    /**
     * Clear all stats.
     */
    @action clearAllStats = async () => {
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
    @action setIsMenuOpen = (isMenuOpen: boolean) => {
        this.isMenuOpen = isMenuOpen;
    };

    /**
     * Set the why safe modal open state.
     *
     * @param isWhySafeModalOpen True if the modal is open, false otherwise.
     */
    @action setIsWhySafeModalOpen = (isWhySafeModalOpen: boolean) => {
        this.isWhySafeModalOpen = isWhySafeModalOpen;
    };

    /**
     * Set the clear modal open state.
     *
     * @param isClearModalOpen True if the modal is open, false otherwise.
     */
    @action setIsClearModalOpen = (isClearModalOpen: boolean) => {
        this.isClearModalOpen = isClearModalOpen;
    };

    /**
     * Retrieves the statistics range from session storage.
     *
     * @returns The statistics range from storage, or the default range if not set or invalid.
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
        } catch {
            // If there is an error retrieving the range, return the default range
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
