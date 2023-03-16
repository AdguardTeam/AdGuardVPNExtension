/**
 * This service is for managing the extension state.
 * The state is stored in session storage in order to
 * quickly restore it after the service worker wakes up.
 */
import _ from 'lodash';

import { browserApi } from './browserApi';
import type { FallbackInfo } from './api/fallbackApi';
import type { ProxyConfigInterface, AccessCredentials } from './proxy/proxy';
import type { VpnTokenData } from './credentials/Credentials';
import type { CredentialsDataInterface } from './providers/vpnProvider';
import type { EndpointInterface } from './endpoints/Endpoint';
import type { FlagsStorageData } from './flagsStorage';

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

type UpdateServiceState = {
    prevVersion?: string;
    currentVersion?: string;
};

export type ExtensionStateData = {
    fallbackInfo?: FallbackInfo;
    proxyState: ProxyState;
    credentialsState: CredentialsState;
    exclusionsServicesState: ExclusionsServicesState;
    updateServiceState: UpdateServiceState;
    flagsStorageState?: FlagsStorageData;
};

const EXTENSION_STATE_KEY = 'AdgVpnExtStateKey';

export const PROXY_DEFAULTS = {
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

const enum StorageKey {
    FallbackInfo = 'fallbackInfo',
    ProxyState = 'proxyState',
}

class SessionStorage {
    private state: ExtensionStateData;

    /**
     * Returns extension state from storage
     *
     * @returns ExtensionStateData - extension state data
     */
    private getStateFromStorage = async (): Promise<ExtensionStateData> => {
        if (browserApi.runtime.isManifestVersion2()) {
            const stateString = sessionStorage.getItem(EXTENSION_STATE_KEY) || '{}';
            return JSON.parse(stateString);
        }
        const stateObject = await chrome.storage.session.get(EXTENSION_STATE_KEY);
        return stateObject[EXTENSION_STATE_KEY] || {};
    };

    getState = (key: StorageKey): any => {
        return this.state[key];
    };

    // setState = (value: ExtensionStateData): void => {
    //     if (browserApi.runtime.isManifestVersion2()) {
    //         const stateString = JSON.stringify(value);
    //         sessionStorage.setItem(EXTENSION_STATE_KEY, stateString);
    //         return;
    //     }
    //     chrome.storage.session.set({ [EXTENSION_STATE_KEY]: value }, () => {});
    // };

    setState = (key: StorageKey, value: any): void => {
        this.state[key] = value;
        chrome.storage.session.set({ [key]: value }, () => {});
    };

    private updateStateInStorage = (): void => {
        this.setState(this.state);
    };

    public init = async () => {
        this.state = await this.getStateFromStorage() || {};

        // validation FIXME: refactor
        this.state.proxyState = this.state.proxyState || defaultProxyState;
        this.state.credentialsState = this.state.credentialsState || {};
        this.state.exclusionsServicesState = this.state.exclusionsServicesState || {};
        this.state.updateServiceState = this.state.updateServiceState || {};
    };

    public get currentState(): ExtensionStateData {
        return this.state;
    }

    // FIXME: fix naming and remove any
    public updateState = (stateUpdate: any) => {
        this.state = _.merge(this.state, stateUpdate);
        this.updateStateInStorage();
    };

    public updateLastUpdateTimeMs = (value: number): void => {
        this.state.exclusionsServicesState.lastUpdateTimeMs = value;
        this.updateStateInStorage();
    };

    public updatePrevVersion = (value: string): void => {
        this.state.updateServiceState.prevVersion = value;
        this.updateStateInStorage();
    };

    public updateCurrentVersion = (value: string): void => {
        this.state.updateServiceState.currentVersion = value;
        this.updateStateInStorage();
    };

    public updateFlagsStorageState = (value: FlagsStorageData): void => {
        this.state.flagsStorageState = value;
        this.updateStateInStorage();
    };
}

export const session = new SessionStorage();
