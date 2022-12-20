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

const getLocalTimeString = (date: Date) => {
    const ONE_MINUTE_MS = 60 * 1000;
    const timeZoneOffsetMs = date.getTimezoneOffset() * ONE_MINUTE_MS;
    // FIXME: add tests
    // @ts-ignore
    const localTime = new Date(date - timeZoneOffsetMs);

    const REDUNDANT_SYMBOL = 'Z';
    return localTime.toISOString().replace(REDUNDANT_SYMBOL, '');
};

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
    // @ts-ignore
    console[method](formatted, ...args); // eslint-disable-line no-console
};

const log = {
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

export { log };
