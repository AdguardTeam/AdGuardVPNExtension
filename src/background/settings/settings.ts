import { browserApi } from '../browserApi';
import { log } from '../../lib/logger';
import { notifier } from '../../lib/notifier';
import {
    SETTINGS_IDS,
    QuickConnectSetting,
    QUICK_CONNECT_SETTING_DEFAULT,
    APPEARANCE_THEME_DEFAULT,
} from '../../lib/constants';
import { dns } from '../dns';
import { DEFAULT_DNS_SERVER } from '../dns/dnsConstants';
import { webrtc } from '../browserApi/webrtc';
import { connectivityService, ConnectivityEventType } from '../connectivity/connectivityService';
import type { DnsServerData, PersistedExclusions } from '../schema';

import { SettingsService } from './SettingsService';

export interface SettingsInterface {
    init(): Promise<void>;
    getSetting(id: string): any;
    setSetting(id: string, value: any, force?: boolean): Promise<boolean>;
    disableProxy(force?: boolean): Promise<void>;
    enableProxy(force?: boolean): Promise<void>;
    isProxyEnabled(): boolean;
    SETTINGS_IDS: { [key: string]: boolean | string };
    applySettings(): void;
    getExclusions (): PersistedExclusions;
    setExclusions(exclusions: PersistedExclusions): void;
    isContextMenuEnabled(): boolean;
    isDebugModeEnabled(): boolean;
    getCustomDnsServers(): DnsServerData[];
    setCustomDnsServers(dnsServersData: DnsServerData[]): void;
    getSelectedDnsServer(): string;
    getQuickConnectSetting(): QuickConnectSetting;
}

const DEFAULT_SETTINGS = {
    [SETTINGS_IDS.PROXY_ENABLED]: false,
    [SETTINGS_IDS.RATE_SHOW]: true,
    [SETTINGS_IDS.PREMIUM_FEATURES_SHOW]: true,
    [SETTINGS_IDS.EXCLUSIONS]: {},
    [SETTINGS_IDS.HANDLE_WEBRTC_ENABLED]: false,
    [SETTINGS_IDS.SELECTED_DNS_SERVER]: DEFAULT_DNS_SERVER.id,
    [SETTINGS_IDS.CONTEXT_MENU_ENABLED]: true,
    [SETTINGS_IDS.POLICY_AGREEMENT]: false,
    [SETTINGS_IDS.HELP_US_IMPROVE]: false,
    [SETTINGS_IDS.APPEARANCE_THEME]: APPEARANCE_THEME_DEFAULT,
    [SETTINGS_IDS.CUSTOM_DNS_SERVERS]: [],
    [SETTINGS_IDS.QUICK_CONNECT]: QUICK_CONNECT_SETTING_DEFAULT,
    [SETTINGS_IDS.DEBUG_MODE_ENABLED]: false,
};

const settingsService = new SettingsService(browserApi.storage, DEFAULT_SETTINGS);

/**
 * Returns proxy settings enabled status
 */
const isProxyEnabled = (): boolean => {
    const setting = settingsService.getSetting(SETTINGS_IDS.PROXY_ENABLED);
    return setting === true;
};

const setSetting = async (id: string, value: boolean | string, force?: boolean): Promise<boolean> => {
    const setting = settingsService.getSetting(id);

    // No need to change same value unless is not force set
    if (setting === value && !force) {
        return false;
    }

    switch (id) {
        case SETTINGS_IDS.HANDLE_WEBRTC_ENABLED: {
            if (typeof value === 'boolean') {
                webrtc.setWebRTCHandlingAllowed(value, isProxyEnabled());
            }
            break;
        }
        case SETTINGS_IDS.SELECTED_DNS_SERVER: {
            if (typeof value === 'string') {
                dns.setDnsServer(value);
            }
            break;
        }
        default: {
            break;
        }
    }

    settingsService.setSetting(id, value);
    log.debug(`Setting with id: "${id}" was set to:`, value);
    notifier.notifyListeners(notifier.types.SETTING_UPDATED, id, value);
    return true;
};

const disableProxy = async (force?: boolean): Promise<void> => {
    const shouldApply = await setSetting(SETTINGS_IDS.PROXY_ENABLED, false, force);

    if (!shouldApply) {
        return;
    }

    connectivityService.send(ConnectivityEventType.DisconnectBtnPressed);
};

const enableProxy = async (force?: boolean): Promise<void> => {
    const shouldApply = await setSetting(SETTINGS_IDS.PROXY_ENABLED, true, force);

    if (!shouldApply) {
        return;
    }

    connectivityService.send(ConnectivityEventType.ConnectBtnPressed);
};

/**
 * Checks if setting is enabled
 * @param settingId
 */
const isSettingEnabled = (settingId: string): boolean => {
    const enabledSettingValue = true;
    const settingValue = settingsService.getSetting(settingId);
    return settingValue === enabledSettingValue;
};

const applySettings = (): void => {
    const proxyEnabled = isProxyEnabled();

    // Set WebRTC
    webrtc.setWebRTCHandlingAllowed(
        isSettingEnabled(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED),
        proxyEnabled,
    );

    // Set DNS server
    dns.setDnsServer(settingsService.getSetting(SETTINGS_IDS.SELECTED_DNS_SERVER));

    // Connect proxy
    if (proxyEnabled) {
        connectivityService.send(ConnectivityEventType.ExtensionLaunched);
    }

    log.info('Settings were applied');
};

const getSetting = (id: string) => {
    return settingsService.getSetting(id);
};

const getExclusions = (): PersistedExclusions => {
    return settingsService.getSetting(SETTINGS_IDS.EXCLUSIONS) || {};
};

const setExclusions = (exclusions: PersistedExclusions): void => {
    settingsService.setSetting(SETTINGS_IDS.EXCLUSIONS, exclusions);
};

const isContextMenuEnabled = (): boolean => {
    return settingsService.getSetting(SETTINGS_IDS.CONTEXT_MENU_ENABLED);
};

const getCustomDnsServers = (): DnsServerData[] => {
    return settingsService.getSetting(SETTINGS_IDS.CUSTOM_DNS_SERVERS);
};

const setCustomDnsServers = (dnsServersData: DnsServerData[]): void => {
    return settingsService.setSetting(SETTINGS_IDS.CUSTOM_DNS_SERVERS, dnsServersData);
};

const getSelectedDnsServer = (): string => {
    return settingsService.getSetting(SETTINGS_IDS.SELECTED_DNS_SERVER);
};

const getQuickConnectSetting = (): QuickConnectSetting => {
    return settingsService.getSetting(SETTINGS_IDS.QUICK_CONNECT);
};

const isDebugModeEnabled = (): boolean => {
    return settingsService.getSetting(SETTINGS_IDS.DEBUG_MODE_ENABLED);
};

const init = async (): Promise<void> => {
    await settingsService.init();
    dns.init();
    log.info('Settings module is ready');
};

export const settings: SettingsInterface = {
    init,
    getSetting,
    setSetting,
    disableProxy,
    enableProxy,
    isProxyEnabled,
    SETTINGS_IDS,
    applySettings,
    getExclusions,
    setExclusions,
    isContextMenuEnabled,
    getCustomDnsServers,
    setCustomDnsServers,
    getSelectedDnsServer,
    getQuickConnectSetting,
    isDebugModeEnabled,
};
