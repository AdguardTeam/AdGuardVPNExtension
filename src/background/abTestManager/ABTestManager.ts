import {
    type ExperimentsResponse,
    type VersionsResponse,
    versionsSchema,
} from '../schema/credentials/trackInstallResponse';
import { browserApi } from '../browserApi';
import { log } from '../../common/logger';

import { AG47804_STREAMING_B_FLOW_VERSION_ID, AG47804_STREAMING_DEFAULT_FLOW_VERSION_ID } from './constants';

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
    getExperiments(): string {
        return this.experiments.join(',');
    }

    /**
     * Set versions response.
     * @param experiments - An object representing the experiments response.
     */
    async setVersions(experiments: ExperimentsResponse): Promise<void> {
        this.versions = experiments?.selected_versions ?? [];
        await this.setVersionsToStorage(this.versions);
    }

    /**
     * Store versions response in browser storage.
     * @param versions - An object representing the versions response.
     */
    async setVersionsToStorage(versions: VersionsResponse): Promise<void> {
        await browserApi.storage.set(ABTestManager.VERSIONS_STORAGE_KEY, versions);
    }

    /**
     * Retrieve versions response from browser storage.
     * @returns An object representing the versions response.
     */
    async getVersionsFromStorage(): Promise<VersionsResponse> {
        const rawVersions = await browserApi.storage.get(ABTestManager.VERSIONS_STORAGE_KEY);
        let versions: VersionsResponse = [];
        try {
            versions = versionsSchema.parse(rawVersions);
        } catch (e) {
            log.error('[vpn.ABTestManager.getVersionsFromStorage]: Failed to parse versions from storage', e, 'using default versions');
        }
        return versions;
    }

    /**
     * Retrieve or initialize the versions response.
     * @returns An object representing the versions response.
     */
    async getVersions(): Promise<VersionsResponse> {
        if (!this.versions) {
            this.versions = await this.getVersionsFromStorage();
        }

        return this.versions;
    }

    /**
     * Determine whether streaming label text should be shown.
     * @returns True if streaming label text should be shown, false otherwise.
     */
    async isShowStreamingLabelText(): Promise<boolean> {
        const versions = await this.getVersions();
        return !!versions?.find(({ version }) => version === AG47804_STREAMING_DEFAULT_FLOW_VERSION_ID);
    }

    /**
     * Returns the streaming text experiment version.
     * @returns The experiment version ID, or null if no experiment found.
     */
    async getStreamingTextExperiment(): Promise<string | null> {
        const versions = await this.getVersions();
        return (
            versions?.find(({ version }) => version === AG47804_STREAMING_DEFAULT_FLOW_VERSION_ID)
            || versions?.find(({ version }) => version === AG47804_STREAMING_B_FLOW_VERSION_ID)
        )?.version || null;
    }
}

export { ABTestManager };
