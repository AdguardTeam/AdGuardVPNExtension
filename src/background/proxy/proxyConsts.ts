export const LEVELS_OF_CONTROL = {
    NOT_CONTROLLABLE: 'not_controllable',
    CONTROLLED_BY_OTHER_EXTENSION: 'controlled_by_other_extensions',
};

export const DEFAULT_EXCLUSIONS = [
    // non routable
    'localhost',
    '*.local',
    '127.0.0.1',
];

/**
 * This constant is used to send random request, which should be intercepted by proxy endpoint
 * and return empty response with status 200.
 * There is a known bug in Chrome: https://bugs.chromium.org/p/chromium/issues/detail?id=1009243
 * when onAuthRequired is not triggered when request is sent from service worker.
 * When this bug is fixed, this constant can be removed.
 */
export const PAC_SCRIPT_CHECK_URL = 'check-pac.adguard-vpn.online';

export const PROXY_AUTH_CREDENTIALS_KEY = 'proxy.auth.credentials.key';
