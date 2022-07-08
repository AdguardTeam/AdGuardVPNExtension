const { BROWSERS, ENVS } = require('./consts');

const { WEBSITE_DOMAIN } = process.env;

const URLS_MAP_RELEASE = {
    [BROWSERS.CHROME]: {
        POPUP_STORE_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=chrome_store&from=popup&app=vpn_extension`,
        POPUP_FEEDBACK_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=feedback_chrome&from=popup&app=vpn_extension`,
        OPTIONS_STORE_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=chrome_store&from=options_screen&app=vpn_extension`,
        FEEDBACK_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=feedback_chrome&from=options_screen&app=vpn_extension`,
    },
    [BROWSERS.FIREFOX]: {
        POPUP_STORE_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=firefox_store&from=popup&app=vpn_extension`,
        POPUP_FEEDBACK_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=feedback_firefox&from=popup&app=vpn_extension`,
        OPTIONS_STORE_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=firefox_store&from=options_screen&app=vpn_extension`,
        FEEDBACK_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=feedback_firefox&from=options_screen&app=vpn_extension`,
    },
    [BROWSERS.EDGE]: {
        POPUP_STORE_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=edge_store&from=popup&app=vpn_extension`,
        POPUP_FEEDBACK_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=feedback_edge&from=popup&app=vpn_extension`,
        OPTIONS_STORE_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=edge_store&from=options_screen&app=vpn_extension`,
        FEEDBACK_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=feedback_edge&from=options_screen&app=vpn_extension`,
    },
    [BROWSERS.OPERA]: {
        POPUP_STORE_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=opera_store&from=popup&app=vpn_extension`,
        POPUP_FEEDBACK_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=feedback_opera&from=popup&app=vpn_extension`,
        OPTIONS_STORE_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=opera_store&from=options_screen&app=vpn_extension`,
        FEEDBACK_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=feedback_opera&from=options_screen&app=vpn_extension`,
    },
};

const URLS_MAP_BETA = {
    [BROWSERS.CHROME]: {
        POPUP_STORE_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=chrome_store_beta&from=popup&app=vpn_extension`,
        OPTIONS_STORE_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=chrome_store_beta&from=options_screen&app=vpn_extension`,
        POPUP_FEEDBACK_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=feedback_chrome&from=popup&app=vpn_extension`,
        FEEDBACK_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=feedback_chrome&from=options_screen&app=vpn_extension`,
    },
};

const URLS_MAP = {
    [ENVS.RELEASE]: URLS_MAP_RELEASE,
    [ENVS.BETA]: { ...URLS_MAP_RELEASE, ...URLS_MAP_BETA },
};

// VPN section API description - projects/ADGUARD/repos/adguard-vpn-backend-service/browse
// Auth section API description - projects/ADGUARD/repos/adguard-auth-service/browse
const STAGE_CONF = {
    VPN_API_URL: process.env.VPN_API_URL,
    AUTH_API_URL: process.env.AUTH_API_URL,
};

const COMMON = {
    WEBSITE_DOMAIN,
    // Websocket
    WS_API_URL_TEMPLATE: 'wss://{{host}}:443/user?hash={{hash}}',
    // Privacy and EULA
    PRIVACY_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=privacy&from=popup&app=vpn_extension`,
    EULA_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=eula&from=popup&app=vpn_extension`,
    // Upgrade license
    UPGRADE_LICENSE_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=buy_license&from=popup&app=vpn_extension`,
    // Commercial
    OTHER_PRODUCTS_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=other_products&from=popup&app=vpn_extension`,
    // Support
    POPUP_DEFAULT_SUPPORT_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=support&from=popup&app=vpn_extension`,
    // Options page
    WEBSITE_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=adguard_site&from=options_screen&app=vpn_extension`,
    FAQ_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=faq&from=options_screen&app=vpn_extension`,
    SUGGEST_FEATURE: `https://${WEBSITE_DOMAIN}/forward.html?action=suggest_feature&from=options_screen&app=vpn_extension`,
    THANK_YOU_PAGE_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=thank_you_v2&from=background_page&app=vpn_extension`,
    PASSWORD_RECOVERY_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=recovery_password&from=popup&app=vpn_extension`,
    EDIT_ACCOUNT_URL: `https://${WEBSITE_DOMAIN}/forward.html?action=account_settings&from=options_screen&app=vpn_extension`,
    // API
    AUTH_ACCESS_TOKEN_KEY: 'auth.access.token',
    AUTH_CLIENT_ID: 'adguard-vpn-extension',
};

const genAppConfig = (browser, stageEnv, buildingEnv) => {
    const urlsMapByBrowser = URLS_MAP[buildingEnv] || URLS_MAP[ENVS.RELEASE];
    const browserConf = urlsMapByBrowser[browser];

    if (!browserConf) {
        throw new Error(`No browser config for browser: "${browser}"`);
    }

    return {
        BROWSER: browser,
        BUILD_ENV: buildingEnv,
        STAGE_ENV: stageEnv,
        ...browserConf,
        ...STAGE_CONF,
        ...COMMON,
    };
};

module.exports = {
    genAppConfig,
};
