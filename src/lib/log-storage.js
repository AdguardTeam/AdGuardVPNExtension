import { format } from 'date-fns';
import browserApi from '../background/browserApi';

const MAX_LOG_SIZE_BYTES = 5 * (2 ** 20); // 5MB
const LOGS_STORAGE_KEY = 'logs.storage.key';

export class LogStorage {
    constructor(maxLogSizeBytes = MAX_LOG_SIZE_BYTES) {
        this.maxLogSizeBytes = maxLogSizeBytes;
        this.logs = [];
        (async () => {
            const logsFromStorage = await this.getLogsFromStorage();
            if (logsFromStorage) {
                this.logs = logsFromStorage.split('\n');
            }
        })();
    }

    logSizeBytes = 0;

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
        this.saveLogsToStorage(this.logs.join('\n'));
    };

    toString() {
        return this.logs.join('\n');
    }

    get size() {
        return this.logSizeBytes;
    }

    async saveLogsToStorage(logs) {
        await browserApi.storage.set(LOGS_STORAGE_KEY, logs);
    }

    async getLogsFromStorage() {
        return browserApi.storage.get(LOGS_STORAGE_KEY);
    }

    saveLogsToFile() {
        const currentTimeString = format(Date.now(), 'yyyyMMdd_HHmmss');
        const filename = `adguard-vpn_logs_${currentTimeString}.txt`;

        const blob = new Blob([this.logs.join('\n')]);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }
}

export const logStorage = new LogStorage(MAX_LOG_SIZE_BYTES);
