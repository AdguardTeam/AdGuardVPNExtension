import { type ProfileStore } from './ProfileStore';

/**
 * Per-profile store kept only in memory.
 * Data is lost when the service worker restarts.
 */
export class InMemoryProfileStore<T> implements ProfileStore<T> {
    /**
     * Profile ID to value.
     */
    private readonly data = new Map<string, T>();

    /**
     * Rejects writes for profile IDs that were deleted.
     */
    private readonly canWrite: (profileId: string) => boolean;

    /**
     * @param canWrite Whether a profile is still allowed to be written.
     */
    constructor(canWrite: (profileId: string) => boolean) {
        this.canWrite = canWrite;
    }

    /**
     * @param profileId Profile ID.
     * @returns Stored value or undefined.
     */
    public async get(profileId: string): Promise<T | undefined> {
        return this.data.get(profileId);
    }

    /**
     * Stores a value for the given profile.
     *
     * @param profileId Profile ID.
     * @param value Value to store.
     */
    public async set(profileId: string, value: T): Promise<void> {
        if (!this.canWrite(profileId)) {
            return;
        }
        this.data.set(profileId, value);
    }

    /**
     * Atomically returns the existing value for the profile or creates,
     * stores and returns a new one. The check and the store happen without
     * an await in between, so concurrent calls share one value.
     *
     * @param profileId Profile ID.
     * @param factory Creates the value on cache miss.
     * @returns The existing or newly created value, or undefined if writes are rejected.
     */
    public getOrCreate(profileId: string, factory: () => T): T | undefined {
        if (!this.canWrite(profileId)) {
            return undefined;
        }
        if (this.data.has(profileId)) {
            return this.data.get(profileId)!;
        }
        const created = factory();
        this.data.set(profileId, created);
        return created;
    }

    /**
     * Removes the value for the given profile. No-op if absent.
     *
     * @param profileId Profile ID.
     */
    public async delete(profileId: string): Promise<void> {
        this.data.delete(profileId);
    }

    /**
     * @returns All profile IDs that have stored values.
     */
    public async getProfileIds(): Promise<string[]> {
        return [...this.data.keys()];
    }
}
