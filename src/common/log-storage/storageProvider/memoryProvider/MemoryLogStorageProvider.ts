/**
 * @module MemoryLogStorageProvider
 * Provides an implementation of the LogStorageProvider interface for storing logs in memory.
 */

import { type LogStorageProvider } from '../LogStorageProvider';

/**
 * Implements the LogStorageProvider interface to provide mechanisms for storing,
 * retrieving, and clearing logs in memory.
 *
 * @class
 * @implements {LogStorageProvider}
 */
export class MemoryLogStorageProvider implements LogStorageProvider {
    /**
     * Holds the logs in memory.
     */
    logs: string[] = [];

    /**
     * Stores the provided logs in memory.
     *
     * @param logs - The logs to store.
     * @returns A promise that resolves once the logs have been stored.
     */
    public set(logs: string[]): Promise<void> {
        this.logs = logs;
        return Promise.resolve();
    }

    /**
     * Retrieves the logs from memory.
     *
     * @returns A promise that resolves with the retrieved logs.
     */
    public get(): Promise<string[]> {
        return Promise.resolve(this.logs);
    }

    /**
     * Clears the logs from memory.
     *
     * @returns A promise that resolves once the logs have been cleared.
     */
    public clear(): Promise<void> {
        this.logs = [];
        return Promise.resolve();
    }
}
