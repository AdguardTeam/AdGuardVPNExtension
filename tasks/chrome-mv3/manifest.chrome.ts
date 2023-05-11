export const chromeManifestDiff = {
    name: '__MSG_name__ MV3',
    manifest_version: 3,
    minimum_chrome_version: '66.0',
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
        extension_pages: 'script-src \'self\'; object-src \'self\'',
    },
    permissions: [
        'alarms',
        'webRequestAuthProvider',
    ],
    host_permissions: [
        '<all_urls>',
    ],
    content_scripts: [
        {
            matches: ['<all_urls>'],
            js: ['swWaker.js'],
            run_at: 'document_start',
        },
    ],
};
