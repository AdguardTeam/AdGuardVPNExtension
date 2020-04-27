const { ENVS, STAGING } = require('../consts');

const envMap = {
    [ENVS.DEV]: 'adguardadblockerdev@adguard.com',
    [ENVS.BETA]: 'adguardadblockerbeta@adguard.com',
    [ENVS.RELEASE]: 'adguardadblocker@adguard.com',
};

module.exports = {
    minimum_chrome_version: '55.0',
    applications: {
        gecko: {
            id: envMap[STAGING],
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
    ],
};
