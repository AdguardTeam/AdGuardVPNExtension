/**
 * @module BrowserLogStorageProvider
 * Provides an implementation of the LogStorageProvider interface for storing logs in the browser's storage.
 */

import { browserApi } from '../../../../background/browserApi';
import type { LogStorageProvider } from '../LogStorageProvider';

import { type Logs, logsValidator } from './logsSchema';

/**
 * The key used to store logs in the browser's storage.
 * @constant
 */
export const LOGS_STORAGE_KEY = 'logs.storage.key';

/**
 * Implements the LogStorageProvider interface to provide mechanisms for storing,
 * retrieving, and clearing logs in the browser's storage.
 *
 * @class
 * @implements {LogStorageProvider}
 */
export class BrowserLogStorageProvider implements LogStorageProvider {
    /**
     * Stores the provided logs in the browser's storage.
     *
     * @param logs - The logs to store.
     * @returns Resolves once the logs have been stored.
     */
    public set(logs: string[]): Promise<void> {
        return browserApi.storage.set(LOGS_STORAGE_KEY, logs);
    }

    /**
     * Retrieves the logs from the browser's storage.
     *
     * @returns Resolves with the retrieved logs. If no logs are found, resolves with an empty array.
     */
    public async get(): Promise<string[]> {
        const logsFromStorage = await browserApi.storage.get(LOGS_STORAGE_KEY);
        let logs: Logs;
        try {
            logs = logsValidator.parse(logsFromStorage);
        } catch (e) {
            // we use here simple console, because this module is used in the logger.
            // eslint-disable-next-line no-console
            console.error(`Error parsing logs from storage: ${e}`, 'Setting logs to the empty array.');
            logs = [];
        }

        return logs;
    }

    /**
     * Clears the logs from the browser's storage.
     *
     * @returns Resolves once the logs have been cleared.
     */
    public clear(): Promise<void> {
        return browserApi.storage.remove(LOGS_STORAGE_KEY);
    }
}
