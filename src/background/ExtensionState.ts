/**
 * This module is for storing the extension state in session storage
 * in order to quickly restore the state after the service worker wakes up
 */
import { browserApi } from './browserApi';

import type { FallbackInfo } from './api/fallbackApi';
import type { ProxyConfigInterface, AccessCredentials } from './proxy/proxy';
import type { VpnTokenData } from './credentials/Credentials';
import type { CredentialsDataInterface } from './providers/vpnProvider';
import type { EndpointInterface } from './endpoints/Endpoint';

const EXTENSION_STATE_KEY = 'AdgVpnExtStateKey';

export type CredentialsBackup = {
    vpnToken?: VpnTokenData,
    vpnCredentials?: CredentialsDataInterface,
    currentUsername?: string | null,
};

type ProxyStateType = {
    isActive?: boolean;
    bypassList?: string[];
    endpointsTldExclusions?: string[];
    currentEndpoint?: EndpointInterface | null;
    currentHost?: string;
    currentConfig?: ProxyConfigInterface;
    inverted?: boolean;
    credentials?: AccessCredentials;
};

export type ExtensionStateData = {
    fallbackInfo?: FallbackInfo;
    proxyState: ProxyStateType;
    credentialsBackup?: CredentialsBackup;
};

const PROXY_DEFAULTS = {
    isActive: false,
    bypassList: [],
    endpointsTldExclusions: [],
    currentEndpoint: null,
    currentHost: '',
};

const defaultProxyState = {
    isActive: PROXY_DEFAULTS.isActive,
    bypassList: PROXY_DEFAULTS.bypassList,
    endpointsTldExclusions: PROXY_DEFAULTS.endpointsTldExclusions,
    currentEndpoint: PROXY_DEFAULTS.currentEndpoint,
    currentHost: PROXY_DEFAULTS.currentHost,
};

class ExtensionState {
    // FIXME: add getters and remove public for properties
    public fallbackInfo?: FallbackInfo;

    public proxyState: ProxyStateType;

    public credentialsBackup?: CredentialsBackup;

    init = async () => {
        const state = await this.getState();
        this.fallbackInfo = state.fallbackInfo;
        this.proxyState = state.proxyState || defaultProxyState;
        this.credentialsBackup = state.credentialsBackup;
    };

    getState = async (): Promise<ExtensionStateData> => {
        if (browserApi.runtime.isManifestVersion2()) {
            const stateString = sessionStorage.getItem(EXTENSION_STATE_KEY) || '{}';
            return JSON.parse(stateString);
        }
        const stateObject = await chrome.storage.session.get(EXTENSION_STATE_KEY);
        return stateObject[EXTENSION_STATE_KEY] || {};
    };

    setState = async (value: ExtensionStateData): Promise<void> => {
        if (browserApi.runtime.isManifestVersion2()) {
            const stateString = JSON.stringify(value);
            sessionStorage.setItem(EXTENSION_STATE_KEY, stateString);
            return;
        }
        await chrome.storage.session.set({ [EXTENSION_STATE_KEY]: value });
    };

    updateStateInStorage = async (): Promise<void> => {
        const currentState = {
            fallbackInfo: this.fallbackInfo,
            proxyState: this.proxyState,
        };
        await this.setState(currentState);
    };

    updateFallbackInfo = async (value: FallbackInfo): Promise<void> => {
        this.fallbackInfo = value;
        await this.updateStateInStorage();
    };

    updateProxyConfig = async (value: ProxyConfigInterface): Promise<void> => {
        this.proxyState.currentConfig = value;
        await this.updateStateInStorage();
    };

    setIsProxyActive = async (value: boolean) => {
        this.proxyState.isActive = value;
        await this.updateStateInStorage();
    };

    updateBypassList = async (bypassList: string[]): Promise<void> => {
        this.proxyState.bypassList = bypassList;
        await this.updateStateInStorage();
    };

    updateInverted = async (inverted: boolean): Promise<void> => {
        this.proxyState.inverted = inverted;
        await this.updateStateInStorage();
    };

    updateEndpointsTldExclusions = async (endpointsTldExclusions: string[]): Promise<void> => {
        this.proxyState.endpointsTldExclusions = endpointsTldExclusions;
        await this.updateStateInStorage();
    };

    updateCurrentEndpoint = async (currentEndpoint: EndpointInterface | null): Promise<void> => {
        this.proxyState.currentEndpoint = currentEndpoint;
        await this.updateStateInStorage();
    };

    resetCurrentEndpoint = async (): Promise<void> => {
        this.proxyState.currentEndpoint = PROXY_DEFAULTS.currentEndpoint;
        await this.updateStateInStorage();
    };

    updateCurrentHost = async (host: string): Promise<void> => {
        this.proxyState.currentHost = host;
        await this.updateStateInStorage();
    };

    resetCurrentHost = async (): Promise<void> => {
        this.proxyState.currentHost = PROXY_DEFAULTS.currentHost;
        await this.updateStateInStorage();
    };

    updateProxyCredentials = async (credentials: AccessCredentials): Promise<void> => {
        this.proxyState.credentials = credentials;
        await this.updateStateInStorage();
    };

    updateVpnToken = async (value: VpnTokenData) => {
        const state = await this.getState();
        if (state.credentialsBackup) {
            state.credentialsBackup.vpnToken = value;
        } else {
            state.credentialsBackup = {
                vpnToken: value,
            };
        }
        await this.setState(state);
    };

    updateVpnCredentials = async (value: CredentialsDataInterface) => {
        const state = await this.getState();
        if (state.credentialsBackup) {
            state.credentialsBackup.vpnCredentials = value;
        } else {
            state.credentialsBackup = {
                vpnCredentials: value,
            };
        }
        await this.setState(state);
    };

    updateCurrentUsername = async (value: string) => {
        const state = await this.getState();
        if (state.credentialsBackup) {
            state.credentialsBackup.currentUsername = value;
        } else {
            state.credentialsBackup = {
                currentUsername: value,
            };
        }
        await this.setState(state);
    };
}

export const extensionState = new ExtensionState();
