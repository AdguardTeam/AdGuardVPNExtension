import log from '../lib/logger';
import notifier from '../lib/notifier';
import { proxy } from './proxy';

export const SETTINGS_IDS = {
    PROXY_ENABLED: 'proxy.enabled',
    TRACKING_PREVENTION: 'tracking.prevention',
    MALWARE_PROTECTION: 'malware.protection',
};

const DEFAULT_SETTINGS = {
    [SETTINGS_IDS.PROXY_ENABLED]: false,
    [SETTINGS_IDS.TRACKING_PREVENTION]: false,
    [SETTINGS_IDS.MALWARE_PROTECTION]: false,
};

const SETTINGS = Object.entries(DEFAULT_SETTINGS)
    .reduce((acc, [id, value]) => ({
        ...acc,
        [id]: {
            id,
            value,
        },
    }), {});

const getSetting = settingId => SETTINGS[settingId];

// TODO [maximtop] move this in the separate file
const proxyEnabledHandler = async (value) => {
    if (value) {
        await proxy.turnOn();
    } else {
        await proxy.turnOff();
    }
};

const getHandler = (settingId) => {
    switch (settingId) {
        case SETTINGS_IDS.PROXY_ENABLED: {
            return proxyEnabledHandler;
        }
        default:
            return null;
    }
};

const setSetting = async (id, value, force) => {
    const setting = SETTINGS[id];
    // No need to change value unless is not force set
    if (setting.value === value && !force) {
        return false;
    }
    const handler = getHandler(id);
    // TODO [maximtop] check if there is no handler when all settings would have handlers
    if (handler) {
        await handler(value);
    }

    notifier.notifyListeners(notifier.types.SETTING_UPDATED, id, value);

    SETTINGS[id].value = value;
    log.debug(`Setting with id: "${id}" was set to: "${value}"`);
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
        // eslint-disable-next-line no-restricted-syntax
        for (const { id, value } of Object.values(SETTINGS)) {
            // eslint-disable-next-line no-await-in-loop
            await setSetting(id, value, true);
        }
    } catch (e) {
        log.error(e.message);
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
