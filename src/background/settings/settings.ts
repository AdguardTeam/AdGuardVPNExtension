import { SettingsService } from './SettingsService';
import { browserApi } from '../browserApi';
import { log } from '../../lib/logger';
import { notifier } from '../../lib/notifier';
import { SETTINGS_IDS, APPEARANCE_THEME_DEFAULT } from '../../lib/constants';
import { dns } from '../dns';
import { DEFAULT_DNS_SERVER } from '../dns/dnsConstants';
import { webrtc } from '../browserApi/webrtc';
import { connectivityService } from '../connectivity/connectivityService/connectivityFSM';
import { Event } from '../connectivity/connectivityService/connectivityConstants';
import { DnsServerData } from '../../common/components/constants';
import { PersistedExclusions } from '../exclusions/exclusions/ExclusionsManager';

export interface SettingsInterface {
    init(): Promise<void>;
    getSetting(id: string): any;
    setSetting(id: string, value: any, force?: boolean): Promise<boolean>;
    disableProxy(force?: boolean): Promise<void>;
    enableProxy(force?: boolean): Promise<void>;
    isProxyEnabled(): boolean;
    SETTINGS_IDS: { [key: string]: boolean | string };
    settingsService: SettingsService;
    applySettings(): void;
    getExclusions (): PersistedExclusions;
    setExclusions(exclusions: PersistedExclusions): void;
    isContextMenuEnabled(): boolean;
    getCustomDnsServers(): DnsServerData[];
    setCustomDnsServers(dnsServersData: DnsServerData[]): void;
    getSelectedDnsServer(): string;
}

const DEFAULT_SETTINGS = {
    [SETTINGS_IDS.PROXY_ENABLED]: false,
    [SETTINGS_IDS.RATE_SHOW]: true,
    [SETTINGS_IDS.PREMIUM_FEATURES_SHOW]: true,
    [SETTINGS_IDS.EXCLUSIONS]: {},
    [SETTINGS_IDS.HANDLE_WEBRTC_ENABLED]: true,
    [SETTINGS_IDS.SELECTED_DNS_SERVER]: DEFAULT_DNS_SERVER.id,
    [SETTINGS_IDS.CONTEXT_MENU_ENABLED]: true,
    [SETTINGS_IDS.POLICY_AGREEMENT]: false,
    [SETTINGS_IDS.HELP_US_IMPROVE]: false,
    [SETTINGS_IDS.APPEARANCE_THEME]: APPEARANCE_THEME_DEFAULT,
    [SETTINGS_IDS.CUSTOM_DNS_SERVERS]: [],
};

const settingsService = new SettingsService(browserApi.storage, DEFAULT_SETTINGS);

/**
 * Returns proxy settings enabled status
 * @returns {boolean}
 */
const isProxyEnabled = (): boolean => {
    const setting = settingsService.getSetting(SETTINGS_IDS.PROXY_ENABLED);
    return setting === true;
};

const setSetting = async (id: string, value: any, force?: boolean): Promise<boolean> => {
    const setting = settingsService.getSetting(id);

    // No need to change same value unless is not force set
    if (setting === value && !force) {
        return false;
    }

    switch (id) {
        case SETTINGS_IDS.HANDLE_WEBRTC_ENABLED: {
            webrtc.setWebRTCHandlingAllowed(value as boolean, isProxyEnabled());
            break;
        }
        case SETTINGS_IDS.SELECTED_DNS_SERVER: {
            dns.setDnsServer(value as string);
            break;
        }
        default: {
            break;
        }
    }

    notifier.notifyListeners(notifier.types.SETTING_UPDATED, id, value);
    settingsService.setSetting(id, value);
    log.debug(`Setting with id: "${id}" was set to:`, value);
    return true;
};

const disableProxy = async (force?: boolean): Promise<void> => {
    const shouldApply = await setSetting(SETTINGS_IDS.PROXY_ENABLED, false, force);

    if (!shouldApply) {
        return;
    }

    connectivityService.send(Event.DisconnectBtnPressed);
};

const enableProxy = async (force?: boolean): Promise<void> => {
    const shouldApply = await setSetting(SETTINGS_IDS.PROXY_ENABLED, true, force);

    if (!shouldApply) {
        return;
    }

    connectivityService.send(Event.ConnectBtnPressed);
};

/**
 * Checks if setting is enabled
 * @param settingId
 * @returns {boolean}
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
        connectivityService.send(Event.ExtensionLaunched);
    }

    log.info('Settings were applied');
};

const getSetting = (id: string): any => {
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
    settingsService,
    applySettings,
    getExclusions,
    setExclusions,
    isContextMenuEnabled,
    getCustomDnsServers,
    setCustomDnsServers,
    getSelectedDnsServer,
};
