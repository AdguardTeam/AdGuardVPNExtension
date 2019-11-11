const envMap = {
    development: 'adguardadblockerdev@adguard.com',
    beta: 'adguardadblockerbeta@adguard.com',
    release: 'adguardadblocker@adguard.com',
};

module.exports = {
    minimum_chrome_version: '55.0',
    applications: {
        gecko: {
            id: envMap[process.env.NODE_ENV],
            strict_min_version: '52.0',
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
        'storage',
        'unlimitedStorage',
        'proxy',
        'notifications',
        'activeTab',
        '*://*.adguard.com/*',
        '*://*.adguard.io/*',
    ],
};
