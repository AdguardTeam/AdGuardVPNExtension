import * as v from 'valibot';

import { type ExperimentSlot, type SessionStartResponse } from '../telemetry/telemetryTypes';
import { browserApi } from '../browserApi';
import { log } from '../../common/logger';

import { type ExperimentRegistry } from './constants';

/**
 * Schema for the variant cache stored in browser.storage.local.
 * Maps ExperimentSlot keys to version_name strings.
 */
const variantCacheSchema = v.record(
    v.union([
        v.literal('experiment_1'),
        v.literal('experiment_2'),
        v.literal('experiment_3'),
    ]),
    v.string(),
);

/**
 * In-memory variant cache type.
 */
export type VariantCache = Partial<Record<ExperimentSlot, string>>;

/**
 * Slot-based A/B test manager for the new split-testing platform.
 *
 * Manages experiment variant assignments via the /api/v1/session_start endpoint.
 * Caches server-assigned variants in local storage and exposes them
 * for injection into all telemetry event props.
 */
class ABTestManager {
    /**
     * Storage key for the variant cache.
     */
    public static readonly VARIANTS_STORAGE_KEY = 'ab_test_manager.variants';

    /**
     * Experiment registry defining active experiments.
     */
    private readonly registry: ExperimentRegistry;

    /**
     * In-memory variant cache. Populated by init() and processResponse().
     */
    private variantCache: VariantCache | null = null;

    /**
     * Promise that resolves when variantCache is loaded from storage.
     * Used for lazy initialization.
     */
    private variantCachePromise: Promise<VariantCache> | null = null;

    /**
     * @param registry Experiment registry entries (slot → experimentId mappings).
     */
    constructor(registry: ExperimentRegistry) {
        this.registry = registry;
    }

    /**
     * Ensures variantCache is loaded from storage.
     * Uses lazy loading, subsequent calls reuse the same promise.
     *
     * @returns Promise that resolves to the variant cache.
     */
    private async getVariantsCache(): Promise<VariantCache> {
        if (this.variantCache !== null) {
            return this.variantCache;
        }

        if (this.variantCachePromise === null) {
            this.variantCachePromise = this.loadFromStorage()
                .then((cache) => {
                    this.variantCache = cache;
                    return cache;
                })
                .finally(() => {
                    this.variantCachePromise = null;
                });
        }

        return this.variantCachePromise;
    }

    /**
     * Builds the `tests` payload for the session_start request.
     * Only includes slots from the registry that have no cached variant.
     *
     * @returns Partial record of slot → experimentId for unassigned slots.
     */
    public async getTestsPayload(): Promise<VariantCache> {
        const cache = await this.getVariantsCache();
        const tests: VariantCache = {};

        const entries = Object.entries(this.registry) as [ExperimentSlot, string][];
        entries.forEach(([slot, experimentId]) => {
            if (!cache[slot]) {
                tests[slot] = experimentId;
            }
        });

        return tests;
    }

    /**
     * Processes the session_start response, caching returned version_name values.
     * Only slots present in the registry are accepted; unknown slots are ignored.
     *
     * @param response Parsed response from the session_start endpoint.
     */
    public async processResponse(response: SessionStartResponse): Promise<void> {
        const cache = await this.getVariantsCache();
        let hasChanges = false;

        const entries = Object.entries(response.versions) as [
            ExperimentSlot,
            SessionStartResponse['versions'][ExperimentSlot],
        ][];

        entries.forEach(([slot, assignment]) => {
            if (!(slot in this.registry)) {
                return;
            }

            if (assignment?.version_name) {
                cache[slot] = assignment.version_name;
                hasChanges = true;
            }
        });

        if (hasChanges) {
            await this.saveToStorage(cache);
        }
    }

    /**
     * Returns the current variant cache for injection into telemetry event props.
     * Only slots with a cached variant are included.
     *
     * @returns Partial record of slot → version_name for assigned slots only.
     */
    public async getVariantsForProps(): Promise<VariantCache> {
        const cache = await this.getVariantsCache();
        const result: VariantCache = {};

        const entries = Object.entries(cache) as [ExperimentSlot, string | undefined][];
        entries.forEach(([slot, versionName]) => {
            if (versionName) {
                result[slot] = versionName;
            }
        });

        return result;
    }

    /**
     * Loads the variant cache from browser.storage.local.
     * Returns an empty cache if storage is empty or the value fails validation.
     *
     * @returns Validated variant cache.
     */
    private async loadFromStorage(): Promise<VariantCache> {
        const raw = await browserApi.storage.get(ABTestManager.VARIANTS_STORAGE_KEY);

        if (!raw) {
            return {};
        }

        try {
            return v.parse(variantCacheSchema, raw);
        } catch (e) {
            log.error('[vpn.ABTestManager.loadFromStorage]: Failed to parse variant cache from storage', e, 'using empty cache');
            return {};
        }
    }

    /**
     * Persists the variant cache to browser.storage.local.
     *
     * @param cache Variant cache to persist.
     */
    private async saveToStorage(cache: VariantCache): Promise<void> {
        await browserApi.storage.set(ABTestManager.VARIANTS_STORAGE_KEY, cache);
    }
}

export { ABTestManager };
