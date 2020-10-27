export const CONNECTION_TYPE_FIREFOX = {
    DIRECT: 'direct',
};

export const LEVELS_OF_CONTROL = {
    NOT_CONTROLLABLE: 'not_controllable',
    CONTROLLED_BY_OTHER_EXTENSION: 'controlled_by_other_extensions',
};

export const DEFAULT_EXCLUSIONS = [
    // used in the api
    '*api.adguard.io',
    '*account.adguard.com',

    // non routable
    'localhost',
    '*.local',
    '127.0.0.1',
];
