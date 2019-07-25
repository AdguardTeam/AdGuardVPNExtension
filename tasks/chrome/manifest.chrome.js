module.exports = {
    minimum_chrome_version: '55.0',
    options_page: 'options.html',
    permissions: [
        'tabs',
        '<all_urls>',
        'webRequest',
        'webRequestBlocking',
        'webNavigation',
        'storage',
        'unlimitedStorage',
        'contextMenus',
        'cookies',
    ],
    optional_permissions: [
        'privacy',
    ],
};
