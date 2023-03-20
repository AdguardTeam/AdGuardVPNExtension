/**
 * This service is for managing the extension state.
 * The state is stored in session storage in order to
 * quickly restore it after the service worker wakes up.
 */
import zod from 'zod';

import { browserApi } from './browserApi';
import { fallbackInfoScheme } from './api/fallbackInfo';
import { proxyStateScheme, PROXY_DEFAULTS } from './proxy/schema';
import { flagsStorageDataScheme, FLAG_STORAGE_DEFAULTS } from './flagsStorageData';
import type { VpnTokenData } from './credentials/Credentials';
import type { CredentialsDataInterface } from './providers/vpnProvider';
import { log } from '../lib/logger';

export type CredentialsState = {
    vpnToken?: VpnTokenData;
    vpnCredentials?: CredentialsDataInterface;
    currentUsername?: string | null;
};

// TODO: move to modules

const credentialsStateScheme = zod.object({
    vpnToken: zod.any().optional(),
    vpnCredentials: zod.any().optional(),
    currentUsername: zod.string().or(zod.null()).optional(),
}).strict();

const exclusionsServicesScheme = zod.object({
    lastUpdateTimeMs: zod.number().or(zod.null()),
}).strict();

// type ExclusionsServicesState = zod.infer<typeof exclusionsServicesScheme>;

const updateServiceStateScheme = zod.object({
    prevVersion: zod.string().optional(),
    currentVersion: zod.string().optional(),
}).strict();

// type UpdateServiceState = zod.infer<typeof updateServiceStateScheme>;

export const enum StorageKey {
    FallbackInfo = 'fallbackInfo',
    ProxyState = 'proxyState',
    ExclusionsServicesState = 'exclusionsServicesState',
    UpdateServiceState = 'updateServiceState',
    FlagsStorageState = 'flagsStorageState',
    CredentialsState = 'credentialsState',
}

export const storageDataScheme = zod.object({
    [StorageKey.FallbackInfo]: fallbackInfoScheme.or(zod.null()),
    [StorageKey.ProxyState]: proxyStateScheme,
    [StorageKey.ExclusionsServicesState]: exclusionsServicesScheme,
    [StorageKey.UpdateServiceState]: updateServiceStateScheme,
    [StorageKey.FlagsStorageState]: flagsStorageDataScheme.optional(),
    [StorageKey.CredentialsState]: credentialsStateScheme,
});

export type StorageData = zod.infer<typeof storageDataScheme>;

export const DEFAULT_STORAGE_DATA: StorageData = {
    [StorageKey.ProxyState]: PROXY_DEFAULTS,
    [StorageKey.FallbackInfo]: null,
    [StorageKey.FlagsStorageState]: FLAG_STORAGE_DEFAULTS,
    [StorageKey.CredentialsState]: {},
    [StorageKey.UpdateServiceState]: {},
    [StorageKey.ExclusionsServicesState]: {
        lastUpdateTimeMs: null,
    },
};

const EXTENSION_STATE_KEY = 'AdgVpnExtStateKey';

class SessionStorage {
    private state: StorageData;

    public getItem = (key: StorageKey): any => {
        return this.state[key];
    };

    public setItem = (key: StorageKey, value: any): void => {
        this.state[key] = value;
        // TODO: maybe await
        chrome.storage.session.set({ [key]: value });
    };

    public init = async () => {
        try {
            const data = <StorageData | {}> await SessionStorage.getData();

            if (data && Object.keys(data).length) {
                this.state = storageDataScheme.parse({
                    ...DEFAULT_STORAGE_DATA,
                    ...data,
                });
                return;
            }

            // init default state
            this.state = { ...DEFAULT_STORAGE_DATA };
            await SessionStorage.setData(this.state);
            return;
        } catch (e) {
            log.error(e);
        }
    };

    private static async getData(): Promise<unknown> {
        if (browserApi.runtime.isManifestVersion2()) {
            const data = sessionStorage.getItem(EXTENSION_STATE_KEY);

            if (!data) {
                return null;
            }

            return JSON.parse(data);
        }

        return chrome.storage.session.get(null);
    }

    private static async setData(data: StorageData): Promise<void> {
        if (browserApi.runtime.isManifestVersion2()) {
            return sessionStorage.setItem(EXTENSION_STATE_KEY, JSON.stringify(data));
        }

        return chrome.storage.session.set(data);
    }
}

export const sessionState = new SessionStorage();
