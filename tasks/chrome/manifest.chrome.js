module.exports = {
    minimum_chrome_version: '55.0',
    options_page: 'options.html',
    permissions: [
        'storage',
        'unlimitedStorage',
        'proxy',
        'notifications',
        'activeTab',
        '*://*.adguard.com/*',
        '*://*.adguard.io/*',
    ],
};
