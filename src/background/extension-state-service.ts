/**
 * This module is for storing the extension state in session storage
 * in order to quickly restore the state after the service worker wakes up
 */
import { browserApi } from './browserApi';

import type { FallbackInfo } from './api/fallbackApi';
import type { ProxyConfigInterface } from './proxy/proxy';
import type { VpnTokenData } from './credentials/Credentials';
import type { CredentialsDataInterface } from './providers/vpnProvider';

const EXTENSION_STATE_KEY = 'AdgVpnExtStateKey';

export type CredentialsBackup = {
    vpnToken?: VpnTokenData,
    vpnCredentials?: CredentialsDataInterface,
    currentUsername?: string | null,
};

export type ExtensionState = {
    fallbackInfo?: FallbackInfo;
    proxyConfig?: ProxyConfigInterface;
    credentialsBackup?: CredentialsBackup;
};

const getState = async (): Promise<ExtensionState> => {
    if (browserApi.runtime.isManifestVersion2()) {
        return {};
    }
    const stateObject = await chrome.storage.session.get(EXTENSION_STATE_KEY);
    return stateObject[EXTENSION_STATE_KEY] || {};
};

const setState = async (value: ExtensionState): Promise<void> => {
    if (browserApi.runtime.isManifestVersion2()) {
        return;
    }
    await chrome.storage.session.set({ [EXTENSION_STATE_KEY]: value });
};

const updateFallbackInfo = async (value: FallbackInfo) => {
    const state = await getState();
    state.fallbackInfo = value;
    await setState(state);
};

const updateProxyConfig = async (value: ProxyConfigInterface) => {
    const state = await getState();
    state.proxyConfig = value;
    await setState(state);
};

const updateVpnToken = async (value: VpnTokenData) => {
    const state = await getState();
    if (state.credentialsBackup) {
        state.credentialsBackup.vpnToken = value;
    } else {
        state.credentialsBackup = {
            vpnToken: value,
        };
    }
    await setState(state);
};

const updateVpnCredentials = async (value: CredentialsDataInterface) => {
    const state = await getState();
    if (state.credentialsBackup) {
        state.credentialsBackup.vpnCredentials = value;
    } else {
        state.credentialsBackup = {
            vpnCredentials: value,
        };
    }
    await setState(state);
};

const updateCurrentUsername = async (value: string) => {
    const state = await getState();
    if (state.credentialsBackup) {
        state.credentialsBackup.currentUsername = value;
    } else {
        state.credentialsBackup = {
            currentUsername: value,
        };
    }
    await setState(state);
};

export const extensionState = {
    getState,
    updateFallbackInfo,
    updateProxyConfig,
    updateVpnToken,
    updateVpnCredentials,
    updateCurrentUsername,
};
