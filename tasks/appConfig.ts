import { Browser, Env, StageEnv } from './consts';

const {
    FORWARDER_DOMAIN,
    VPN_API_URL,
    AUTH_API_URL,
} = process.env;

type BrowsersUrlQueriesMap = {
    [key: string]: {
        [key: string]: string,
    },
};

type UrlQueriesMap = {
    [key: string]: BrowsersUrlQueriesMap,
};

/**
 * Browser-specific forwarder urls queries for the **release** environment.
 */
const URL_QUERIES_MAP_RELEASE: BrowsersUrlQueriesMap = {
    [Browser.Chrome]: {
        POPUP_STORE: 'action=chrome_store&from=popup&app=vpn_extension',
        POPUP_FEEDBACK: 'action=feedback_chrome&from=popup&app=vpn_extension',
        OPTIONS_STORE: 'action=chrome_store&from=options_screen&app=vpn_extension',
        FEEDBACK: 'action=feedback_chrome&from=options_screen&app=vpn_extension',
    },
    [Browser.Firefox]: {
        POPUP_STORE: 'action=firefox_store&from=popup&app=vpn_extension',
        POPUP_FEEDBACK: 'action=feedback_firefox&from=popup&app=vpn_extension',
        OPTIONS_STORE: 'action=firefox_store&from=options_screen&app=vpn_extension',
        FEEDBACK: 'action=feedback_firefox&from=options_screen&app=vpn_extension',
    },
    [Browser.Edge]: {
        POPUP_STORE: 'action=edge_store&from=popup&app=vpn_extension',
        POPUP_FEEDBACK: 'action=feedback_edge&from=popup&app=vpn_extension',
        OPTIONS_STORE: 'action=edge_store&from=options_screen&app=vpn_extension',
        FEEDBACK: 'action=feedback_edge&from=options_screen&app=vpn_extension',
    },
    [Browser.Opera]: {
        POPUP_STORE: 'action=opera_store&from=popup&app=vpn_extension',
        POPUP_FEEDBACK: 'action=feedback_opera&from=popup&app=vpn_extension',
        OPTIONS_STORE: 'action=opera_store&from=options_screen&app=vpn_extension',
        FEEDBACK: 'action=feedback_opera&from=options_screen&app=vpn_extension',
    },
};

/**
 * Browser-specific forwarder urls queries for the **beta** environment.
 */
const URL_QUERIES_MAP_BETA: BrowsersUrlQueriesMap = {
    [Browser.Chrome]: {
        POPUP_STORE: 'action=chrome_store_beta&from=popup&app=vpn_extension',
        OPTIONS_STORE: 'action=chrome_store_beta&from=options_screen&app=vpn_extension',
        POPUP_FEEDBACK: 'action=feedback_chrome&from=popup&app=vpn_extension',
        FEEDBACK: 'action=feedback_chrome&from=options_screen&app=vpn_extension',
    },
};

const URL_QUERIES_MAP: UrlQueriesMap = {
    [Env.Release]: URL_QUERIES_MAP_RELEASE,
    [Env.Beta]: { ...URL_QUERIES_MAP_RELEASE, ...URL_QUERIES_MAP_BETA },
};

// VPN section API description - projects/ADGUARD/repos/adguard-vpn-backend-service/browse
// Auth section API description - projects/ADGUARD/repos/adguard-auth-service/browse
const STAGE_CONF: Record<string, string | undefined> = {
    VPN_API_URL,
    AUTH_API_URL,
};

const COMMON_CONF = {
    // default forwarder domain
    FORWARDER_DOMAIN,
    // Websocket
    WS_API_URL_TEMPLATE: 'wss://{{host}}:443/user?hash={{hash}}',
    // API
    AUTH_CLIENT_ID: 'adguard-vpn-extension',
    // Privacy URL for Firefox
    AMO_PRIVACY_URL: 'https://addons.mozilla.org/en-US/firefox/addon/adguard-vpn/privacy/',
    // EULA URL for Firefox
    AMO_EULA_URL: 'https://addons.mozilla.org/en-US/firefox/addon/adguard-vpn/eula/',
};

/**
 * List of forwarder urls queries which are common for all browsers.
 */
const COMMON_URL_QUERIES = {
    // Privacy and EULA
    PRIVACY: 'action=privacy&from=popup&app=vpn_extension',
    EULA: 'action=eula&from=popup&app=vpn_extension',
    // Upgrade license
    UPGRADE_LICENSE: 'action=buy_license&from=popup&app=vpn_extension',
    // Get subscription
    SUBSCRIBE: 'action=subscribe&from=popup_connections_limit&app=vpn_extension',
    // Limited Offer
    LIMITED_OFFER: 'action=limited_offer&from=popup&app=vpn_extension',
    LIMITED_OFFER_RU: 'action=limited_offer_ru&from=popup&app=vpn_extension',
    // Devices count details
    DEVICE_COUNT: 'action=devices_count&from=popup_connections_limit&app=vpn_extension',
    // Commercial
    OTHER_PRODUCTS: 'action=other_products&from=popup&app=vpn_extension',
    // Support
    POPUP_DEFAULT_SUPPORT: 'action=support&from=popup&app=vpn_extension',
    // Options page
    WEBSITE: 'action=adguard_site&from=options_screen&app=vpn_extension',
    FAQ: 'action=faq&from=options_screen&app=vpn_extension',
    SUGGEST_FEATURE: 'action=suggest_feature&from=options_screen&app=vpn_extension',
    THANK_YOU_PAGE: 'action=thank_you_v2&from=background_page&app=vpn_extension',
    FIREFOX_THANK_YOU_PAGE: 'action=thank_you_v2_firefox&from=background_page&app=vpn_extension',
    PASSWORD_RECOVERY: 'action=recovery_password&from=popup&app=vpn_extension',
    PASSWORD_COMPROMISED: 'action=haveibeenpwned&from=popup&app=vpn_extension',
    EDIT_ACCOUNT: 'action=account_settings&from=options_screen&app=vpn_extension',
    // Uninstall page
    UNINSTALL_PAGE: 'action=adguard_uninstal_ext&from=background_page&app=vpn_extension',
    // AdGuard DNS Knowledge Base
    ADGUARD_DNS_KB: 'action=adguard_dns_kb&from=options_screen&app=vpn_extension',
    // AdGuard DNS Providers Knowledge Base
    ADGUARD_DNS_PROVIDERS_KB: 'action=adguard_dns_providers_kb&from=options_screen&app=vpn_extension',
    COMPARE_PAGE: 'action=compare&from=popup&app=vpn_extension',
    // AG-25941
    VPN_BLOCKED_GET_APP: 'action=vpn_blocked_get_app&from=popup&app=vpn_extension',
};

/**
 * Stage environment to Telemetry API URLs mapping.
 *
 * Telemetry section API description - projects/ADGUARD/repos/adguard-telemetry-service/browse
 */
const TELEMETRY_API_URLS = {
    [StageEnv.Prod]: 'api.agrdvpn-tm.com',
    [StageEnv.Test]: 'telemetry.service.agrd.dev',
};

/**
 * Generates app config based on the provided browser, stage environment and building environment.
 *
 * @param browser Browser name.
 * @param stageEnv Stage environment.
 * @param buildingEnv Building environment.
 *
 * @returns App config.
 */
export const genAppConfig = (browser: string, stageEnv?: string, buildingEnv?: string) => {
    if (!buildingEnv) {
        throw new Error('No building environment was provided');
    }

    if (!stageEnv) {
        throw new Error('No stage environment was provided');
    }

    if (!TELEMETRY_API_URLS[stageEnv as StageEnv]) {
        throw new Error(`No telemetry API URL for stage environment: "${stageEnv}"`);
    }

    STAGE_CONF.TELEMETRY_API_URL = TELEMETRY_API_URLS[stageEnv as StageEnv];

    const urlQueriesMapByBrowser = URL_QUERIES_MAP[buildingEnv] || URL_QUERIES_MAP[Env.Release];
    const browserUrlQueries = urlQueriesMapByBrowser[browser];

    if (!browserUrlQueries) {
        throw new Error(`No browser config for browser: "${browser}"`);
    }

    return {
        BROWSER: browser,
        BUILD_ENV: buildingEnv,
        STAGE_ENV: stageEnv,
        ...COMMON_URL_QUERIES,
        ...browserUrlQueries,
        ...STAGE_CONF,
        ...COMMON_CONF,
    };
};
