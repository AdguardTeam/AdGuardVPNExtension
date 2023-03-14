/**
 * This service is for managing the extension state.
 * The state is stored in session storage in order to
 * quickly restore it after the service worker wakes up.
 */
import { browserApi } from './browserApi';
import type { FallbackInfo } from './api/fallbackApi';
import type { ProxyConfigInterface, AccessCredentials } from './proxy/proxy';
import type { VpnTokenData } from './credentials/Credentials';
import type { CredentialsDataInterface } from './providers/vpnProvider';
import type { EndpointInterface } from './endpoints/Endpoint';
import type { FlagsStorageData } from './flagsStorage';

const EXTENSION_STATE_KEY = 'AdgVpnExtStateKey';

export type CredentialsState = {
    vpnToken?: VpnTokenData;
    vpnCredentials?: CredentialsDataInterface;
    currentUsername?: string | null;
};

type ExclusionsServicesState = {
    lastUpdateTimeMs: number | null;
};

type ProxyState = {
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
    proxyState: ProxyState;
    credentialsState: CredentialsState;
    exclusionsServicesState: ExclusionsServicesState;
    updateServiceState: UpdateServiceState;
    flagsStorageState?: FlagsStorageData;
};

type UpdateServiceState = {
    prevVersion?: string;
    currentVersion?: string;
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
    private fallbackInfo?: FallbackInfo;

    private proxyState: ProxyState;

    private credentialsState: CredentialsState;

    private exclusionsServicesState: ExclusionsServicesState;

    private updateServiceState: UpdateServiceState;

    private flagsStorageState?: FlagsStorageData;

    private getState = async (): Promise<ExtensionStateData> => {
        if (browserApi.runtime.isManifestVersion2()) {
            const stateString = sessionStorage.getItem(EXTENSION_STATE_KEY) || '{}';
            return JSON.parse(stateString);
        }
        const stateObject = await chrome.storage.session.get(EXTENSION_STATE_KEY);
        return stateObject[EXTENSION_STATE_KEY] || {};
    };

    private setState = async (value: ExtensionStateData): Promise<void> => {
        if (browserApi.runtime.isManifestVersion2()) {
            const stateString = JSON.stringify(value);
            sessionStorage.setItem(EXTENSION_STATE_KEY, stateString);
            return;
        }
        await chrome.storage.session.set({ [EXTENSION_STATE_KEY]: value });
    };

    init = async () => {
        const state = await this.getState();
        this.fallbackInfo = state.fallbackInfo;
        this.proxyState = state.proxyState || defaultProxyState;
        this.credentialsState = state.credentialsState || {};
        this.exclusionsServicesState = state.exclusionsServicesState || {};
        this.updateServiceState = state.updateServiceState || {};
        this.flagsStorageState = state.flagsStorageState;
    };

    get currentState(): ExtensionStateData {
        return {
            fallbackInfo: this.fallbackInfo,
            proxyState: this.proxyState,
            credentialsState: this.credentialsState,
            exclusionsServicesState: this.exclusionsServicesState,
            updateServiceState: this.updateServiceState,
            flagsStorageState: this.flagsStorageState,
        };
    }

    updateStateInStorage = async (): Promise<void> => {
        await this.setState(this.currentState);
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
        this.credentialsState.vpnToken = value;
        await this.updateStateInStorage();
    };

    updateVpnCredentials = async (value: CredentialsDataInterface) => {
        this.credentialsState.vpnCredentials = value;
        await this.updateStateInStorage();
    };

    updateCurrentUsername = async (value: string) => {
        this.credentialsState.currentUsername = value;
        await this.updateStateInStorage();
    };

    updateLastUpdateTimeMs = async (value: number) => {
        this.exclusionsServicesState.lastUpdateTimeMs = value;
        await this.updateStateInStorage();
    };

    updatePrevVersion = async (value: string) => {
        this.updateServiceState.prevVersion = value;
        await this.updateStateInStorage();
    };

    updateCurrentVersion = async (value: string) => {
        this.updateServiceState.currentVersion = value;
        await this.updateStateInStorage();
    };

    updateFlagsStorageState = async (value: FlagsStorageData) => {
        this.flagsStorageState = value;
        await this.updateStateInStorage();
    };
}

export const extensionState = new ExtensionState();
