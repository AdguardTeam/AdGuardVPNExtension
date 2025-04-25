import { action, computed, observable } from 'mobx';

import { type RootStore } from './RootStore';

/**
 * Statistics range.
 */
export enum StatsRange {
    Hours24 = 'hours24',
    Days7 = 'days7',
    Days30 = 'days30',
    AllTime = 'allTime',
}

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
     * Stats range to show data for.
     *
     * FIXME: Replace with actual data (probably it will be stored in background).
     */
    @observable range: StatsRange = StatsRange.Days7;

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
     * Set the stats range.
     *
     * FIXME: Replace with actual implementation (probably it will need to update in background).
     *
     * @param range New range value.
     */
    @action setRange = (range: StatsRange) => {
        this.range = range;
    };

    /**
     * Clear the stats.
     *
     * FIXME: Replace with actual implementation (probably it will send message to background).
     * FIXME: Clarify is it clears based on current screen or clears all stats.
     */
    @action clearStats = () => {};

    /**
     * Total data usage across all locations.
     *
     * FIXME: Replace with actual data.
     */
    @computed get totalUsageData(): DataUsage {
        return {
            downloadBytes: 4.2e9,
            uploadBytes: 789e6,
        };
    }
}
