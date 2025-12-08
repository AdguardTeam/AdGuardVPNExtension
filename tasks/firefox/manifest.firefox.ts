import { MIN_SUPPORTED_VERSION } from '../consts';

const { BUILD_ENV, GECKO_ID_ENV_MAP, FIREFOX_UPDATE_URL } = require('../consts');

const appId = GECKO_ID_ENV_MAP[BUILD_ENV];

if (appId === undefined) {
    throw new Error(`App ID not found for BUILD_ENV: ${BUILD_ENV}`);
}

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
            id: appId,
            strict_min_version: `${MIN_SUPPORTED_VERSION.FIREFOX}.0`,
        },
        gecko_android: {
            strict_min_version: `${MIN_SUPPORTED_VERSION.FIREFOX_MOBILE}.0`,
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
};

export const firefoxManifestStandaloneDiff = {
    browser_specific_settings: {
        gecko: {
            update_url: FIREFOX_UPDATE_URL,
        },
    },
};
