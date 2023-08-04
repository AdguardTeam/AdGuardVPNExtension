import throttle from 'lodash/throttle';

import { browserApi } from '../background/browserApi';

export const MAX_LOGS_SIZE_ELEMENTS = 1000;
export const LOGS_STORAGE_KEY = 'logs.storage.key';
export const SAVE_STORAGE_LOGS_TIMEOUT_MS = 5 * 1000; // 5 sec

export interface LogStorageInterface {
    maxLogSizeElements: number;
    logs: string[];
    addLog(...logStrings: string[] | { [key: string]: string }[]): void;
    getLogsString(): Promise<string>;
}

/**
 * Class representing a log storage system.
 * @implements {LogStorageInterface}
 */
export class LogStorage implements LogStorageInterface {
    /**
     * Creates a new LogStorage instance.
     * @param [maxLogSizeElements=MAX_LOGS_SIZE_ELEMENTS] Maximum number of log elements.
     * @param [saveStorageLogsTimeoutMs=SAVE_STORAGE_LOGS_TIMEOUT_MS] Timeout for saving logs to storage in
     *  milliseconds.
     */
    constructor(
        maxLogSizeElements = MAX_LOGS_SIZE_ELEMENTS,
        saveStorageLogsTimeoutMs = SAVE_STORAGE_LOGS_TIMEOUT_MS,
    ) {
        this.maxLogSizeElements = maxLogSizeElements;
        this.saveStorageLogsTimeoutMs = saveStorageLogsTimeoutMs;
    }

    /**
     * Maximum number of log elements.
     */
    maxLogSizeElements: number;

    /**
     * Timeout for saving logs to storage in milliseconds.
     */
    saveStorageLogsTimeoutMs: number;

    /**
     * Array of log strings.
     */
    logs: string[] = [];

    /**
     * Throttled function to save logs to storage.
     */
    throttledLogsSaver = throttle(
        this.saveLogsToStorage,
        SAVE_STORAGE_LOGS_TIMEOUT_MS,
    );

    /**
     * Saves logs to storage
     * @param logStrings
     */
    addLog = (...logStrings: string[]): void => {
        const logString = logStrings.map((arg) => {
            try {
                return JSON.stringify(arg);
            } catch (e) {
                return arg;
            }
        }).join(' ');
        this.logs.push(logString);
        this.throttledLogsSaver();
    };

    /**
     * Returns logs as a string
     */
    async getLogsString(): Promise<string> {
        const logs = await this.getLogs();
        return logs.join('\n');
    }

    /**
     * Returns logs from storage merged with current logs
     */
    async getLogs(): Promise<string[]> {
        const storageLogs = await browserApi.storage.get<string[]>(LOGS_STORAGE_KEY);
        if (!storageLogs) {
            return this.logs;
        }

        return storageLogs.concat(this.logs);
    }

    /**
     * Limits log size to maxLogSizeElements
     * @param logs
     */
    limitLogSize = (logs: string[]): string[] => {
        return logs.slice(-this.maxLogSizeElements);
    };

    /**
     * Saves all logs to storage and clears current log
     */
    async saveLogsToStorage(): Promise<void> {
        let logs = await this.getLogs();
        this.logs = [];
        logs = this.limitLogSize(logs);
        await browserApi.storage.set(LOGS_STORAGE_KEY, logs);
    }
}

export const logStorage = new LogStorage(MAX_LOGS_SIZE_ELEMENTS);
