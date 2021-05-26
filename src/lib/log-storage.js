const MAX_LOG_SIZE_BYTES = 5 * (2 ** 20); // 5MB

export class LogStorage {
    constructor(maxLogSizeBytes = MAX_LOG_SIZE_BYTES) {
        this.maxLogSizeBytes = maxLogSizeBytes;
    }

    logs = [];

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
    };

    toString() {
        return this.logs.join('\n');
    }

    get size() {
        return this.logSizeBytes;
    }
}

export const logStorage = new LogStorage(MAX_LOG_SIZE_BYTES);
