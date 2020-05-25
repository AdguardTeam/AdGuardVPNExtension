export const CONNECTION_TYPE_FIREFOX = {
    DIRECT: 'direct',
};

export const LEVELS_OF_CONTROL = {
    NOT_CONTROLLABLE: 'not_controllable',
    CONTROLLED_BY_OTHER_EXTENSION: 'controlled_by_other_extensions',
};

export const DEFAULT_EXCLUSIONS = [
    'adguard.com/*/license.html*',
    'adguard.com/*/upgrade.html*',
    'adguard.com/*/renew.html*',
    'adguard.com/pg/*',
    'adguard-vpn.com/*/license.html*',
    'adguard-vpn.com/pg/*',
    '*.adguard.io',
    '*.adguard.ws',
    'account.adguard.com',
    'auth.adguard.com',
    'localhost',
    '*.local',
    '127.0.0.1',
];
