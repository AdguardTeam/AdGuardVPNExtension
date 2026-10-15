import * as v from 'valibot';

import {
    experimentSlotSchema,
    variantAssignmentSchema,
    type ExperimentSlot,
    type VariantAssignment,
    type SessionStartResponse,
} from '../schema/telemetry/sessionStartResponse';
import { browserApi } from '../browserApi';
import { log } from '../../common/logger';
import { PromiseQueue } from '../../common/promiseQueue';

import { type ExperimentRegistry } from './constants';

const { decorator: serialized } = new PromiseQueue();

/**
 * Schema for the variant cache stored in browser.storage.local.
 * Maps experiment slots to their experiment and variant names.
 */
const variantCacheSchema = v.record(experimentSlotSchema, variantAssignmentSchema);

/**
 * Schema for the legacy variant cache format that stored plain version names.
 */
const legacyVariantCacheSchema = v.record(experimentSlotSchema, v.string());

/**
 * Telemetry-facing variant cache type.
 */
export type ExperimentSlotValues = Partial<Record<ExperimentSlot, string>>;

type StoredVariantCache = Partial<Record<ExperimentSlot, VariantAssignment>>;

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
     * In-memory variant cache. Loaded lazily by getVariantsCache().
     */
    private variantCache: StoredVariantCache | null = null;

    /**
     * Promise that resolves when variantCache is loaded from storage.
     * Used for lazy initialization.
     */
    private variantCachePromise: Promise<StoredVariantCache> | null = null;

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
    private async getVariantsCache(): Promise<StoredVariantCache> {
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
    public async getTestsPayload(): Promise<ExperimentSlotValues> {
        const cache = await this.getVariantsCache();
        const tests: ExperimentSlotValues = {};

        experimentSlotSchema.options.forEach((slot) => {
            const experimentId = this.registry[slot];

            if (!experimentId || cache[slot] !== undefined) {
                return;
            }

            tests[slot] = experimentId;
        });

        return tests;
    }

    /**
     * Processes the session_start response and caches matching assignments.
     * Each assignment is validated separately; malformed assignments are
     * ignored while the remaining slots stay usable.
     *
     * @param response Parsed response from the session_start endpoint.
     *
     * @returns Promise that resolves when assignments are persisted.
     */
    @serialized
    public async processResponse(response: SessionStartResponse): Promise<void> {
        const cache = await this.getVariantsCache();
        const rejectedSlots: Array<{ slot: ExperimentSlot; reason: string }> = [];
        let hasChanges = false;

        experimentSlotSchema.options.forEach((slot) => {
            if (!this.registry[slot]) {
                return;
            }

            const assignment = response.versions[slot];

            if (assignment === undefined) {
                return;
            }

            const parsed = v.safeParse(variantAssignmentSchema, assignment);

            if (!parsed.success) {
                rejectedSlots.push({ slot, reason: 'invalid assignment' });
                return;
            }

            if (parsed.output.experiment_name !== this.registry[slot]) {
                rejectedSlots.push({ slot, reason: 'experiment name mismatch' });
                return;
            }

            cache[slot] = parsed.output;
            hasChanges = true;
        });

        if (rejectedSlots.length > 0) {
            log.debug('[vpn.ABTestManager.processResponse]: Ignoring assignments for registered slots', rejectedSlots);
        }

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
    public async getVariantsForProps(): Promise<ExperimentSlotValues> {
        const cache = await this.getVariantsCache();
        const result: ExperimentSlotValues = {};

        experimentSlotSchema.options.forEach((slot) => {
            const cachedVariant = cache[slot];

            if (cachedVariant !== undefined) {
                result[slot] = cachedVariant.version_name;
            }
        });

        return result;
    }

    /**
     * Removes cached variants that do not belong to active experiments.
     * A variant is retired when its slot is absent from the registry or its
     * cached experiment name differs from the active experiment ID for that slot.
     * Remaining variants are persisted, or the storage key is removed when
     * no variants remain.
     *
     * @returns Promise that resolves when retired variants are removed.
     *
     * @throws If the variant cache cannot be persisted or removed from storage.
     */
    @serialized
    public async removeRetiredVariants(): Promise<void> {
        const cache = await this.getVariantsCache();
        const retiredSlots = experimentSlotSchema.options.filter((slot) => {
            const cachedVariant = cache[slot];

            if (cachedVariant === undefined) {
                return false;
            }

            const experimentId = this.registry[slot];

            return !experimentId || cachedVariant.experiment_name !== experimentId;
        });

        if (retiredSlots.length === 0) {
            return;
        }

        log.debug('[vpn.ABTestManager.removeRetiredVariants]: Removing retired variant slots', retiredSlots);

        retiredSlots.forEach((slot) => {
            delete cache[slot];
        });

        if (Object.keys(cache).length === 0) {
            await browserApi.storage.remove(ABTestManager.VARIANTS_STORAGE_KEY);
            return;
        }

        await this.saveToStorage(cache);
    }

    /**
     * Loads the variant cache from browser.storage.local.
     * Returns an empty cache if storage is empty or the read fails.
     * Legacy string caches are migrated to the assignment format.
     * Unsupported formats are removed so assignments can be requested again.
     *
     * @returns Validated variant cache.
     */
    private async loadFromStorage(): Promise<StoredVariantCache> {
        let raw: unknown;

        try {
            raw = await browserApi.storage.get(ABTestManager.VARIANTS_STORAGE_KEY);
        } catch (e) {
            log.error('[vpn.ABTestManager.loadFromStorage]: Failed to read variant cache from storage', e, 'using empty cache');
            return {};
        }

        if (!raw) {
            return {};
        }

        const parsed = v.safeParse(variantCacheSchema, raw);

        if (parsed.success) {
            return parsed.output;
        }

        const legacyParsed = v.safeParse(legacyVariantCacheSchema, raw);

        if (legacyParsed.success) {
            const migrated = this.migrateLegacyCache(legacyParsed.output);
            await this.persistMigratedCache(migrated);
            return migrated;
        }

        log.info(
            '[vpn.ABTestManager.loadFromStorage]: Unsupported variant cache format, resetting assignments',
            parsed.issues,
        );
        await this.clearInvalidCache();
        return {};
    }

    /**
     * Migrates a legacy string variant cache to the assignment format.
     * The legacy format does not store the experiment name, so entries of
     * registered slots with a non-empty version name are kept under the
     * active experiment ID; other entries are dropped and requested again.
     *
     * @param legacyCache Legacy slot to version_name cache.
     *
     * @returns Migrated assignment cache.
     */
    private migrateLegacyCache(legacyCache: ExperimentSlotValues): StoredVariantCache {
        const migrated: StoredVariantCache = {};
        const droppedSlots: ExperimentSlot[] = [];

        experimentSlotSchema.options.forEach((slot) => {
            const versionName = legacyCache[slot];
            const experimentId = this.registry[slot];

            if (!experimentId || !versionName) {
                if (versionName !== undefined) {
                    droppedSlots.push(slot);
                }

                return;
            }

            migrated[slot] = {
                experiment_name: experimentId,
                version_name: versionName,
            };
        });

        log.debug('[vpn.ABTestManager.migrateLegacyCache]: Migrating legacy variant cache', {
            migrated: Object.keys(migrated),
            dropped: droppedSlots,
        });

        return migrated;
    }

    /**
     * Persists a migrated cache, removing the storage key when nothing remains.
     * Storage errors are caught and logged without blocking the in-memory
     * migration, so this method never rejects.
     *
     * @param migrated Migrated assignment cache.
     */
    private async persistMigratedCache(migrated: StoredVariantCache): Promise<void> {
        try {
            if (Object.keys(migrated).length === 0) {
                await browserApi.storage.remove(ABTestManager.VARIANTS_STORAGE_KEY);
                return;
            }

            await this.saveToStorage(migrated);
        } catch (e) {
            log.warn('[vpn.ABTestManager.persistMigratedCache]: Failed to persist migrated variant cache', e);
        }
    }

    /**
     * Removes a cache with an unsupported format so assignments can be requested again.
     */
    private async clearInvalidCache(): Promise<void> {
        try {
            await browserApi.storage.remove(ABTestManager.VARIANTS_STORAGE_KEY);
        } catch (e) {
            log.error('[vpn.ABTestManager.clearInvalidCache]: Failed to remove invalid variant cache', e);
        }
    }

    /**
     * Persists the variant cache to browser.storage.local.
     *
     * @param cache Variant cache to persist.
     */
    private async saveToStorage(cache: StoredVariantCache): Promise<void> {
        await browserApi.storage.set(ABTestManager.VARIANTS_STORAGE_KEY, cache);
    }
}

export { ABTestManager };
