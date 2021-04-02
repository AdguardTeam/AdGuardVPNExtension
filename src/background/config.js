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
    ACCOUNT_API_URL,
    VPN_API_URL,
    AUTH_API_URL,
    PASSWORD_RECOVERY_URL,
    EDIT_ACCOUNT_URL,
    AUTH_BASE_URL,
    AUTH_REDIRECT_URI,
    AUTH_ACCESS_TOKEN_KEY,
    AUTH_CLIENT_ID,
    POPUP_STORE_URL,
    POPUP_FEEDBACK_URL,
    OPTIONS_STORE_URL,
    WS_API_URL_TEMPLATE,
    PRIVACY_URL,
    EULA_URL,
    OTHER_PRODUCTS_URL,
    POPUP_DEFAULT_SUPPORT_URL,
    WEBSITE_URL,
    SUGGEST_FEATURE,
    THANK_YOU_PAGE_URL,
    FEEDBACK_URL,
    FAQ_URL,
    DISCUSS_URL,
    BROWSER,
    BUILD_ENV,
    STAGE_ENV,
} = CONFIG;
