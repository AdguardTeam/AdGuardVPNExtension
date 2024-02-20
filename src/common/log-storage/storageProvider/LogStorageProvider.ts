/**
 * Defines the contract for log storage providers.
 *
 * Implementations of this interface should provide mechanisms to set, retrieve, and clear logs.
 */
export interface LogStorageProvider {
    /**
     * Stores the provided logs.
     *
     * @param logs - The logs to store.
     * @returns A promise that resolves once the logs have been stored.
     */
    set(logs: string[]): Promise<void>;

    /**
     * Retrieves the stored logs.
     *
     * @returns A promise that resolves with the retrieved logs.
     */
    get(): Promise<string[]>;

    /**
     * Clears the stored logs.
     *
     * @returns A promise that resolves once the logs have been cleared.
     */
    clear(): Promise<void>;
}
