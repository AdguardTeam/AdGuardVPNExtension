import { browserApi } from './browserApi';

import type { FallbackInfo } from './api/fallbackApi';
import type { ProxyConfigInterface } from './proxy/proxy';
import type { VpnTokenData } from './credentials/Credentials';
import type { CredentialsDataInterface } from './providers/vpnProvider';

const EXTENSION_STATE_KEY = 'extensionState';

export type CredentialsBackup = {
    vpnToken: VpnTokenData,
    vpnCredentials: CredentialsDataInterface,
    currentUsername: string | null,
};

export type ExtensionState = {
    fallbackInfo: FallbackInfo;
    proxyConfig: ProxyConfigInterface;
    credentialsBackup: CredentialsBackup;
};

const getState = async (): Promise<ExtensionState> => {
    return await browserApi.storage.get(EXTENSION_STATE_KEY) || {};
};

const setState = async (value: ExtensionState) => {
    return browserApi.storage.set(EXTENSION_STATE_KEY, value);
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

export const extensionState = {
    getState,
    updateFallbackInfo,
    updateProxyConfig,
};
