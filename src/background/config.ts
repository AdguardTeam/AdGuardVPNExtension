import { log } from '../common/logger';

import { runtime } from './browserApi/runtime';

/**
 * Keys for forwarder urls queries.
 */
const enum ForwarderUrlQueryKey {
    AdguardDnsKb = 'ADGUARD_DNS_KB',
    AdguardDnsProvidersKb = 'ADGUARD_DNS_PROVIDERS_KB',
    ComparePage = 'COMPARE_PAGE',
    DeviceCount = 'DEVICE_COUNT',
    EditAccount = 'EDIT_ACCOUNT',
    Eula = 'EULA',
    Faq = 'FAQ',
    Feedback = 'FEEDBACK',
    FirefoxThankYouPage = 'FIREFOX_THANK_YOU_PAGE',
    OptionsStore = 'OPTIONS_STORE',
    OtherProducts = 'OTHER_PRODUCTS',
    PasswordCompromised = 'PASSWORD_COMPROMISED',
    PasswordRecovery = 'PASSWORD_RECOVERY',
    PopupDefaultSupport = 'POPUP_DEFAULT_SUPPORT',
    PopupFeedback = 'POPUP_FEEDBACK',
    PopupStore = 'POPUP_STORE',
    Privacy = 'PRIVACY',
    Subscribe = 'SUBSCRIBE',
    SuggestFeature = 'SUGGEST_FEATURE',
    ThankYouPage = 'THANK_YOU_PAGE',
    UninstallPage = 'UNINSTALL_PAGE',
    UpgradeLicense = 'UPGRADE_LICENSE',
    VpnBlockedGetApp = 'VPN_BLOCKED_GET_APP',
    Website = 'WEBSITE',
}

/**
 * Type for forwarder urls queries data object.
 */
type ForwarderUrlQueries = {
    [key in ForwarderUrlQueryKey]: string;
};

// global data
// @ts-ignore
const CONFIG = __APP_CONFIG__;

runtime.getPlatformOs().then((res) => {
    log.debug(`Current os: '${res}'`);
});

log.debug(`Current browser: "${CONFIG.BROWSER}"`);
log.debug(`Current build env: "${CONFIG.BUILD_ENV}"`);
log.debug(`Current stage env: "${CONFIG.STAGE_ENV}"`);

Object.keys(CONFIG).forEach((key) => {
    if (CONFIG[key] === undefined) {
        throw new Error(`Missed value for key '${key}' in config: ${CONFIG}`);
    }
});

const {
    VPN_API_URL,
    AUTH_API_URL,
    AUTH_CLIENT_ID,
    WS_API_URL_TEMPLATE,
    BROWSER,
    BUILD_ENV,
    STAGE_ENV,
    // keep them sorted
    ADGUARD_DNS_KB,
    ADGUARD_DNS_PROVIDERS_KB,
    COMPARE_PAGE,
    DEVICE_COUNT,
    EDIT_ACCOUNT,
    EULA,
    FAQ,
    FEEDBACK,
    FIREFOX_THANK_YOU_PAGE,
    OPTIONS_STORE,
    OTHER_PRODUCTS,
    PASSWORD_COMPROMISED,
    PASSWORD_RECOVERY,
    POPUP_DEFAULT_SUPPORT,
    POPUP_FEEDBACK,
    POPUP_STORE,
    PRIVACY,
    SUBSCRIBE,
    SUGGEST_FEATURE,
    THANK_YOU_PAGE,
    UNINSTALL_PAGE,
    UPGRADE_LICENSE,
    VPN_BLOCKED_GET_APP,
    WEBSITE,
} = CONFIG;

// not destructuring for adding a jsdoc comment
/**
 * **Should NOT be used directly**, use the Forwarder class. AG-32237.
 */
const FORWARDER_DOMAIN = CONFIG.FORWARDER_DOMAIN; // eslint-disable-line prefer-destructuring

/**
 * List of forwarder urls queries from the config.
 *
 * Needed for forwarder url generation. AG-32237.
 */
const FORWARDER_URL_QUERIES: ForwarderUrlQueries = {
    ADGUARD_DNS_KB,
    ADGUARD_DNS_PROVIDERS_KB,
    COMPARE_PAGE,
    DEVICE_COUNT,
    EDIT_ACCOUNT,
    EULA,
    FAQ,
    FEEDBACK,
    FIREFOX_THANK_YOU_PAGE,
    OPTIONS_STORE,
    OTHER_PRODUCTS,
    PASSWORD_COMPROMISED,
    PASSWORD_RECOVERY,
    POPUP_DEFAULT_SUPPORT,
    POPUP_FEEDBACK,
    POPUP_STORE,
    PRIVACY,
    SUBSCRIBE,
    SUGGEST_FEATURE,
    THANK_YOU_PAGE,
    UNINSTALL_PAGE,
    UPGRADE_LICENSE,
    VPN_BLOCKED_GET_APP,
    WEBSITE,
};

export {
    VPN_API_URL,
    AUTH_API_URL,
    AUTH_CLIENT_ID,
    WS_API_URL_TEMPLATE,
    BROWSER,
    BUILD_ENV,
    STAGE_ENV,
    FORWARDER_DOMAIN,
    FORWARDER_URL_QUERIES,
};
