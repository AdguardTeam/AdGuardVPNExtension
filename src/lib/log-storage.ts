import throttle from 'lodash/throttle';

import browserApi from '../background/browserApi';

const MAX_LOG_SIZE_BYTES = 2 ** 20; // 1MB
export const LOGS_STORAGE_KEY = 'logs.storage.key';
const SAVE_STORAGE_LOGS_TIMOUT = 5 * 1000; // 5 sec

interface LogStorageInterface {
    maxLogSizeBytes: number;
    logSizeBytes: number;
    logs: string[];
    addLog(...logStrings: string[]): void;
    getLogsString(): Promise<string>;
}

export class LogStorage implements LogStorageInterface {
    constructor(maxLogSizeBytes = MAX_LOG_SIZE_BYTES) {
        this.maxLogSizeBytes = maxLogSizeBytes;
    }

    maxLogSizeBytes: number;

    logSizeBytes: number = 0;

    logs: string[] = [];

    throttledLogsSaver = throttle(
        this.saveLogsToStorage,
        SAVE_STORAGE_LOGS_TIMOUT,
    );

    freeSpaceIfNecessary = (size: number): void => {
        while (this.logSizeBytes + size > this.maxLogSizeBytes) {
            const headLog = this.logs.shift();
            if (!headLog) {
                return;
            }
            const headLogSize = new Blob([headLog]).size;
            this.logSizeBytes -= headLogSize;
        }
    };

    addLog = (...logStrings: string[]): void => {
        const logString = logStrings.map((arg) => {
            try {
                return JSON.stringify(arg);
            } catch (e) {
                return arg;
            }
        }).join(' ');
        const logSize = new Blob([logString]).size;
        this.freeSpaceIfNecessary(logSize);
        this.logSizeBytes += logSize;
        this.logs.push(logString);
        this.throttledLogsSaver();
    };

    async getLogsString(): Promise<string> {
        const logs = await this.getLogs();
        return logs.join('\n');
    }

    get size(): number {
        return this.logSizeBytes;
    }

    /**
     * Returns logs from storage merged with current logs
     */
    async getLogs(): Promise<string[]> {
        const storageLogs = await browserApi.storage.get(LOGS_STORAGE_KEY);
        if (!storageLogs) {
            return this.logs;
        }

        return storageLogs.concat(this.logs);
    }

    /**
     * Saves all logs to storage and clears current log
     */
    async saveLogsToStorage(): Promise<void> {
        const logs = await this.getLogs();
        this.logs = [];
        await browserApi.storage.set(LOGS_STORAGE_KEY, logs);
    }
}

export const logStorage = new LogStorage(MAX_LOG_SIZE_BYTES);
