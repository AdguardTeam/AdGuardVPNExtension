import log from '../lib/logger';
import proxy from './proxy';

const SETTINGS = {
    globalProxyEnabled: {
        id: 'globalProxyEnabled',
        value: false,
    },
    // TODO move this setting into whitelist
    currentUrlProxyEnabled: {
        id: 'currentUrlProxyEnabled',
        value: true,
    },
    onlineTrackingPrevention: {
        id: 'onlineTrackingPrevention',
        value: true,
    },
    malwareProtection: {
        id: 'malwareProtection',
        value: true,
    },
};

const getSetting = settingId => SETTINGS[settingId];

const globalProxyEnabledHandler = async (value) => {
    if (value) {
        await proxy.turnOn();
    } else {
        await proxy.turnOff();
    }
};

const getHandler = (settingId) => {
    switch (settingId) {
        case 'globalProxyEnabled': {
            return globalProxyEnabledHandler;
        }
        default:
            throw new Error(`There is no handler suitable to setting with id: ${settingId}`);
    }
};

const setSetting = async (settingId, value) => {
    const setting = SETTINGS[settingId];
    // No need to change value
    if (setting.value === value) {
        return false;
    }
    const handler = getHandler(settingId);

    await handler(value);
    SETTINGS[settingId].value = value;
    log.info(`Setting ${settingId} value was set to: ${value}`);
    return true;
};

/**
 * Returns setting ids
 * @param settingsIds and array with settings ids
 * @returns {*}
 */
const getSettingsByIds = settingsIds => settingsIds.map(getSetting);

const init = async () => {
    await globalProxyEnabledHandler(SETTINGS.globalProxyEnabled.value);
};

// init default settings
init();

const settings = {
    getSetting,
    setSetting,
    getSettingsByIds,
};

export default settings;
