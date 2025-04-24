import { action, computed, observable } from 'mobx';

import { type RootStore } from './RootStore';

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
