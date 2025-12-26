/* eslint-disable no-console */
import { Logger, LogLevel } from '@adguard/logger';

import { browserApi } from '../background/browserApi';

import { logStorage } from './log-storage';

// Extracting `Writer` interface from `Logger`
type Writer = ConstructorParameters<typeof Logger>[0];

// @ts-ignore - Importing from 'background/config' throws error
const IS_DEV = __APP_CONFIG__.BUILD_ENV === 'dev';

// @ts-ignore - Importing from 'background/config' throws error
const IS_RELEASE = __APP_CONFIG__.BUILD_ENV === 'release';

// @ts-ignore - Importing from 'background/config' throws error
const IS_BETA = __APP_CONFIG__.BUILD_ENV === 'beta';

const writer: Writer = {
    error: (...args: any) => {
        logStorage.addLog(...args);
        console.error(...args);
    },
    warn: (...args: any) => {
        logStorage.addLog(...args);
        console.warn(...args);
    },
    info: (...args: any) => {
        logStorage.addLog(...args);
        console.info(...args);
    },
    debug: (...args: any) => {
        logStorage.addLog(...args);
        console.debug(...args);
    },
    trace: (...args: any) => {
        logStorage.addLog(...args);
        console.trace(...args);
    },
};

// If build environment is 'dev' we add optional group methods.
if (IS_DEV) {
    writer.groupCollapsed = console.groupCollapsed;
    writer.groupEnd = console.groupEnd;
}

/**
 * Extended logger with persistent log level setting.
 * Extends the base Logger class with browser storage integration
 * for saving and retrieving log level preferences.
 */
class ExtendedLogger extends Logger {
    /**
     * Key for storing the current log level in browser storage.
     */
    private static readonly LOG_LEVEL_LOCAL_STORAGE_KEY = 'log-level';

    /**
     * Default log level based on the build configuration.
     */
    private static readonly DEFAULT_LOG_LEVEL = IS_RELEASE || IS_BETA
        ? LogLevel.Info
        : LogLevel.Debug;

    /**
     * Checks if the current log level is verbose (Debug or Verbose).
     *
     * This method is useful for determining if detailed logging should
     * be enabled across the application in different modules. Some kind of
     * "single point of truth".
     *
     * @returns True if current log level is Debug or Verbose, false otherwise.
     */
    isVerbose(): boolean {
        return this.currentLevel === LogLevel.Debug
             || this.currentLevel === LogLevel.Verbose;
    }

    /**
     * Sets log with persistent value, which will be saved, if
     * browser.storage.local is available.
     *
     * @param level Log level to set.
     */
    setLogLevel(level: LogLevel): void {
        this.currentLevel = level;

        browserApi.storage.set(ExtendedLogger.LOG_LEVEL_LOCAL_STORAGE_KEY, level)
            .catch((error) => {
                this.error('[vpn.ExtendedLogger.setLogLevel]: failed to save log level in browser.storage.local', error);
            });
    }

    /**
     * Validates if the provided value is a valid LogLevel.
     *
     * @param value Value to validate.
     *
     * @returns True if the value is a valid LogLevel, false otherwise.
     */
    private static isValidLogLevel(value: unknown): value is LogLevel {
        return typeof value === 'string' && Object.values(LogLevel).includes(value as LogLevel);
    }

    /**
     * Initializes the logger by loading the saved log level from browser storage.
     * Falls back to the default log level if retrieval fails or the stored level is invalid.
     *
     * @returns Promise that resolves when initialization is complete.
     */
    public async init(): Promise<void> {
        try {
            const logLevel = await browserApi.storage.get(ExtendedLogger.LOG_LEVEL_LOCAL_STORAGE_KEY);

            if (!ExtendedLogger.isValidLogLevel(logLevel)) {
                this.warn('[vpn.ExtendedLogger.init]: log level from browser.storage.local is not valid', logLevel);
                return;
            }

            try {
                this.setLogLevel(logLevel);
            } catch (e) {
                this.warn('[vpn.ExtendedLogger.init]: failed to set log level from browser.storage.local, will set to default level', e);
                this.setLogLevel(ExtendedLogger.DEFAULT_LOG_LEVEL);
            }
        } catch (error) {
            this.warn('[vpn.ExtendedLogger.init]: failed to get log level from browser.storage.local', error);
        }
    }

    /**
     * Creates a new instance of ExtendedLogger.
     * Initializes the logger with the default log level based on build configuration.
     */
    constructor() {
        super(writer);

        this.currentLevel = ExtendedLogger.DEFAULT_LOG_LEVEL;
    }
}

const log = new ExtendedLogger();

// Expose logger to the window object,
// to have possibility to switch log level from the console.
// Example: adguard.logger.setLogLevel('error');
// Available levels: 'error', 'warn', 'info', 'debug', 'verbose'

// eslint-disable-next-line no-restricted-globals
Object.assign(self, { adguard: { ...self.adguard, logger: log } });

export { log, LogLevel };
