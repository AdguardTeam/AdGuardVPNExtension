const { BUILD_ENV, GECKO_ID_ENV_MAP, FIREFOX_UPDATE_URL } = require('../consts');

export const firefoxManifestDiff = {
    manifest_version: 3,
    action: {
        default_icon: {
            19: 'assets/images/icons/disabled-19.png',
            38: 'assets/images/icons/disabled-38.png',
        },
        default_title: '__MSG_name__',
        default_popup: 'popup.html',
    },
    content_security_policy: {
        extension_pages: "script-src 'self'; object-src 'self'",
    },
    browser_specific_settings: {
        gecko: {
            id: GECKO_ID_ENV_MAP[BUILD_ENV],
            strict_min_version: '91.1.0',
        },
    },
    background: {
        page: 'background.html',
    },
    options_ui: {
        page: 'options.html',
        open_in_tab: true,
    },
    permissions: [
        'tabs',
        'alarms',
    ],
    host_permissions: [
        '<all_urls>',
    ],
    protocol_handlers: [
        {
            protocol: 'ext+adguardvpn',
            name: 'AdGuard VPN Extension',
            uriTemplate: '/custom-protocol-handler.html#matched=%s',
        },
    ],
};

export const firefoxManifestStandaloneDiff = {
    browser_specific_settings: {
        gecko: {
            update_url: FIREFOX_UPDATE_URL,
        },
    },
};
