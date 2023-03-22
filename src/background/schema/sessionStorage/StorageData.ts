import zod from 'zod';

import { fallbackInfoScheme } from '../fallbackApi';
import { PROXY_DEFAULTS, proxyStateScheme } from '../proxy';
import { EXCLUSIONS_SERVICES_STATE_DEFAULTS, exclusionsServicesScheme } from '../exclusions';
import { updateServiceStateScheme } from '../updateService';
import { FLAG_STORAGE_DEFAULTS, flagsStorageDataScheme } from '../../flagsStorageData';
import { credentialsStateScheme } from '../credentials';
import { AUTH_STATE_DEFAULTS, authStateScheme } from '../auth';
import { DNS_STATE_DEFAULTS, dnsStateScheme } from '../dns';
import { ENDPOINTS_TLD_EXCLUSIONS_DEFAULTS, endpointsTldExclusionsScheme } from '../proxy/endpointsTldExclusions';
import { PERMISSIONS_CHECKER_DEFAULTS, permissionsCheckerStateScheme } from '../permissionsChecker';
import { endpointsStateScheme } from '../endpoints';

export const enum StorageKey {
    FallbackInfo = 'fallbackInfo',
    ProxyState = 'proxyState',
    ExclusionsServicesState = 'exclusionsServicesState',
    UpdateServiceState = 'updateServiceState',
    FlagsStorageState = 'flagsStorageState',
    CredentialsState = 'credentialsState',
    AuthState = 'authState',
    DnsState = 'dnsState',
    EndpointsTldExclusions = 'endpointsTldExclusions',
    PermissionsChecker = 'permissionsChecker',
    Endpoints = 'endpoints',
}

export const storageDataScheme = zod.object({
    [StorageKey.FallbackInfo]: fallbackInfoScheme.or(zod.null()),
    [StorageKey.ProxyState]: proxyStateScheme,
    [StorageKey.ExclusionsServicesState]: exclusionsServicesScheme,
    [StorageKey.UpdateServiceState]: updateServiceStateScheme,
    [StorageKey.FlagsStorageState]: flagsStorageDataScheme,
    [StorageKey.CredentialsState]: credentialsStateScheme,
    [StorageKey.AuthState]: authStateScheme,
    [StorageKey.DnsState]: dnsStateScheme,
    [StorageKey.EndpointsTldExclusions]: endpointsTldExclusionsScheme,
    [StorageKey.PermissionsChecker]: permissionsCheckerStateScheme,
    [StorageKey.Endpoints]: endpointsStateScheme,
});

export type StorageData = zod.infer<typeof storageDataScheme>;

export const DEFAULT_STORAGE_DATA: StorageData = {
    [StorageKey.ProxyState]: PROXY_DEFAULTS,
    [StorageKey.FallbackInfo]: null,
    [StorageKey.FlagsStorageState]: FLAG_STORAGE_DEFAULTS,
    [StorageKey.CredentialsState]: {},
    [StorageKey.UpdateServiceState]: {},
    [StorageKey.ExclusionsServicesState]: EXCLUSIONS_SERVICES_STATE_DEFAULTS,
    [StorageKey.AuthState]: AUTH_STATE_DEFAULTS,
    [StorageKey.DnsState]: DNS_STATE_DEFAULTS,
    [StorageKey.EndpointsTldExclusions]: ENDPOINTS_TLD_EXCLUSIONS_DEFAULTS,
    [StorageKey.PermissionsChecker]: PERMISSIONS_CHECKER_DEFAULTS,
    [StorageKey.Endpoints]: {},
};
