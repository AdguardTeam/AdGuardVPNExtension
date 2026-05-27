/**
 * Typed event argument map for {@link NotifierType} events and derived helper types
 * used by the messaging layer to replace `any` in notifier-related messages.
 */
import { type ConnectivityStateChangeEvent, type WsConnectivityInfoMsgTraffic } from '../background/connectivity';
import { type LocationInterface } from '../background/schema';
import { type LocationWithPing } from '../background/endpoints/LocationWithPing';
import { type AuthCacheKey, type AuthCacheData } from '../background/authentication/authCacheTypes';
import { type WebAuthState } from '../background/auth/webAuthEnums';
import { type PingData } from '../background/endpoints/locationsService';

import { type VpnExtensionInfoInterface } from './schema/endpoints/vpnInfo';
import { type PreparedTab } from './tabs';
import { type LocalePreference } from './locale';
import { type NotifierType } from './notifier';
import { type ActiveProfileChangedPayload } from './profiles';

/**
 * Simplified permissions error sent from the background page.
 *
 * Background creates this plain object from an `Error` instance because
 * Firefox does not support structured-clone of `Error` objects.
 */
export interface PermissionsErrorData {
    message: string;
    status?: string;
}

/**
 * Location ping state sent with the `LOCATION_STATE_UPDATED` event.
 */
export interface LocationPingState extends PingData {
    locationId: string;
}

/**
 * Maps each {@link NotifierType} event to its argument tuple.
 *
 * The tuple order matches the positional `...args` passed to
 * `notifier.notifyListeners(event, ...args)`.
 */
export interface NotifierEventArgsMap {
    [NotifierType.SETTING_UPDATED]: [id: string, value: boolean | string];
    [NotifierType.NON_ROUTABLE_DOMAIN_FOUND]: [payload: number];
    [NotifierType.TOO_MANY_DEVICES_CONNECTED]: [maxDevicesAllowed: number];
    [NotifierType.NON_ROUTABLE_DOMAIN_ADDED]: [hostname: string];
    [NotifierType.CREDENTIALS_UPDATED]: [];
    [NotifierType.USER_AUTHENTICATED]: [];
    [NotifierType.USER_DEAUTHENTICATED]: [];
    [NotifierType.TAB_UPDATED]: [tab: PreparedTab];
    [NotifierType.TAB_ACTIVATED]: [tab: PreparedTab];
    [NotifierType.EXCLUSIONS_UPDATED_BACK_MESSAGE]: [];
    [NotifierType.EXCLUSIONS_DATA_UPDATED]: [];
    [NotifierType.SHOULD_REFRESH_TOKENS]: [];
    [NotifierType.DNS_SERVER_SET]: [address: string];
    [NotifierType.UPDATE_BROWSER_ACTION_ICON]: [];
    [NotifierType.SHOW_RATE_MODAL]: [];
    [NotifierType.AUTH_CACHE_UPDATED]: {
        [K in AuthCacheKey]: [field: K, value: AuthCacheData[K]]
    }[AuthCacheKey];
    [NotifierType.VPN_INFO_UPDATED]: [vpnInfo: VpnExtensionInfoInterface];
    [NotifierType.LOCATIONS_UPDATED]: [locations: LocationWithPing[]];
    [NotifierType.LOCATION_STATE_UPDATED]: [state: LocationPingState];
    [NotifierType.CURRENT_LOCATION_UPDATED]: [location: LocationInterface];
    [NotifierType.PERMISSIONS_ERROR_UPDATE]: [error: PermissionsErrorData | null];
    [NotifierType.TOKEN_PREMIUM_STATE_UPDATED]: [isPremium: boolean];
    [NotifierType.TRAFFIC_STATS_UPDATED]: [stats: WsConnectivityInfoMsgTraffic];
    [NotifierType.STATS_UPDATED]: [];
    [NotifierType.CONNECTIVITY_STATE_CHANGED]: [event: ConnectivityStateChangeEvent];
    [NotifierType.LANGUAGE_CHANGED]: [language: LocalePreference];
    [NotifierType.SERVER_ERROR]: [];
    [NotifierType.PORT_CONNECTED]: [portName: string];
    [NotifierType.PORT_DISCONNECTED]: [portName: string];
    [NotifierType.WEB_AUTH_FLOW_AUTHENTICATED]: [];
    [NotifierType.PROFILE_LOCATION_UPDATED]: [profileId: string, location: LocationInterface];
    [NotifierType.ACTIVE_PROFILE_CHANGED]: [payload: ActiveProfileChangedPayload];
    [NotifierType.PROFILE_SWITCH_IN_PROGRESS]: [profileId: string];
}

/**
 * Discriminated union of all notifier messages.
 *
 * Discriminant is `type` ({@link NotifierType}).
 * Narrowing on `type` in a `switch` statement gives precise types for
 * `data` and `value`.
 */
export type NotifierMessage =
    | { type: NotifierType.SETTING_UPDATED; data: string; value: boolean | string }
    | { type: NotifierType.NON_ROUTABLE_DOMAIN_FOUND; data: number }
    | { type: NotifierType.TOO_MANY_DEVICES_CONNECTED; data: number }
    | { type: NotifierType.NON_ROUTABLE_DOMAIN_ADDED; data: string }
    | { type: NotifierType.CREDENTIALS_UPDATED }
    | { type: NotifierType.USER_AUTHENTICATED }
    | { type: NotifierType.USER_DEAUTHENTICATED }
    | { type: NotifierType.TAB_UPDATED; data: PreparedTab }
    | { type: NotifierType.TAB_ACTIVATED; data: PreparedTab }
    | { type: NotifierType.EXCLUSIONS_UPDATED_BACK_MESSAGE }
    | { type: NotifierType.EXCLUSIONS_DATA_UPDATED }
    | { type: NotifierType.SHOULD_REFRESH_TOKENS }
    | { type: NotifierType.DNS_SERVER_SET; data: string }
    | { type: NotifierType.UPDATE_BROWSER_ACTION_ICON }
    | { type: NotifierType.SHOW_RATE_MODAL }
    | { type: NotifierType.AUTH_CACHE_UPDATED; data: AuthCacheKey.PolicyAgreement; value: boolean }
    | { type: NotifierType.AUTH_CACHE_UPDATED; data: AuthCacheKey.HelpUsImprove; value: boolean }
    | { type: NotifierType.AUTH_CACHE_UPDATED; data: AuthCacheKey.WebAuthFlowState; value: WebAuthState }
    | { type: NotifierType.VPN_INFO_UPDATED; data: VpnExtensionInfoInterface }
    | { type: NotifierType.LOCATIONS_UPDATED; data: LocationWithPing[] }
    | { type: NotifierType.LOCATION_STATE_UPDATED; data: LocationPingState }
    | { type: NotifierType.CURRENT_LOCATION_UPDATED; data: LocationInterface }
    | { type: NotifierType.PERMISSIONS_ERROR_UPDATE; data: PermissionsErrorData | null }
    | { type: NotifierType.TOKEN_PREMIUM_STATE_UPDATED; data: boolean }
    | { type: NotifierType.TRAFFIC_STATS_UPDATED; data: WsConnectivityInfoMsgTraffic }
    | { type: NotifierType.STATS_UPDATED }
    | { type: NotifierType.CONNECTIVITY_STATE_CHANGED; data: ConnectivityStateChangeEvent }
    | { type: NotifierType.LANGUAGE_CHANGED; data: LocalePreference }
    | { type: NotifierType.SERVER_ERROR }
    | { type: NotifierType.PORT_CONNECTED; data: string }
    | { type: NotifierType.PORT_DISCONNECTED; data: string }
    | { type: NotifierType.WEB_AUTH_FLOW_AUTHENTICATED }
    | { type: NotifierType.PROFILE_LOCATION_UPDATED; data: string; value: LocationInterface }
    | { type: NotifierType.ACTIVE_PROFILE_CHANGED; data: ActiveProfileChangedPayload }
    | { type: NotifierType.PROFILE_SWITCH_IN_PROGRESS; data: string };

/**
 * Wire-format tuple sent inside `NotifyListenersMessage`.
 *
 * Always serialized as `[NotifierType, ...args]` by the background messaging layer
 * and destructured as `[type, data, value]` by the consumer.
 */
export type NotifyListenersData = {
    [T in NotifierType]: [T, ...NotifierEventArgsMap[T]]
}[NotifierType];
