/* eslint-disable no-console */
import { Logger, LogLevel } from '@adguard/logger';

import { logStorage } from './log-storage';

// Extracting `Writer` interface from `Logger`
type Writer = ConstructorParameters<typeof Logger>[0];

const writer: Writer = {
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

// @ts-ignore - Importing from 'background/config' throws error
const IS_DEV = __APP_CONFIG__.BUILD_ENV === 'dev';

// If build environment is 'dev' we log our messages with collapsed trace.
if (IS_DEV) {
    writer.trace = console.trace;
    writer.groupCollapsed = console.groupCollapsed;
    writer.groupEnd = console.groupEnd;
}

const log = new Logger(writer);
log.currentLevel = IS_DEV
    ? LogLevel.Trace
    : LogLevel.Debug;

export { log };
