// TODO for release change level to less verbose
import { logStorage } from './log-storage';

const CURRENT_LEVEL = 'DEBUG';

type LevelsType = {
    [key: string]: number;
};

const LEVELS: LevelsType = {
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
};

export const getLocalTimeString = (date: Date) => {
    const ONE_MINUTE_MS = 60 * 1000;
    const timeZoneOffsetMs = date.getTimezoneOffset() * ONE_MINUTE_MS;
    const localTime = new Date(date.getTime() - timeZoneOffsetMs);

    const REDUNDANT_SYMBOL = 'Z';
    return localTime.toISOString().replace(REDUNDANT_SYMBOL, '');
};

interface ConsoleInterface extends Console {
    [key: string]: any;
}

const print = (level: string, method: string, args: any[]) => {
    // check log level
    if (LEVELS[CURRENT_LEVEL] < LEVELS[level]) {
        return;
    }

    if (!args || args.length === 0 || !args[0]) {
        return;
    }

    const formatted = getLocalTimeString(new Date());
    logStorage.addLog(formatted, ...args);

    const browserConsole: ConsoleInterface = console;
    browserConsole[method](formatted, ...args);
};

export const log = {
    debug(...args: any) {
        print('DEBUG', 'log', args);
    },

    info(...args: any) {
        print('INFO', 'info', args);
    },

    warn(...args: any) {
        print('WARN', 'warn', args);
    },

    error(...args: any) {
        print('ERROR', 'error', args);
    },
};
