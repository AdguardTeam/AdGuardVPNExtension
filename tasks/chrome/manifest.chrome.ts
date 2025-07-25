import { MIN_SUPPORTED_VERSION } from '../consts';

export const chromeManifestDiff = {
    manifest_version: 3,
    minimum_chrome_version: `${MIN_SUPPORTED_VERSION.CHROMIUM}.0`,
    options_page: 'options.html',
    background: {
        service_worker: 'background.js',
    },
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
    permissions: [
        'webRequestAuthProvider',
        'offscreen',
        'browsingData',
    ],
    host_permissions: [
        '<all_urls>',
    ],
};
