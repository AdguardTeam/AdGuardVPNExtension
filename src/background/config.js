/* global PRODUCTION */
import log from '../lib/logger';

const ENVS = {
    PROD: 'prod',
    TEST: 'test',
};

// Value of PRODUCTION variable is set by Webpack. For beta and prod we set it true,
// otherwise we set it false
const currentEnv = PRODUCTION ? ENVS.PROD : ENVS.TEST;
log.debug(`Current staging: ${currentEnv}`);

// Account section
// API description - projects/ADGUARD/repos/adguard-account-service/browse
const ACCOUNT_API_URLS_MAP = {
    [ENVS.TEST]: 'https://testaccount.adguard.com/',
    [ENVS.PROD]: 'https://account.adguard.com/',
};

export const ACCOUNT_API_URL = `${ACCOUNT_API_URLS_MAP[currentEnv]}api/1.0/`;

// VPN section
// API description - projects/ADGUARD/repos/adguard-vpn-backend-service/browse
const VPN_API_URLS_MAP = {
    [ENVS.TEST]: 'http://testapi.adguard.io/', // http - IMPORTANT!
    [ENVS.PROD]: 'https://api.adguard.io/',
};

export const VPN_API_URL = `${VPN_API_URLS_MAP[currentEnv]}api/v1/`;

// Auth section
// API description - projects/ADGUARD/repos/adguard-auth-service/browse
const AUTH_API_URLS_MAP = {
    [ENVS.TEST]: 'https://testauth.adguard.com/',
    [ENVS.PROD]: 'https://auth.adguard.com/',
};

export const AUTH_API_URL = AUTH_API_URLS_MAP[currentEnv];
export const AUTH_BASE_URL = `${AUTH_API_URL}oauth/authorize`;
export const AUTH_REDIRECT_URI = `${AUTH_API_URL}oauth.html`;
export const AUTH_ACCESS_TOKEN_KEY = 'auth.access.token';
export const AUTH_CLIENT_ID = 'adguard-vpn-extension';

const PASSWORD_RECOVERY_MAP = {
    [ENVS.TEST]: `${AUTH_API_URL}account/recovery_password.html`,
    [ENVS.PROD]: 'https://adguard-vpn.com/forward.html?action=recovery_password&from=popup&app=vpn_extension',
};

export const PASSWORD_RECOVERY_URL = PASSWORD_RECOVERY_MAP[currentEnv];

const EDIT_ACCOUNT_URL_MAP = {
    [ENVS.TEST]: `${AUTH_API_URL}login.html`,
    [ENVS.PROD]: 'https://adguard-vpn.com/forward.html?action=account_settings&from=options_screen&app=vpn_extension',
};
export const EDIT_ACCOUNT_URL = EDIT_ACCOUNT_URL_MAP[currentEnv];


// Websocket
export const WS_API_URL_TEMPLATE = 'wss://{{host}}:8443/user_metrics';

// Privacy and EULA
export const PRIVACY_URL = 'https://adguard-vpn.com/forward.html?action=privacy&from=popup&app=vpn_extension';
export const EULA_URL = 'https://adguard-vpn.com/forward.html?action=eula&from=popup&app=vpn_extension';

// Commercial
export const BUY_LICENSE_URL = 'https://adguard-vpn.com/forward.html?action=buy_license&from=popup&app=vpn_extension';
export const OTHER_PRODUCTS_URL = 'https://adguard-vpn.com/forward.html?action=other_products&from=popup&app=vpn_extension';
export const POPUP_STORE_URL = 'https://adguard-vpn.com/forward.html?action=store&from=popup&app=vpn_extension';

// Support
export const POPUP_FEEDBACK_URL = 'https://adguard-vpn.com/forward.html?action=feedback&from=popup&app=vpn_extension';
export const POPUP_DEFAULT_SUPPORT_URL = 'https://adguard-vpn.com/forward.html?action=support&from=popup&app=vpn_extension';

// Options page
export const WEBSITE_URL = 'https://adguard-vpn.com/forward.html?action=adguard_site&from=options_screen&app=vpn_extension';
export const STORE_URL = 'https://adguard-vpn.com/forward.html?action=store&from=options_screen&app=vpn_extension';
export const FEEDBACK_URL = 'https://adguard-vpn.com/forward.html?action=feedback&from=options_screen&app=vpn_extension';
export const SUGGEST_FEATURE = 'https://adguard-vpn.com/forward.html?action=suggest_feature&from=options_screen&app=vpn_extension';
