import zod from 'zod';

import { fallbackInfoScheme } from '../fallbackApi';
import { PROXY_DEFAULTS, proxyStateScheme } from '../proxy';
import { exclusionsServicesScheme } from '../exclusionsServices';
import { updateServiceStateScheme } from '../updateService';
import { FLAG_STORAGE_DEFAULTS, flagsStorageDataScheme } from '../../flagsStorageData';
import { credentialsStateScheme } from '../credentials';
import { authStateScheme } from '../auth';
import { dnsStateScheme } from '../dns';

export const enum StorageKey {
    FallbackInfo = 'fallbackInfo',
    ProxyState = 'proxyState',
    ExclusionsServicesState = 'exclusionsServicesState',
    UpdateServiceState = 'updateServiceState',
    FlagsStorageState = 'flagsStorageState',
    CredentialsState = 'credentialsState',
    AuthState = 'authState',
    DnsState = 'dnsState',
}

export const storageDataScheme = zod.object({
    [StorageKey.FallbackInfo]: fallbackInfoScheme.or(zod.null()),
    [StorageKey.ProxyState]: proxyStateScheme,
    [StorageKey.ExclusionsServicesState]: exclusionsServicesScheme,
    [StorageKey.UpdateServiceState]: updateServiceStateScheme,
    [StorageKey.FlagsStorageState]: flagsStorageDataScheme.optional(),
    [StorageKey.CredentialsState]: credentialsStateScheme,
    [StorageKey.AuthState]: authStateScheme,
    [StorageKey.DnsState]: dnsStateScheme.optional(),
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
    [StorageKey.AuthState]: {
        socialAuthState: null,
        accessTokenData: null,
    },
    [StorageKey.DnsState]: {
        customDnsServers: [],
        backupDnsServersData: [],
        selectedDnsServer: null,
    },
};
