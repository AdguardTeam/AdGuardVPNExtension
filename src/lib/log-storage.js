import throttle from 'lodash/throttle';

import browserApi from '../background/browserApi';

const MAX_LOG_SIZE_BYTES = 5 * (2 ** 20); // 5MB
const LOGS_STORAGE_KEY = 'logs.storage.key';
const SAVE_STORAGE_LOGS_TIMOUT = 5 * 1000; // 5 sec

export class LogStorage {
    constructor(maxLogSizeBytes = MAX_LOG_SIZE_BYTES) {
        this.maxLogSizeBytes = maxLogSizeBytes;
    }

    logSizeBytes = 0;

    logs = [];

    init = () => {
        // save logs to browser storage every 5 seconds
        setInterval(() => {
            this.throttledLogsSaver();
        }, SAVE_STORAGE_LOGS_TIMOUT);
    };

    throttledLogsSaver = throttle(
        this.saveLogsToStorage,
        SAVE_STORAGE_LOGS_TIMOUT,
    );

    freeSpaceIfNecessary = (size) => {
        while (this.logSizeBytes + size > this.maxLogSizeBytes) {
            const headLog = this.logs.shift();
            const headLogSize = new Blob([headLog]).size;
            this.logSizeBytes -= headLogSize;
        }
    };

    addLog = (...logStrings) => {
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
    };

    async toString() {
        const logs = await this.getLogs();
        return logs.join('\n');
    }

    get size() {
        return this.logSizeBytes;
    }

    /**
     * Returns logs from storage merged with current logs
     */
    async getLogs() {
        const storageLogs = await browserApi.storage.get(LOGS_STORAGE_KEY);
        return storageLogs.concat(this.logs);
    }

    /**
     * Saves all logs to storage and clears current log
     */
    async saveLogsToStorage() {
        const logs = await this.getLogs();
        await browserApi.storage.set(LOGS_STORAGE_KEY, logs);
        this.logs = [];
    }
}

export const logStorage = new LogStorage(MAX_LOG_SIZE_BYTES);
