module.exports = {
    minimum_chrome_version: '55.0',
    options_page: 'options.html',
    permissions: [
        'tabs',
        'storage',
        'unlimitedStorage',
        'proxy',
        'notifications',
        '*://10.7.143.216:8181/*',
        '*://10.7.144.39:8181/*',
    ],
};
