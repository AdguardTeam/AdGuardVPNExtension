const { ENVS, BUILD_ENV } = require('../consts');

const envMap = {
    [ENVS.DEV]: 'adguard-vpn-dev@adguard.com',
    [ENVS.BETA]: 'adguard-vpn-beta@adguard.com',
    [ENVS.RELEASE]: 'adguard-vpn@adguard.com',
};

module.exports = {
    minimum_chrome_version: '66.0',
    browser_specific_settings: {
        gecko: {
            id: envMap[BUILD_ENV],
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
    ],
};
