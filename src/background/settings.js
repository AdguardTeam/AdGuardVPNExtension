import log from '../lib/logger';
import notifier from '../lib/notifier';
import { proxy } from './proxy';
import credentials from './credentials';
import connectivity from './connectivity/connectivity';
import { SETTINGS_IDS } from '../lib/constants';
import actions from './actions';

const DEFAULT_SETTINGS = {
    [SETTINGS_IDS.PROXY_ENABLED]: false,
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

const proxyEnabledHandler = async (value) => {
    if (value) {
        try {
            const accessPrefix = await credentials.getAccessPrefix();
            const { host, domainName } = await proxy.setAccessPrefix(accessPrefix);
            const vpnToken = await credentials.gainVpnToken();
            await connectivity.setCredentials(host, domainName, vpnToken.token);
            await proxy.turnOn();
            await actions.setIconEnabled();
        } catch (e) {
            log.error(e.message);
            throw e;
        }
    } else {
        connectivity.stop();
        await proxy.turnOff();
        await actions.setIconDisabled();
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
    // No need to change same value unless is not force set
    if (setting.value === value && !force) {
        return false;
    }
    const handler = getHandler(id);
    if (handler) {
        try {
            await handler(value);
        } catch (e) {
            log.error(e.message);
            return false;
        }
    } else {
        log.error('There is no handler with id:', id);
        return false;
    }

    notifier.notifyListeners(notifier.types.SETTING_UPDATED, id, value);

    SETTINGS[id].value = value;
    log.info(`Setting with id: "${id}" was set to: "${value}"`);
    return true;
};

const disableProxy = async () => {
    await setSetting(SETTINGS_IDS.PROXY_ENABLED, false);
};

const isProxyEnabled = () => {
    const setting = getSetting(SETTINGS_IDS.PROXY_ENABLED);
    return setting.value === true;
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
    disableProxy,
    isProxyEnabled,
    SETTINGS_IDS,
};

export default settings;
