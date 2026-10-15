import { PromiseQueue } from '../../../common/promiseQueue';

import { type ProfileStore } from './ProfileStore';

/**
 * All session stores share one serialization queue (intentional):
 * they read/write the same `ProfileSessionState` key, so their
 * read-modify-write cycles must be serialized together to avoid
 * lost updates and data resurrection. A module-level queue (not a
 * per-instance one) is what makes this work across store instances.
 */
const queue = new PromiseQueue();
const { decorator: serialized } = queue;

/**
 * Per-profile store persisted in session storage.
 * Data survives service-worker restarts and is removed
 * when the profile is deleted.
 */
export class SessionProfileStore<T> implements ProfileStore<T> {
    /**
     * Reads the whole profile map from session storage.
     */
    private readonly getData: () => Promise<Record<string, T>>;

    /**
     * Writes the whole profile map to session storage.
     */
    private readonly setData: (data: Record<string, T>) => Promise<void>;

    /**
     * Rejects writes for profile IDs that were deleted (tombstone guard),
     * closing the set-after-delete resurrection window.
     */
    private readonly canWrite: (profileId: string) => boolean;

    /**
     * @param getData Reads the profile map from session storage.
     * @param setData Writes the profile map to session storage.
     * @param canWrite Whether a profile is still allowed to be written.
     */
    constructor(
        getData: () => Promise<Record<string, T>>,
        setData: (data: Record<string, T>) => Promise<void>,
        canWrite: (profileId: string) => boolean,
    ) {
        this.getData = getData;
        this.setData = setData;
        this.canWrite = canWrite;
    }

    /**
     * @param profileId Profile ID.
     * @returns Stored value or undefined.
     */
    @serialized
    public async get(profileId: string): Promise<T | undefined> {
        const data = await this.getData();
        return Object.hasOwn(data, profileId) ? data[profileId] : undefined;
    }

    /**
     * Stores a value for the given profile.
     *
     * @param profileId Profile ID.
     * @param value Value to store.
     */
    @serialized
    public async set(profileId: string, value: T): Promise<void> {
        if (!this.canWrite(profileId)) {
            return;
        }
        const data = await this.getData();
        await this.setData({ ...data, [profileId]: value });
    }

    /**
     * Removes the value for the given profile. No-op if absent.
     *
     * @param profileId Profile ID.
     */
    @serialized
    public async delete(profileId: string): Promise<void> {
        const data = await this.getData();
        if (!Object.hasOwn(data, profileId)) {
            return;
        }
        const updated = { ...data };
        delete updated[profileId];
        await this.setData(updated);
    }
}
