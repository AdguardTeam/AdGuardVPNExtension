export const edgeManifestDiff = {
    manifest_version: 2,
    minimum_chrome_version: '66.0',
    options_page: 'options.html',
    browser_action: {
        default_icon: {
            19: 'assets/images/icons/disabled-19.png',
            38: 'assets/images/icons/disabled-38.png',
        },
        default_title: '__MSG_name__',
        default_popup: 'popup.html',
    },
    background: {
        page: 'background.html',
        persistent: true,
    },
    permissions: [
        '<all_urls>',
        'webRequestBlocking',
    ],
};
