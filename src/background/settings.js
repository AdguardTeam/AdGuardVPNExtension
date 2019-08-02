import log from '../lib/logger';
import { proxy } from './proxy';

const SETTINGS = {
    extensionEnabled: {
        id: 'extensionEnabled',
        value: false,
    },
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

const extensionEnabledHandler = async (value) => {
    if (value) {
        await proxy.turnOn();
    } else {
        await proxy.turnOff();
    }
};

const getHandler = (settingId) => {
    switch (settingId) {
        case 'extensionEnabled': {
            return extensionEnabledHandler;
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

// init default settings
let settingsReadyStatus = false;

const initDefaults = async () => {
    try {
        await extensionEnabledHandler(SETTINGS.extensionEnabled.value);
    } catch (e) {
        log.info(e.message);
    }
    settingsReadyStatus = true;
};

initDefaults();

const areSettingsReady = () => settingsReadyStatus;

const settings = {
    getSetting,
    setSetting,
    getSettingsByIds,
    areSettingsReady,
};

export default settings;
