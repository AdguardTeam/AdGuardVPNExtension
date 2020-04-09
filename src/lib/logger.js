// TODO for release change level to less verbose
const CURRENT_LEVEL = 'DEBUG';

const LEVELS = {
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
};

const getLocalTimeString = (date) => {
    const ONE_MINUTE_MS = 60 * 1000;
    const timeZoneOffsetMs = date.getTimezoneOffset() * ONE_MINUTE_MS;
    const localTime = new Date(date - timeZoneOffsetMs);
    return localTime.toISOString().replace('Z', '');
};

const print = (level, method, args) => {
    // check log level
    if (LEVELS[CURRENT_LEVEL] < LEVELS[level]) {
        return;
    }
    if (!args || args.length === 0 || !args[0]) {
        return;
    }

    const formatted = getLocalTimeString(new Date());
    // eslint-disable-next-line no-console
    console[method](formatted, ...args);
};

const log = {
    debug(...args) {
        print('DEBUG', 'log', args);
    },

    info(...args) {
        print('INFO', 'info', args);
    },

    warn(...args) {
        print('WARN', 'warn', args);
    },

    error(...args) {
        print('ERROR', 'error', args);
    },
};

export default log;
