import { action, computed, observable } from 'mobx';

import {
    type AllAccountStatistics,
    StatisticsRange,
    type RangeAccountStatistics,
    type StatisticsData,
    type StatisticsDataUsage,
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
     * Default range for statistics.
     */
    private static readonly DEFAULT_RANGE = StatisticsRange.Days7;

    /**
     * Default total statistics data.
     */
    private static readonly DEFAULT_TOTAL: StatisticsData = {
        downloaded: 0,
        uploaded: 0,
        duration: 0,
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
     * Raw statistics data for all locations.
     */
    @observable rawLocations: StatisticsDataUsage[] = [];

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
     * Raw statistics data converted filled with location data.
     */
    @computed get locations(): LocationUsage[] {
        const locations: LocationUsage[] = [];

        for (let i = 0; i < this.rawLocations.length; i += 1) {
            const { locationId, data } = this.rawLocations[i];
            const locationData = this.rootStore.vpnStore.locations.find(
                (location) => location.id === locationId,
            );

            if (locationData) {
                locations.push({
                    location: locationData,
                    usage: data,
                });
            }
        }

        return locations;
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
    @action setRangeStatistics = (rangeStatistics: RangeAccountStatistics | null) => {
        if (rangeStatistics) {
            this.totalUsage = rangeStatistics.total;
            this.rawLocations = rangeStatistics.locations;
        } else {
            this.totalUsage = StatsStore.DEFAULT_TOTAL;
            this.rawLocations = [];
        }
    };

    /**
     * Updates all statistics related data inside of the store.
     *
     * @param statistics Statistics data to set, if `null` then
     * it will reset the statistics data to default values.
     */
    @action setStatistics = (statistics: AllAccountStatistics | null) => {
        if (statistics) {
            this.firstStatsDate = new Date(statistics.startedTimestamp);
            this.range = statistics.range;
        } else {
            this.firstStatsDate = new Date();
            this.range = StatsStore.DEFAULT_RANGE;
        }

        this.setRangeStatistics(statistics);
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
     * Update the stats range both in store and in background,
     * and receives the new statistics data for that range.
     *
     * @param range New range value.
     */
    @action updateRange = async (range: StatisticsRange) => {
        this.range = range;
        const rangeStatistics = await messenger.getRangeStatistics(range);
        this.setRangeStatistics(rangeStatistics);
    };

    /**
     * Clear all stats.
     */
    @action clearAllStats = async () => {
        await messenger.clearStatistics();
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
}
