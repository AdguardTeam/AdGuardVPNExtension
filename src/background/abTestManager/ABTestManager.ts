import {
    type ExperimentsResponse,
    type VersionsResponse,
    versionsSchema,
} from '../schema/credentials/trackInstallResponse';
import { browserApi } from '../browserApi';
import { log } from '../../common/logger';

import { AG21492_SHOW_SCREENSHOT_FLOW_VERSION_ID } from './constants';

/**
 * Class representing a manager for handling AB tests.
 */
class ABTestManager {
    /**
     * A list of experiment names.
     */
    experiments: string[] = [];

    /**
     * An object representing the versions response
     */
    versions: VersionsResponse;

    /**
     * Key for storing versions in browser storage.
     */
    static VERSIONS_STORAGE_KEY = 'ab_test_manager.versions';

    /**
     * Create a new ABTestManager.
     * @param experiments - An array of experiment names.
     */
    constructor(experiments: string[]) {
        this.experiments = experiments;
    }

    /**
     * Get a comma-separated string of experiments.
     * @returns A string of experiments.
     */
    getExperiments() {
        return this.experiments.join(',');
    }

    /**
     * Set versions response.
     * @param experiments - An object representing the experiments response.
     */
    async setVersions(experiments: ExperimentsResponse) {
        this.versions = experiments?.versions ?? [];
        await this.setVersionsToStorage(this.versions);
    }

    /**
     * Store versions response in browser storage.
     * @param versions - An object representing the versions response.
     */
    async setVersionsToStorage(versions: VersionsResponse) {
        await browserApi.storage.set(ABTestManager.VERSIONS_STORAGE_KEY, versions);
    }

    /**
     * Retrieve versions response from browser storage.
     * @returns An object representing the versions response.
     */
    async getVersionsFromStorage() {
        const rawVersions = await browserApi.storage.get(ABTestManager.VERSIONS_STORAGE_KEY);
        let versions: VersionsResponse = [];
        try {
            versions = versionsSchema.parse(rawVersions);
        } catch (e) {
            log.error('Failed to parse versions from storage', e, 'using default versions');
        }
        return versions;
    }

    /**
     * Retrieve or initialize the versions response.
     * @returns An object representing the versions response.
     */
    async getVersions() {
        if (!this.versions) {
            this.versions = await this.getVersionsFromStorage();
        }

        return this.versions;
    }

    /**
     * Determine whether the screenshot flow should be shown.
     * @returns {boolean} True if the screenshot flow should be shown, false otherwise.
     */
    async isShowScreenshotFlow() {
        const versions = await this.getVersions();
        return !!versions?.includes(AG21492_SHOW_SCREENSHOT_FLOW_VERSION_ID);
    }
}

export { ABTestManager };
