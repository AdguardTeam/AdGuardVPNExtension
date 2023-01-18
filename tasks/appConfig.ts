import { Browsers, Envs } from './consts';

type UrlMap = {
    [key: string]: {
        [key: string]: string,
    },
};

type UrlsMap = {
    [key: string]: UrlMap,
};

const { FORWARDER_DOMAIN } = process.env;

const URLS_MAP_RELEASE: UrlMap = {
    [Browsers.Chrome]: {
        POPUP_STORE_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=chrome_store&from=popup&app=vpn_extension`,
        POPUP_FEEDBACK_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=feedback_chrome&from=popup&app=vpn_extension`,
        OPTIONS_STORE_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=chrome_store&from=options_screen&app=vpn_extension`,
        FEEDBACK_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=feedback_chrome&from=options_screen&app=vpn_extension`,
    },
    [Browsers.Firefox]: {
        POPUP_STORE_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=firefox_store&from=popup&app=vpn_extension`,
        POPUP_FEEDBACK_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=feedback_firefox&from=popup&app=vpn_extension`,
        OPTIONS_STORE_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=firefox_store&from=options_screen&app=vpn_extension`,
        FEEDBACK_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=feedback_firefox&from=options_screen&app=vpn_extension`,
    },
    [Browsers.Edge]: {
        POPUP_STORE_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=edge_store&from=popup&app=vpn_extension`,
        POPUP_FEEDBACK_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=feedback_edge&from=popup&app=vpn_extension`,
        OPTIONS_STORE_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=edge_store&from=options_screen&app=vpn_extension`,
        FEEDBACK_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=feedback_edge&from=options_screen&app=vpn_extension`,
    },
    [Browsers.Opera]: {
        POPUP_STORE_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=opera_store&from=popup&app=vpn_extension`,
        POPUP_FEEDBACK_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=feedback_opera&from=popup&app=vpn_extension`,
        OPTIONS_STORE_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=opera_store&from=options_screen&app=vpn_extension`,
        FEEDBACK_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=feedback_opera&from=options_screen&app=vpn_extension`,
    },
};

const URLS_MAP_BETA = {
    [Browsers.Chrome]: {
        POPUP_STORE_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=chrome_store_beta&from=popup&app=vpn_extension`,
        OPTIONS_STORE_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=chrome_store_beta&from=options_screen&app=vpn_extension`,
        POPUP_FEEDBACK_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=feedback_chrome&from=popup&app=vpn_extension`,
        FEEDBACK_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=feedback_chrome&from=options_screen&app=vpn_extension`,
    },
};

const URLS_MAP: UrlsMap = {
    [Envs.Release]: URLS_MAP_RELEASE,
    [Envs.Beta]: { ...URLS_MAP_RELEASE, ...URLS_MAP_BETA },
};

// VPN section API description - projects/ADGUARD/repos/adguard-vpn-backend-service/browse
// Auth section API description - projects/ADGUARD/repos/adguard-auth-service/browse
const STAGE_CONF = {
    VPN_API_URL: process.env.VPN_API_URL,
    AUTH_API_URL: process.env.AUTH_API_URL,
    WHOAMI_URL: process.env.WHOAMI_URL,
};

const COMMON = {
    FORWARDER_DOMAIN,
    // Websocket
    WS_API_URL_TEMPLATE: 'wss://{{host}}:443/user?hash={{hash}}',
    // Privacy and EULA
    PRIVACY_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=privacy&from=popup&app=vpn_extension`,
    EULA_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=eula&from=popup&app=vpn_extension`,
    // Upgrade license
    UPGRADE_LICENSE_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=buy_license&from=popup&app=vpn_extension`,
    // Commercial
    OTHER_PRODUCTS_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=other_products&from=popup&app=vpn_extension`,
    // Support
    POPUP_DEFAULT_SUPPORT_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=support&from=popup&app=vpn_extension`,
    // Options page
    WEBSITE_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=adguard_site&from=options_screen&app=vpn_extension`,
    FAQ_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=faq&from=options_screen&app=vpn_extension`,
    SUGGEST_FEATURE: `https://${FORWARDER_DOMAIN}/forward.html?action=suggest_feature&from=options_screen&app=vpn_extension`,
    THANK_YOU_PAGE_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=thank_you&from=background_page&app=vpn_extension`,
    PASSWORD_RECOVERY_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=recovery_password&from=popup&app=vpn_extension`,
    EDIT_ACCOUNT_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=account_settings&from=options_screen&app=vpn_extension`,
    // API
    AUTH_ACCESS_TOKEN_KEY: 'auth.access.token',
    AUTH_CLIENT_ID: 'adguard-vpn-extension',
    // Uninstall page
    UNINSTALL_PAGE_URL: `https://${FORWARDER_DOMAIN}/forward.html?action=adguard_uninstal_ext&from=background_page&app=vpn_extension`,
    // AdGuard DNS Knowledge Base
    ADGUARD_DNS_KB_LINK: `https://${FORWARDER_DOMAIN}/forward.html?action=adguard_dns_kb&from=options_screen&app=vpn_extension`,
};

export const genAppConfig = (browser: string, stageEnv?: string, buildingEnv?: string) => {
    if (!buildingEnv) {
        throw new Error('No building environment was provided');
    }
    const urlsMapByBrowser = URLS_MAP[buildingEnv] || URLS_MAP[Envs.Release];
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
