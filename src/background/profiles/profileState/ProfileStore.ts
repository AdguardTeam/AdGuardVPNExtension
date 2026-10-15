/**
 * Minimal interface of a per-profile store needed for cleanup.
 * Independent of the stored value type.
 */
export interface ProfileStoreCleaner {
    /**
     * Removes the value for the given profile. No-op if absent.
     *
     * @param profileId Profile ID.
     */
    delete(profileId: string): Promise<void>;
}

/**
 * Common interface for per-profile stores (in-memory or session-backed).
 */
export interface ProfileStore<T> extends ProfileStoreCleaner {
    /**
     * @param profileId Profile ID.
     * @returns Stored value or undefined.
     */
    get(profileId: string): Promise<T | undefined>;

    /**
     * Stores a value for the given profile.
     *
     * @param profileId Profile ID.
     * @param value Value to store.
     */
    set(profileId: string, value: T): Promise<void>;
}
