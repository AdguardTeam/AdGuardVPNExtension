import { action, computed, observable } from 'mobx';

import { StatisticsRange } from '../../background/statistics/statisticsTypes';

import { type RootStore } from './RootStore';
import { type LocationData } from './VpnStore';

/**
 * Data usage interface.
 */
export interface DataUsage {
    /**
     * Download bytes.
     */
    downloadBytes: number;

    /**
     * Upload bytes.
     */
    uploadBytes: number;
}

/**
 * Data usage for a specific location.
 */
export interface LocationDataUsage {
    /**
     * Location info.
     */
    location: LocationData;

    /**
     * Data usage for the location.
     */
    dataUsage: DataUsage;

    /**
     * Time usage for the location in milliseconds.
     */
    timeUsageMs: number;
}

export class StatsStore {
    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

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
     *
     * FIXME: It should persist between sessions (should be retrieved from background).
     */
    @observable range: StatisticsRange = StatisticsRange.Days7;

    /**
     * Date when the stats collection started.
     *
     * FIXME: It should persist between sessions (should be retrieved from background).
     */
    @observable firstStatsDate = new Date('2024-09-19T00:00:00Z');

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
     * Update the stats range both in store and in background.
     *
     * FIXME: Implement (send message to background to update it).
     *
     * @param range New range value.
     */
    @action updateRange = async (range: StatisticsRange) => {
        this.range = range;
    };

    /**
     * Clear all stats.
     *
     * FIXME: Implement (send message to background to clear it).
     */
    @action clearAllStats = async () => {};

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
     * Data usage for all locations.
     *
     * FIXME: Replace with actual data and sort by download bytes
     * (probably we need to transform raw data from background depending on range).
     */
    @computed get allLocationsDataUsage(): LocationDataUsage[] {
        return [
            {
                location: this.rootStore.vpnStore.locations[0],
                dataUsage: {
                    downloadBytes: 4.2e9,
                    uploadBytes: 789e6,
                },
                timeUsageMs: 90_060_000, // 1d 1h 1m
            },
            {
                location: this.rootStore.vpnStore.locations[1],
                dataUsage: {
                    downloadBytes: 2.2e9,
                    uploadBytes: 689e6,
                },
                timeUsageMs: 90_060_000, // 1d 1h 1m
            },
            {
                location: this.rootStore.vpnStore.locations[2],
                dataUsage: {
                    downloadBytes: 1.2e9,
                    uploadBytes: 589e6,
                },
                timeUsageMs: 90_060_000, // 1d 1h 1m
            },
            {
                location: this.rootStore.vpnStore.locations[3],
                dataUsage: {
                    downloadBytes: 2e8,
                    uploadBytes: 489e6,
                },
                timeUsageMs: 90_060_000, // 1d 1h 1m
            },
            {
                location: this.rootStore.vpnStore.locations[4],
                dataUsage: {
                    downloadBytes: 1e8,
                    uploadBytes: 389e6,
                },
                timeUsageMs: 90_060_000, // 1d 1h 1m
            },
        ];
    }

    /**
     * Total data usage across all locations.
     *
     * FIXME: Replace with actual data (probably we need to reduce `allLocationsDataUsage`).
     */
    @computed get totalUsageData(): DataUsage {
        return {
            downloadBytes: 4.2e9,
            uploadBytes: 789e6,
        };
    }

    /**
     * Total time usage across all locations in milliseconds.
     *
     * FIXME: Replace with actual data (probably we need to reduce `allLocationsDataUsage`).
     */
    @computed get totalTimeUsageMs(): number {
        return 90_060_000; // 1d 1h 1m
    }

    /**
     * Data usage for the selected location.
     */
    @computed get selectedLocationDataUsage(): LocationDataUsage | null {
        if (!this.selectedLocationId) {
            return null;
        }

        const locationData = this.allLocationsDataUsage.find(
            (locationUsage) => locationUsage.location.id === this.selectedLocationId,
        );

        return locationData || null;
    }
}
