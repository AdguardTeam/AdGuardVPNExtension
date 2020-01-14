import SettingsService from './SettingsService';
import storage from '../storage';
import log from '../../lib/logger';
import notifier from '../../lib/notifier';
import { SETTINGS_IDS } from '../../lib/constants';
import switcher from '../switcher';

const DEFAULT_SETTINGS = {
    [SETTINGS_IDS.PROXY_ENABLED]: false,
    [SETTINGS_IDS.RATE_SHOW]: true,
    [SETTINGS_IDS.EXCLUSIONS]: {},
};

const settingsService = new SettingsService(storage, DEFAULT_SETTINGS);

const switcherHandler = async (value) => {
    try {
        if (value) {
            await switcher.turnOn(true);
        } else {
            await switcher.turnOff(true);
        }
    } catch (e) {
        settingsService.setSetting(SETTINGS_IDS.PROXY_ENABLED, false);
        throw (e);
    }
};

// TODO [maximtop] check all locations where function was run
const setSetting = async (id, value, force) => {
    const setting = settingsService.getSetting(id);

    // No need to change same value unless is not force set
    if (setting === value && !force) {
        return false;
    }

    notifier.notifyListeners(notifier.types.SETTING_UPDATED, id, value);
    settingsService.setSetting(id, value);
    log.info(`Setting with id: "${id}" was set to: "${value}"`);
    return true;
};

const disableProxy = async (force, withCancel) => {
    const shouldApply = await setSetting(SETTINGS_IDS.PROXY_ENABLED, false, force);

    if (!shouldApply) {
        return;
    }

    try {
        await switcher.turnOff(withCancel);
    } catch (e) {
        await setSetting(SETTINGS_IDS.PROXY_ENABLED, true, force);
    }
};

const enableProxy = async (force, withCancel) => {
    const shouldApply = await setSetting(SETTINGS_IDS.PROXY_ENABLED, true, force);

    if (!shouldApply) {
        return;
    }

    try {
        await switcher.turnOn(withCancel);
    } catch (e) {
        await setSetting(SETTINGS_IDS.PROXY_ENABLED, false, force);
    }
};

const isProxyEnabled = () => {
    const setting = settingsService.getSetting(SETTINGS_IDS.PROXY_ENABLED);
    return setting === true;
};

const applySettings = async () => {
    try {
        await switcherHandler(isProxyEnabled());
    } catch (e) {
        await disableProxy();
    }
    log.info('Settings were applied');
};

const init = async () => {
    await settingsService.init();
    log.info('Settings module is ready');
};

const getSetting = (id) => {
    return settingsService.getSetting(id);
};

const getExclusions = () => {
    return settingsService.getSetting(SETTINGS_IDS.EXCLUSIONS) || {};
};

const setExclusions = (exclusions) => {
    settingsService.setSetting(SETTINGS_IDS.EXCLUSIONS, exclusions);
};

const settings = {
    init,
    getSetting,
    setSetting,
    disableProxy,
    enableProxy,
    isProxyEnabled,
    SETTINGS_IDS,
    settingsService,
    applySettings,
    getExclusions,
    setExclusions,
};

export default settings;
