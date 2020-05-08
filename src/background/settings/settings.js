import SettingsService from './SettingsService';
import browserApi from '../browserApi';
import log from '../../lib/logger';
import notifier from '../../lib/notifier';
import { SETTINGS_IDS } from '../../lib/constants';
import switcher from '../switcher';
import dns from '../dns/dns';
import { DNS_DEFAULT } from '../dns/dnsConstants';
import webrtc from '../browserApi/webrtc';

const DEFAULT_SETTINGS = {
    [SETTINGS_IDS.PROXY_ENABLED]: false,
    [SETTINGS_IDS.RATE_SHOW]: true,
    [SETTINGS_IDS.EXCLUSIONS]: {},
    [SETTINGS_IDS.HANDLE_WEBRTC_ENABLED]: true,
    [SETTINGS_IDS.SELECTED_DNS_SERVER]: DNS_DEFAULT,
    [SETTINGS_IDS.CONTEXT_MENU_ENABLED]: true,
};

const settingsService = new SettingsService(browserApi.storage, DEFAULT_SETTINGS);

const proxySwitcherHandler = async (value) => {
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

/**
 * Returns proxy settings enabled status
 * @returns {boolean}
 */
const isProxyEnabled = () => {
    const setting = settingsService.getSetting(SETTINGS_IDS.PROXY_ENABLED);
    return setting === true;
};

const setSetting = async (id, value, force) => {
    const setting = settingsService.getSetting(id);

    // No need to change same value unless is not force set
    if (setting === value && !force) {
        return false;
    }

    switch (id) {
        case SETTINGS_IDS.HANDLE_WEBRTC_ENABLED: {
            webrtc.setWebRTCHandlingAllowed(value, isProxyEnabled());
            break;
        }
        case SETTINGS_IDS.SELECTED_DNS_SERVER: {
            dns.setDnsServer(value);
            break;
        }
        default: {
            break;
        }
    }

    notifier.notifyListeners(notifier.types.SETTING_UPDATED, id, value);
    settingsService.setSetting(id, value);
    log.info(`Setting with id: "${id}" was set to: "${value}"`);
    return true;
};

/**
 * Returns true if proxy was disabled, otherwise returns false
 * @param force
 * @param withCancel
 * @returns {Promise<boolean>}
 */
const disableProxy = async (force, withCancel) => {
    const shouldApply = await setSetting(SETTINGS_IDS.PROXY_ENABLED, false, force);

    if (!shouldApply) {
        return false;
    }

    try {
        await switcher.turnOff(withCancel);
        return true;
    } catch (e) {
        await setSetting(SETTINGS_IDS.PROXY_ENABLED, true, force);
        return false;
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
        throw new Error(`Connection error: ${e.message}`);
    }
};

/**
 * Checks if setting is enabled
 * @param settingId
 * @returns {boolean}
 */
const isSettingEnabled = (settingId) => {
    const enabledSettingValue = true;
    const settingValue = settingsService.getSetting(settingId);
    return settingValue === enabledSettingValue;
};

const applySettings = async () => {
    try {
        const proxyEnabled = isProxyEnabled();
        webrtc.setWebRTCHandlingAllowed(
            isSettingEnabled(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED),
            proxyEnabled
        );
        dns.setDnsServer(settingsService.getSetting(SETTINGS_IDS.SELECTED_DNS_SERVER));
        await proxySwitcherHandler(proxyEnabled);
    } catch (e) {
        await disableProxy();
    }
    log.info('Settings were applied');
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

const isContextMenuEnabled = () => {
    return settingsService.getSetting(SETTINGS_IDS.CONTEXT_MENU_ENABLED);
};

const init = async () => {
    await settingsService.init();
    notifier.addSpecifiedListener(notifier.types.WEBSOCKET_CLOSED, async () => {
        await disableProxy();

        // Reconnect when internet connection is back
        const connectionHandler = async () => {
            await enableProxy(false, true);
            window.removeEventListener('online', connectionHandler);
        };

        // remove previously added listener, if did not fire already
        window.addEventListener('online', connectionHandler);
        // add new listener
        window.addEventListener('online', connectionHandler);
    });
    log.info('Settings module is ready');
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
    isContextMenuEnabled,
};

export default settings;
