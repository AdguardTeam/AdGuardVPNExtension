import { browserApi } from '../browserApi';
import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';
import { SETTINGS_IDS, APPEARANCE_THEME_DEFAULT, type AppearanceTheme } from '../../common/constants';
import { type LocalePreference, LANGUAGE_AUTO, toLocalePreference } from '../../common/locale';
import { connectivityService, ConnectivityEventType } from '../connectivity/connectivityService';
import type { ProfilesState } from '../schema';
import { PROFILES_STATE_DEFAULTS } from '../schema';

import { type Settings, SettingsService } from './SettingsService';

export interface SettingsInterface {
    init(): Promise<void>;
    getSetting(id: string): any;
    setSetting(id: string, value: any, force?: boolean): Promise<boolean>;
    disableProxy(force?: boolean): Promise<void>;
    enableProxy(force?: boolean): Promise<void>;
    isProxyEnabled(): boolean;
    SETTINGS_IDS: { [key: string]: boolean | string };
    applySettings(): Promise<void>;
    isContextMenuEnabled(): boolean;
    isDebugModeEnabled(): boolean;
    getAppearanceTheme(): AppearanceTheme;
    isHelpUsImproveEnabled(): boolean;
    getSelectedLanguage(): LocalePreference;
    getProfilesState(): ProfilesState;
    setProfilesState(state: ProfilesState): void;
}

const DEFAULT_SETTINGS = {
    [SETTINGS_IDS.PROXY_ENABLED]: false,
    [SETTINGS_IDS.RATE_SHOW]: true,
    [SETTINGS_IDS.PREMIUM_FEATURES_SHOW]: true,
    [SETTINGS_IDS.CONTEXT_MENU_ENABLED]: true,
    [SETTINGS_IDS.POLICY_AGREEMENT]: false,
    [SETTINGS_IDS.HELP_US_IMPROVE]: false,
    [SETTINGS_IDS.APPEARANCE_THEME]: APPEARANCE_THEME_DEFAULT,
    [SETTINGS_IDS.DEBUG_MODE_ENABLED]: false,
    [SETTINGS_IDS.SELECTED_LANGUAGE]: LANGUAGE_AUTO,
    [SETTINGS_IDS.PROFILES_STATE]: PROFILES_STATE_DEFAULTS,
};

const settingsService = new SettingsService(browserApi.storage, DEFAULT_SETTINGS);

/**
 * Returns proxy settings enabled status.
 *
 * @returns True if proxy is enabled, false otherwise.
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

    settingsService.setSetting(id, value);
    log.debug(`[vpn.settings]: Setting with id: "${id}" was set to:`, value);
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

const applySettings = async (): Promise<void> => {
    const proxyEnabled = isProxyEnabled();

    // Connect proxy
    if (proxyEnabled) {
        connectivityService.send(ConnectivityEventType.ExtensionLaunched);
    }

    log.info('[vpn.settings]: Settings were applied');
};

const getSetting = (id: string): Settings => {
    return settingsService.getSetting(id);
};

const isContextMenuEnabled = (): boolean => {
    return settingsService.getSetting(SETTINGS_IDS.CONTEXT_MENU_ENABLED);
};

const isDebugModeEnabled = (): boolean => {
    return settingsService.getSetting(SETTINGS_IDS.DEBUG_MODE_ENABLED);
};

const getAppearanceTheme = (): AppearanceTheme => {
    return settingsService.getSetting(SETTINGS_IDS.APPEARANCE_THEME);
};

const isHelpUsImproveEnabled = (): boolean => {
    return settingsService.getSetting(SETTINGS_IDS.HELP_US_IMPROVE);
};

/**
 * Returns the user's selected language preference.
 *
 * If the stored value is invalid, writes {@link LANGUAGE_AUTO} back
 * to storage as a self-healing measure.
 *
 * @returns The selected locale code, or 'auto' for browser default.
 */
const getSelectedLanguage = (): LocalePreference => {
    const raw = settingsService.getSetting(SETTINGS_IDS.SELECTED_LANGUAGE) || LANGUAGE_AUTO;
    const validated = toLocalePreference(raw);
    if (validated !== raw) {
        settingsService.setSetting(SETTINGS_IDS.SELECTED_LANGUAGE, validated);
    }
    return validated;
};

const getProfilesState = (): ProfilesState => {
    return settingsService.getSetting(SETTINGS_IDS.PROFILES_STATE);
};

const setProfilesState = (state: ProfilesState): void => {
    settingsService.setSetting(SETTINGS_IDS.PROFILES_STATE, state);
};

const init = async (): Promise<void> => {
    await settingsService.init();
    log.info('[vpn.settings]: Settings module is ready');
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
    isContextMenuEnabled,
    isDebugModeEnabled,
    getAppearanceTheme,
    isHelpUsImproveEnabled,
    getSelectedLanguage,
    getProfilesState,
    setProfilesState,
};
