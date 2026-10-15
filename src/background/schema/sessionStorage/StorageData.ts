import * as v from 'valibot';

import { fallbackInfoScheme } from '../fallbackApi';
import {
    PROXY_DEFAULTS,
    proxyConfigInterfaceScheme,
    proxyStateScheme,
    DEFAULT_HOST_CREDENTIALS_REPOSITORY,
    hostCredentialsRepositoryScheme,
} from '../proxy';
import { exclusionsServicesManagerScheme, SERVICES_DEFAULTS } from '../exclusions';
import { updateServiceStateScheme } from '../updateService';
import { CREDENTIALS_STATE_DEFAULTS, credentialsStateScheme } from '../credentials';
import { AUTH_STATE_DEFAULTS, authStateScheme } from '../auth';
import { DNS_STATE_DEFAULTS, dnsStateScheme } from '../dns';
import { PROFILE_SESSION_STATE_DEFAULTS, profileSessionStateScheme } from '../profiles';
import { ENDPOINTS_TLD_EXCLUSIONS_DEFAULTS, endpointsTldExclusionsScheme } from '../proxy/endpointsTldExclusions';
import { PERMISSIONS_CHECKER_DEFAULTS, permissionsCheckerStateScheme } from '../permissionsChecker';
import { ENDPOINTS_STATE_DEFAULTS, endpointsStateScheme } from '../endpoints';
import { LOCATIONS_SERVICE_STATE_DEFAULTS, locationsServiceStateScheme } from '../endpoints/locationsService';
import { POPUP_OPENED_COUNTER_DEFAULTS, popupOpenedCounterStateScheme } from '../popupData';
import { CONNECTIVITY_DATA_DEFAULTS, connectivityDataScheme } from '../connectivity/data';
import { limitedOfferStorageDataScheme } from '../limitedOffer';

export const enum StorageKey {
    FallbackInfo = 'fallbackInfo',
    ProxyState = 'proxyState',
    ExclusionsServicesManagerState = 'exclusionsServicesManagerState',
    UpdateServiceState = 'updateServiceState',
    CredentialsState = 'credentialsState',
    AuthState = 'authState',
    DnsState = 'dnsState',
    ProfileSessionState = 'profileSessionState',
    EndpointsTldExclusions = 'endpointsTldExclusions',
    PermissionsChecker = 'permissionsChecker',
    Endpoints = 'endpoints',
    LocationsService = 'locationsService',
    PopupOpenedCounter = 'popupOpenedCounter',
    ConnectivityData = 'connectivityData',
    GlobalProxyConfig = 'globalProxyConfig',
    HostCredentialsRepository = 'hostCredentialsRepository',
    LimitedOfferService = 'limitedOfferService',
}

export const storageDataScheme = v.object({
    [StorageKey.FallbackInfo]: v.nullable(fallbackInfoScheme),
    [StorageKey.ProxyState]: proxyStateScheme,
    [StorageKey.ExclusionsServicesManagerState]: exclusionsServicesManagerScheme,
    [StorageKey.UpdateServiceState]: updateServiceStateScheme,
    [StorageKey.CredentialsState]: credentialsStateScheme,
    [StorageKey.AuthState]: authStateScheme,
    [StorageKey.DnsState]: dnsStateScheme,
    // Optional with a default: old sessions lack this key, and a required key
    // would fail the whole-schema validation and reset the entire state.
    [StorageKey.ProfileSessionState]: v.optional(
        profileSessionStateScheme,
        PROFILE_SESSION_STATE_DEFAULTS,
    ),
    [StorageKey.EndpointsTldExclusions]: endpointsTldExclusionsScheme,
    [StorageKey.PermissionsChecker]: permissionsCheckerStateScheme,
    [StorageKey.Endpoints]: endpointsStateScheme,
    [StorageKey.LocationsService]: locationsServiceStateScheme,
    [StorageKey.PopupOpenedCounter]: popupOpenedCounterStateScheme,
    [StorageKey.ConnectivityData]: connectivityDataScheme,
    [StorageKey.GlobalProxyConfig]: v.nullable(proxyConfigInterfaceScheme),
    [StorageKey.HostCredentialsRepository]: hostCredentialsRepositoryScheme,
    [StorageKey.LimitedOfferService]: limitedOfferStorageDataScheme,
});

export type StorageData = v.InferOutput<typeof storageDataScheme>;

export const DEFAULT_STORAGE_DATA: StorageData = {
    [StorageKey.ProxyState]: PROXY_DEFAULTS,
    [StorageKey.FallbackInfo]: null,
    [StorageKey.CredentialsState]: CREDENTIALS_STATE_DEFAULTS,
    [StorageKey.UpdateServiceState]: {},
    [StorageKey.ExclusionsServicesManagerState]: SERVICES_DEFAULTS,
    [StorageKey.AuthState]: AUTH_STATE_DEFAULTS,
    [StorageKey.DnsState]: DNS_STATE_DEFAULTS,
    [StorageKey.ProfileSessionState]: PROFILE_SESSION_STATE_DEFAULTS,
    [StorageKey.EndpointsTldExclusions]: ENDPOINTS_TLD_EXCLUSIONS_DEFAULTS,
    [StorageKey.PermissionsChecker]: PERMISSIONS_CHECKER_DEFAULTS,
    [StorageKey.Endpoints]: ENDPOINTS_STATE_DEFAULTS,
    [StorageKey.LocationsService]: LOCATIONS_SERVICE_STATE_DEFAULTS,
    [StorageKey.PopupOpenedCounter]: POPUP_OPENED_COUNTER_DEFAULTS,
    [StorageKey.ConnectivityData]: CONNECTIVITY_DATA_DEFAULTS,
    [StorageKey.GlobalProxyConfig]: null,
    [StorageKey.HostCredentialsRepository]: DEFAULT_HOST_CREDENTIALS_REPOSITORY,
    [StorageKey.LimitedOfferService]: null,
};
