/* global __APP_CONFIG__ */
import { log } from '../lib/logger';

const CONFIG = __APP_CONFIG__;

log.debug(`Current browser: "${CONFIG.BROWSER}"`);
log.debug(`Current build env: "${CONFIG.BUILD_ENV}"`);
log.debug(`Current stage env: "${CONFIG.STAGE_ENV}"`);

Object.keys(CONFIG).forEach((key) => {
    if (CONFIG[key] === undefined) {
        throw new Error(`All values in config should be defined, ${CONFIG}`);
    }
});

export const {
    VPN_API_URL,
    AUTH_API_URL,
    PASSWORD_RECOVERY_URL,
    EDIT_ACCOUNT_URL,
    AUTH_ACCESS_TOKEN_KEY,
    AUTH_CLIENT_ID,
    POPUP_STORE_URL,
    POPUP_FEEDBACK_URL,
    OPTIONS_STORE_URL,
    WS_API_URL_TEMPLATE,
    PRIVACY_URL,
    EULA_URL,
    UPGRADE_LICENSE_URL,
    OTHER_PRODUCTS_URL,
    POPUP_DEFAULT_SUPPORT_URL,
    WEBSITE_URL,
    ADGUARD_DNS_KB_LINK,
    FORWARDER_DOMAIN,
    SUGGEST_FEATURE,
    THANK_YOU_PAGE_URL,
    UNINSTALL_PAGE_URL,
    FEEDBACK_URL,
    FAQ_URL,
    BROWSER,
    BUILD_ENV,
    STAGE_ENV,
} = CONFIG;
