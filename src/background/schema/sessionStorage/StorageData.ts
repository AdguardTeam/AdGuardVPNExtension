import zod from 'zod';

import { fallbackInfoScheme } from '../fallbackApi';
import { PROXY_DEFAULTS, proxyStateScheme } from '../proxy';
import {
    exclusionsServicesManagerScheme,
    exclusionsManagerStateScheme,
    exclusionsStateScheme,
    EXCLUSIONS_MANAGER_STATE_DEFAULTS,
    SERVICES_DEFAULTS,
    EXCLUSIONS_STATE_DEFAULTS,
} from '../exclusions';
import { updateServiceStateScheme } from '../updateService';
import { FLAG_STORAGE_DEFAULTS, flagsStorageDataScheme } from '../../flagsStorageData';
import { CREDENTIALS_STATE_DEFAULTS, credentialsStateScheme } from '../credentials';
import { AUTH_STATE_DEFAULTS, authStateScheme } from '../auth';
import { DNS_STATE_DEFAULTS, dnsStateScheme } from '../dns';
import { ENDPOINTS_TLD_EXCLUSIONS_DEFAULTS, endpointsTldExclusionsScheme } from '../proxy/endpointsTldExclusions';
import { PERMISSIONS_CHECKER_DEFAULTS, permissionsCheckerStateScheme } from '../permissionsChecker';
import { ENDPOINTS_STATE_DEFAULTS, endpointsStateScheme } from '../endpoints';
import { LOCATIONS_SERVICE_STATE_DEFAULTS, locationsServiceStateScheme } from '../endpoints/locationsService';

export const enum StorageKey {
    FallbackInfo = 'fallbackInfo',
    ProxyState = 'proxyState',
    ExclusionsState = 'exclusionsState',
    ExclusionsManagerState = 'exclusionsManagerState',
    ExclusionsServicesManagerState = 'exclusionsServicesManagerState',
    UpdateServiceState = 'updateServiceState',
    FlagsStorageState = 'flagsStorageState',
    CredentialsState = 'credentialsState',
    AuthState = 'authState',
    DnsState = 'dnsState',
    EndpointsTldExclusions = 'endpointsTldExclusions',
    PermissionsChecker = 'permissionsChecker',
    Endpoints = 'endpoints',
    LocationsService = 'locationsService',
}

export const storageDataScheme = zod.object({
    [StorageKey.FallbackInfo]: fallbackInfoScheme.or(zod.null()),
    [StorageKey.ProxyState]: proxyStateScheme,
    [StorageKey.ExclusionsState]: exclusionsStateScheme,
    [StorageKey.ExclusionsManagerState]: exclusionsManagerStateScheme,
    [StorageKey.ExclusionsServicesManagerState]: exclusionsServicesManagerScheme,
    [StorageKey.UpdateServiceState]: updateServiceStateScheme,
    [StorageKey.FlagsStorageState]: flagsStorageDataScheme,
    [StorageKey.CredentialsState]: credentialsStateScheme,
    [StorageKey.AuthState]: authStateScheme,
    [StorageKey.DnsState]: dnsStateScheme,
    [StorageKey.EndpointsTldExclusions]: endpointsTldExclusionsScheme,
    [StorageKey.PermissionsChecker]: permissionsCheckerStateScheme,
    [StorageKey.Endpoints]: endpointsStateScheme,
    [StorageKey.LocationsService]: locationsServiceStateScheme,
});

export type StorageData = zod.infer<typeof storageDataScheme>;

export const DEFAULT_STORAGE_DATA: StorageData = {
    [StorageKey.ProxyState]: PROXY_DEFAULTS,
    [StorageKey.FallbackInfo]: null,
    [StorageKey.FlagsStorageState]: FLAG_STORAGE_DEFAULTS,
    [StorageKey.CredentialsState]: CREDENTIALS_STATE_DEFAULTS,
    [StorageKey.UpdateServiceState]: {},
    [StorageKey.ExclusionsState]: EXCLUSIONS_STATE_DEFAULTS,
    [StorageKey.ExclusionsManagerState]: EXCLUSIONS_MANAGER_STATE_DEFAULTS,
    [StorageKey.ExclusionsServicesManagerState]: SERVICES_DEFAULTS,
    [StorageKey.AuthState]: AUTH_STATE_DEFAULTS,
    [StorageKey.DnsState]: DNS_STATE_DEFAULTS,
    [StorageKey.EndpointsTldExclusions]: ENDPOINTS_TLD_EXCLUSIONS_DEFAULTS,
    [StorageKey.PermissionsChecker]: PERMISSIONS_CHECKER_DEFAULTS,
    [StorageKey.Endpoints]: ENDPOINTS_STATE_DEFAULTS,
    [StorageKey.LocationsService]: LOCATIONS_SERVICE_STATE_DEFAULTS,
};
