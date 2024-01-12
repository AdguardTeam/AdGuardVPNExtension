const { BUILD_ENV, GECKO_ID_ENV_MAP } = require('../consts');

export const firefoxManifestDiff = {
    manifest_version: 2,
    minimum_chrome_version: '66.0',
    browser_action: {
        default_icon: {
            19: 'assets/images/icons/disabled-19.png',
            38: 'assets/images/icons/disabled-38.png',
        },
        default_title: '__MSG_name__',
        default_popup: 'popup.html',
    },
    browser_specific_settings: {
        gecko: {
            id: GECKO_ID_ENV_MAP[BUILD_ENV],
            strict_min_version: '91.1.0',
        },
    },
    background: {
        page: 'background.html',
        persistent: true,
    },
    options_ui: {
        page: 'options.html',
        open_in_tab: true,
    },
    permissions: [
        '<all_urls>',
        'tabs',
        'webRequestBlocking',
    ],
    protocol_handlers: [
        {
            protocol: 'ext+adguardvpn',
            name: 'AdGuard VPN Extension',
            uriTemplate: '/custom-protocol-handler.html#matched=%s',
        },
    ],
};
