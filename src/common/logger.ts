/* eslint-disable no-console */
import { Logger, LogLevel } from '@adguard/logger';

import { logStorage } from './log-storage';

const writer = {
    log: (...args: any) => {
        logStorage.addLog(...args);
        console.log(...args);
    },
    info: (...args: any) => {
        logStorage.addLog(...args);
        console.info(...args);
    },
    error: (...args: any) => {
        logStorage.addLog(...args);
        console.error(...args);
    },
};

const log = new Logger(writer);
log.currentLevel = LogLevel.Debug;

export { log };
