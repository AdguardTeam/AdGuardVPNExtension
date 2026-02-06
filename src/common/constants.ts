import type browser from 'webextension-polyfill';

import { type LimitedOfferData } from '../background/limitedOfferService';
import { type LocationsTab } from '../background/endpoints/locationsEnums';
import { type OptionsData } from '../options/stores/SettingsStore';
import { type ConsentDataResponse } from '../background/consent';
import { type BonusesData } from '../background/providers/accountProvider';
import type { LocationData } from '../popup/stores/VpnStore';
import { type AuthCacheKey, type AuthCacheValue } from '../background/authentication/authCacheTypes';
import { type CanControlProxy, type DnsServerData } from '../background/schema';
import {
    type ExclusionsMap,
    type GetExclusionsDataResponse,
    type ToggleServicesResult,
} from '../background/exclusions/ExclusionsService';
import { type LocationDto } from '../background/endpoints/LocationDto';
import { type RequestSupportResponse } from '../background/providers/vpnProvider';
import { type ForwarderUrlQueryKey } from '../background/config';
import {
    type TelemetryActionName,
    type TelemetryActionToScreenMap,
    type TelemetryScreenName,
} from '../background/telemetry/telemetryEnums';
import { type StatisticsByRange, type StatisticsRange } from '../background/statistics/statisticsTypes';
import type { WebAuthAction } from '../background/auth/webAuthEnums';
import { type FlagsStorageData } from '../background/flagsStorageData';

import { type ExclusionsMode } from './exclusionsConstants';
import type { NotifierType } from './notifier';

export const SETTINGS_IDS = {
    PROXY_ENABLED: 'proxy.enabled',
    RATE_SHOW: 'rate.show',
    PREMIUM_FEATURES_SHOW: 'premium.features.show',
    USER_SET_PROMO_SHOW: 'user.set.promo.show',
    EXCLUSIONS: 'exclusions.list',
    HANDLE_WEBRTC_ENABLED: 'webrtc.handle.enabled',
    SELECTED_DNS_SERVER: 'dns.handle.server',
    SELECTED_CUSTOM_DNS_SERVER: 'custom.dns.handle.server',
    CONTEXT_MENU_ENABLED: 'context.menu.enabled',
    SELECTED_LOCATION_KEY: 'endpoints.selected.location',
    LOCATION_SELECTED_BY_USER_KEY: 'endpoints.location.selected.by.user',
    POLICY_AGREEMENT: 'policy.agreement',
    HELP_US_IMPROVE: 'help.us.improve',
    APPEARANCE_THEME: 'appearance.theme',
    CUSTOM_DNS_SERVERS: 'custom.dns.servers',
    QUICK_CONNECT: 'quick.connect',
    DEBUG_MODE_ENABLED: 'debug.mode.enabled',
};

export const enum AppearanceTheme {
    System = 'System',
    Dark = 'Dark',
    Light = 'Light',
}

export const APPEARANCE_THEME_DEFAULT = AppearanceTheme.System;

export const THEME_URL_PARAMETER = 'theme';

export const enum QuickConnectSetting {
    LastUsedLocation = 'lastUsedLocation',
    FastestLocation = 'fastestLocation',
}

export const QUICK_CONNECT_SETTING_DEFAULT = QuickConnectSetting.LastUsedLocation;

export enum MessageType {
    ADD_EVENT_LISTENER = 'add.event.listener',
    NOTIFY_LISTENERS = 'notify.listeners',
    REMOVE_EVENT_LISTENER = 'remove.event.listener',

    ADD_LONG_LIVED_CONNECTION = 'add.long.lived.connection',
    GET_POPUP_DATA = 'get.popup.data',
    GET_LIMITED_OFFER_DATA = 'get.limited.offer.data',
    FORCE_UPDATE_LOCATIONS = 'force.update.locations',
    SAVED_LOCATIONS_SAVE_TAB = 'saved.locations.save.tab',
    SAVED_LOCATIONS_ADD = 'saved.locations.add',
    SAVED_LOCATIONS_REMOVE = 'saved.locations.remove',
    GET_OPTIONS_DATA = 'get.options.data',
    GET_CONSENT_DATA = 'get.consent.data',
    SET_CONSENT_DATA = 'set.consent.data',
    GET_VPN_FAILURE_PAGE = 'get.vpn.failure.page',
    OPEN_OPTIONS_PAGE = 'open.options.page',
    SET_SELECTED_LOCATION = 'set.selected.location',
    DEAUTHENTICATE_USER = 'deauthenticate.user',
    UPDATE_AUTH_CACHE = 'update.auth.cache',
    GET_CAN_CONTROL_PROXY = 'get.can.control.proxy',
    ENABLE_PROXY = 'enable.proxy',
    DISABLE_PROXY = 'disable.proxy',
    ADD_URL_TO_EXCLUSIONS = 'add.to.exclusions',
    REMOVE_EXCLUSION = 'remove.exclusion',
    DISABLE_VPN_BY_URL = 'disable.vpn.by.url',
    ENABLE_VPN_BY_URL = 'enable.vpn.by.url',
    DISABLE_OTHER_EXTENSIONS = 'disable.other.extensions',
    IS_AUTHENTICATED = 'is.authenticated',
    CLEAR_PERMISSIONS_ERROR = 'clear.permissions.error',
    CHECK_PERMISSIONS = 'check.permissions',
    GET_EXCLUSIONS_INVERTED = 'get.exclusions.inverted',
    GET_EXCLUSIONS_DATA = 'get.exclusions.data',
    SET_EXCLUSIONS_MODE = 'set.exclusions.mode',
    TOGGLE_EXCLUSION_STATE = 'toggle.exclusion.state',
    RESET_SERVICE_DATA = 'reset.service.data',
    CLEAR_EXCLUSIONS_LIST = 'clear.exclusions.list',
    TOGGLE_SERVICES = 'toggle.services',
    GET_SETTING_VALUE = 'get.setting.value',
    SET_SETTING_VALUE = 'set.setting.value',
    GET_USERNAME = 'get.username',
    UPDATE_MARKETING_CONSENT = 'update.marketing.consent',
    GET_SELECTED_LOCATION = 'get.selected.location',
    CHECK_IS_PREMIUM_TOKEN = 'check.is.premium.token',
    SET_NOTIFICATION_VIEWED = 'set.notification.viewed',
    OPEN_TAB = 'open.tab.action',
    REPORT_BUG = 'post.report.bug',
    OPEN_FORWARDER_URL_WITH_EMAIL = 'open.forwarder.url.with.email',
    ADD_REGULAR_EXCLUSIONS = 'add.regular.exclusions',
    ADD_SELECTIVE_EXCLUSIONS = 'add.selective.exclusions',
    SET_FLAG = 'set.flag',
    GET_GENERAL_EXCLUSIONS = 'get.general.exclusions',
    GET_SELECTIVE_EXCLUSIONS = 'get.selective.exclusions',
    OPEN_FREE_GBS_PAGE = 'open.free.gbs.page',
    GET_BONUSES_DATA = 'get.bonuses.data',
    RESTORE_EXCLUSIONS = 'restore.exclusions',
    ADD_EXCLUSIONS_MAP = 'add.exclusions.map',
    HIDE_RATE_MODAL_AFTER_RATE = 'hide.rate.modal.after.rate',
    HIDE_RATE_MODAL_AFTER_CANCEL = 'hide.rate.modal.after.cancel',
    HIDE_MOBILE_EDGE_PROMO_BANNER = 'hide.mobile.edge.promo.banner',
    HANDLE_CUSTOM_DNS_LINK = 'handle.custom.dns.link',
    ADD_CUSTOM_DNS_SERVER = 'add.custom.dns.server',
    EDIT_CUSTOM_DNS_SERVER = 'edit.custom.dns.server',
    REMOVE_CUSTOM_DNS_SERVER = 'remove.custom.dns.server',
    RESTORE_CUSTOM_DNS_SERVERS_DATA = 'restore.custom.dns.servers.data',
    SET_HINT_POPUP_VIEWED = 'set.hint.popup.viewed',

    GET_LOGS = 'get.logs',
    GET_APP_VERSION = 'get.app.version',

    UPDATE_LISTENERS = 'update.listeners',

    REFRESH_LOCATIONS = 'refresh.locations',

    TELEMETRY_EVENT_SEND_PAGE_VIEW = 'telemetry.event.send.page.view',
    TELEMETRY_EVENT_SEND_CUSTOM = 'telemetry.event.send.custom',
    TELEMETRY_EVENT_REMOVE_OPENED_PAGE = 'telemetry.event.remove.opened.page',

    STATISTICS_GET_BY_RANGE = 'statistics.get.by.range',
    STATISTICS_CLEAR = 'statistics.clear',
    STATISTICS_SET_IS_DISABLED = 'statistics.set.is.disabled',

    SEND_WEB_AUTH_ACTION = 'send.web.auth.action',
    GET_STARTUP_DATA = 'get.startup.data',
}

export const FLAGS_FIELDS = {
    IS_NEW_USER: 'isNewUser',
    SHOW_NEWSLETTER: 'showNewsletter',
    SHOW_ONBOARDING: 'showOnboarding',
    SHOW_UPGRADE_SCREEN: 'showUpgradeScreen',
    SALE_SHOW: 'saleShow',
    SHOULD_SHOW_RATE_MODAL: 'shouldShowRateModal',
};

/**
 * Absolute URL for the consent page.
 */
export const CONSENT_PAGE_URL = '/consent.html';

export type ExclusionsContentMap = {
    [key: string]: string[];
};

export enum SubscriptionType {
    Monthly = 'MONTHLY',
    Yearly = 'YEARLY',
    TwoYears = 'TWO_YEARS',
}

export const CUSTOM_DNS_ANCHOR_NAME = 'custom-dns';

export const ONE_SECOND_MS = 1000;
export const ONE_MINUTE_MS = ONE_SECOND_MS * 60;
export const ONE_HOUR_MS = ONE_MINUTE_MS * 60;
export const ONE_DAY_MS = ONE_HOUR_MS * 24;

export interface GetStartupDataResponse {
    isFirstRun: boolean;
    flagsStorageData: FlagsStorageData;
    marketingConsent: boolean | null;
    isPremiumToken: boolean;
}

type DefaultMessage <T> = {
    type: T;
    data: never;
};

export type AddEventListenerMessage = {
    type: MessageType.ADD_EVENT_LISTENER;
    data: {
        events: NotifierType[]
    };
};

export type GetPopupDataMessage = {
    type: MessageType.GET_POPUP_DATA;
    data: {
        url: string | null;
        numberOfTries: number;
    };
};

export type RemoveEventListenerMessage = {
    type: MessageType.REMOVE_EVENT_LISTENER;
    data: {
        listenerId: string;
    };
};

export type SavedLocationsSaveTabMessage = {
    type: MessageType.SAVED_LOCATIONS_SAVE_TAB;
    data: {
        locationsTab: LocationsTab;
    };
};

export type SavedLocationsAddMessage = {
    type: MessageType.SAVED_LOCATIONS_ADD;
    data: {
        locationId: string;
    };
};

export type SavedLocationsRemoveMessage = {
    type: MessageType.SAVED_LOCATIONS_REMOVE;
    data: {
        locationId: string;
    };
};

export type GetOptionsDataMessage = {
    type: MessageType.GET_OPTIONS_DATA;
    data: {
        isRefresh: boolean;
    };
};

export type SetConsentDataMessage = {
    type: MessageType.SET_CONSENT_DATA;
    data: {
        policyAgreement: boolean;
        helpUsImprove: boolean;
    };
};

export type SetSelectedLocationMessage = {
    type: MessageType.SET_SELECTED_LOCATION;
    data: {
        location: LocationData;
        isSelectedByUser: boolean;
    };
};

export type UpdateAuthCacheMessage = {
    type: MessageType.UPDATE_AUTH_CACHE;
    data: {
        field: AuthCacheKey;
        value: AuthCacheValue;
    };
};

export type EnableProxyMessage = {
    type: MessageType.ENABLE_PROXY;
    data: {
        force: boolean;
    };
};

export type DisableProxyMessage = {
    type: MessageType.DISABLE_PROXY;
    data: {
        force: boolean;
    };
};

export type AddUrlToExclusionsMessage = {
    type: MessageType.ADD_URL_TO_EXCLUSIONS;
    data: {
        url: string;
    };
};

export type DisableVpnByUrlMessage = {
    type: MessageType.DISABLE_VPN_BY_URL;
    data: {
        url: string;
    };
};

export type EnableVpnByUrlMessage = {
    type: MessageType.ENABLE_VPN_BY_URL;
    data: {
        url: string;
    };
};

export type RemoveExclusionMessage = {
    type: MessageType.REMOVE_EXCLUSION;
    data: {
        id: string;
    };
};

export type ToggleExclusionStateMessage = {
    type: MessageType.TOGGLE_EXCLUSION_STATE;
    data: {
        id: string;
    };
};

export type ToggleServicesMessage = {
    type: MessageType.TOGGLE_SERVICES;
    data: {
        ids: string[];
    };
};

export type ResetServiceDataMessage = {
    type: MessageType.RESET_SERVICE_DATA;
    data: {
        serviceId: string;
    };
};

export type SetExclusionsModeMessage = {
    type: MessageType.SET_EXCLUSIONS_MODE;
    data: {
        mode: ExclusionsMode
    };
};

export type AddRegularExclusionsMessage = {
    type: MessageType.ADD_REGULAR_EXCLUSIONS;
    data: {
        exclusions: string[];
    };
};

export type AddSelectiveExclusionsMessage = {
    type: MessageType.ADD_SELECTIVE_EXCLUSIONS;
    data: {
        exclusions: string[];
    };
};

export type AddExclusionsMapMessage = {
    type: MessageType.ADD_EXCLUSIONS_MAP;
    data: {
        exclusionsMap: ExclusionsMap;
    };
};

export type GetSettingValueMessage = {
    type: MessageType.GET_SETTING_VALUE;
    data: {
        settingId: string;
    };
};

export type SetSettingValueMessage = {
    type: MessageType.SET_SETTING_VALUE;
    data: {
        settingId: string;
        value: boolean | string;
    };
};

export type UpdateMarketingConsentMessage = {
    type: MessageType.UPDATE_MARKETING_CONSENT;
    data: {
        newMarketingConsent: boolean;
    };
};

export type SetNotificationViewedMessage = {
    type: MessageType.SET_NOTIFICATION_VIEWED;
    data: {
        withDelay: boolean;
    };
};

export type OpenTabMessage = {
    type: MessageType.OPEN_TAB;
    data: {
        url: string;
    };
};

export type ReportBugMessage = {
    type: MessageType.REPORT_BUG;
    data: {
        email: string;
        message: string;
        includeLog: boolean;
    };
};

export type OpenForwarderUrlWithEmailMessage = {
    type: MessageType.OPEN_FORWARDER_URL_WITH_EMAIL;
    data: {
        forwarderUrlQueryKey: ForwarderUrlQueryKey;
    };
};

export type SetFlagMessage = {
    type: MessageType.SET_FLAG;
    data: {
        key: string;
        value: boolean;
    };
};

export type AddCustomDnsServerMessage = {
    type: MessageType.ADD_CUSTOM_DNS_SERVER;
    data: {
        dnsServerData: DnsServerData;
    };
};

export type HandleCustomDnsLinkMessage = {
    type: MessageType.HANDLE_CUSTOM_DNS_LINK;
    data: {
        name: string | null;
        address: string | null;
    };
};

export type EditCustomDnsServerMessage = {
    type: MessageType.EDIT_CUSTOM_DNS_SERVER;
    data: {
        dnsServerData: DnsServerData;
    };
};

export type RemoveCustomDnsServerMessage = {
    type: MessageType.REMOVE_CUSTOM_DNS_SERVER;
    data: {
        dnsServerId: string;
    };
};

export type SendPageViewTelemetryEventMessage = {
    type: MessageType.TELEMETRY_EVENT_SEND_PAGE_VIEW;
    data: {
        screenName: TelemetryScreenName,
        pageId: string,
    };
};

export type SendCustomTelemetryEventMessage = {
    type: MessageType.TELEMETRY_EVENT_SEND_CUSTOM;
    data: {
        actionName: TelemetryActionName;
        screenName: TelemetryActionToScreenMap[TelemetryActionName];
        label?: string;
        experiment?: string;
    };
};

export type TelemetryRemoveOpenedPageMessage = {
    type: MessageType.TELEMETRY_EVENT_REMOVE_OPENED_PAGE;
    data: {
        pageId: string;
    };
};

export type StatisticsGetByRangeMessage = {
    type: MessageType.STATISTICS_GET_BY_RANGE;
    data: {
        range: StatisticsRange;
    };
};

export type StatisticsSetIsDisabledMessage = {
    type: MessageType.STATISTICS_SET_IS_DISABLED;
    data: {
        isDisabled: boolean;
    };
};

export type SendWebAuthActionMessage = {
    type: MessageType.SEND_WEB_AUTH_ACTION;
    data: {
        action: WebAuthAction;
    };
};

export type AddLongLivedConnectionMessage = {
    type: MessageType.ADD_LONG_LIVED_CONNECTION;
    data: {
        events: string | string[];
    };
};

export type NotifyListenersMessage = {
    type: MessageType.NOTIFY_LISTENERS;
    // TODO: AG-47112 fix types for NOTIFY_LISTENERS
    data: any;
};

// Unified message map that includes both message structure and response types
export interface MessageMap {
    [MessageType.ADD_EVENT_LISTENER]: {
        message: AddEventListenerMessage;
        response: string;
    };
    [MessageType.GET_POPUP_DATA]: {
        message: GetPopupDataMessage;
        // TODO: AG-47016 fix usage of PopupDataRetry
        response: any;
    };
    [MessageType.REMOVE_EVENT_LISTENER]: {
        message: RemoveEventListenerMessage;
        response: void;
    };
    [MessageType.GET_LIMITED_OFFER_DATA]: {
        message: DefaultMessage<MessageType.GET_LIMITED_OFFER_DATA>;
        response: LimitedOfferData | null;
    };
    [MessageType.FORCE_UPDATE_LOCATIONS]: {
        message: DefaultMessage<MessageType.FORCE_UPDATE_LOCATIONS>;
        response: LocationDto[] | null;
    };
    [MessageType.SAVED_LOCATIONS_SAVE_TAB]: {
        message: SavedLocationsSaveTabMessage;
        response: void;
    };
    [MessageType.SAVED_LOCATIONS_ADD]: {
        message: SavedLocationsAddMessage;
        response: void;
    };
    [MessageType.SAVED_LOCATIONS_REMOVE]: {
        message: SavedLocationsRemoveMessage;
        response: void;
    };
    [MessageType.GET_OPTIONS_DATA]: {
        message: GetOptionsDataMessage;
        response: OptionsData;
    };
    [MessageType.GET_CONSENT_DATA]: {
        message: DefaultMessage<MessageType.GET_CONSENT_DATA>;
        response: ConsentDataResponse;
    };
    [MessageType.SET_CONSENT_DATA]: {
        message: SetConsentDataMessage;
        response: void;
    };
    [MessageType.GET_VPN_FAILURE_PAGE]: {
        message: DefaultMessage<MessageType.GET_VPN_FAILURE_PAGE>;
        response: string;
    };
    [MessageType.OPEN_OPTIONS_PAGE]: {
        message: DefaultMessage<MessageType.OPEN_OPTIONS_PAGE>;
        response: void;
    };
    [MessageType.OPEN_FREE_GBS_PAGE]: {
        message: DefaultMessage<MessageType.OPEN_FREE_GBS_PAGE>;
        response: void;
    };
    [MessageType.GET_BONUSES_DATA]: {
        message: DefaultMessage<MessageType.GET_BONUSES_DATA>;
        response: BonusesData;
    };
    [MessageType.SET_SELECTED_LOCATION]: {
        message: SetSelectedLocationMessage;
        response: void;
    };
    [MessageType.DEAUTHENTICATE_USER]: {
        message: DefaultMessage<MessageType.DEAUTHENTICATE_USER>;
        response: void;
    };
    [MessageType.UPDATE_AUTH_CACHE]: {
        message: UpdateAuthCacheMessage;
        response: void;
    };
    [MessageType.GET_CAN_CONTROL_PROXY]: {
        message: DefaultMessage<MessageType.GET_CAN_CONTROL_PROXY>;
        response: CanControlProxy;
    };
    [MessageType.ENABLE_PROXY]: {
        message: EnableProxyMessage;
        response: void;
    };
    [MessageType.DISABLE_PROXY]: {
        message: DisableProxyMessage;
        response: void;
    };
    [MessageType.ADD_URL_TO_EXCLUSIONS]: {
        message: AddUrlToExclusionsMessage;
        response: number;
    };
    [MessageType.DISABLE_VPN_BY_URL]: {
        message: DisableVpnByUrlMessage;
        response: void;
    };
    [MessageType.ENABLE_VPN_BY_URL]: {
        message: EnableVpnByUrlMessage;
        response: void;
    };
    [MessageType.REMOVE_EXCLUSION]: {
        message: RemoveExclusionMessage;
        response: number;
    };
    [MessageType.TOGGLE_EXCLUSION_STATE]: {
        message: ToggleExclusionStateMessage;
        response: void;
    };
    [MessageType.TOGGLE_SERVICES]: {
        message: ToggleServicesMessage;
        response: ToggleServicesResult;
    };
    [MessageType.RESET_SERVICE_DATA]: {
        message: ResetServiceDataMessage;
        response: void;
    };
    [MessageType.CLEAR_EXCLUSIONS_LIST]: {
        message: DefaultMessage<MessageType.CLEAR_EXCLUSIONS_LIST>;
        response: void;
    };
    [MessageType.DISABLE_OTHER_EXTENSIONS]: {
        message: DefaultMessage<MessageType.DISABLE_OTHER_EXTENSIONS>;
        response: void;
    };
    [MessageType.IS_AUTHENTICATED]: {
        message: DefaultMessage<MessageType.IS_AUTHENTICATED>;
        response: boolean;
    };
    [MessageType.CLEAR_PERMISSIONS_ERROR]: {
        message: DefaultMessage<MessageType.CLEAR_PERMISSIONS_ERROR>;
        response: void;
    };
    [MessageType.CHECK_PERMISSIONS]: {
        message: DefaultMessage<MessageType.CHECK_PERMISSIONS>;
        response: void;
    };
    [MessageType.GET_EXCLUSIONS_DATA]: {
        message: DefaultMessage<MessageType.GET_EXCLUSIONS_DATA>;
        response: GetExclusionsDataResponse;
    };
    [MessageType.SET_EXCLUSIONS_MODE]: {
        message: SetExclusionsModeMessage;
        response: void;
    };
    [MessageType.ADD_REGULAR_EXCLUSIONS]: {
        message: AddRegularExclusionsMessage;
        response: number;
    };
    [MessageType.ADD_SELECTIVE_EXCLUSIONS]: {
        message: AddSelectiveExclusionsMessage;
        response: number;
    };
    [MessageType.ADD_EXCLUSIONS_MAP]: {
        message: AddExclusionsMapMessage;
        response: number;
    };
    [MessageType.GET_SELECTED_LOCATION]: {
        message: DefaultMessage<MessageType.GET_SELECTED_LOCATION>;
        response: LocationDto | null;
    };
    [MessageType.GET_EXCLUSIONS_INVERTED]: {
        message: DefaultMessage<MessageType.GET_EXCLUSIONS_INVERTED>;
        response: boolean;
    };
    [MessageType.GET_SETTING_VALUE]: {
        message: GetSettingValueMessage;
        // TODO: Add type when getSetting will have it.
        response: any;
    };
    [MessageType.SET_SETTING_VALUE]: {
        message: SetSettingValueMessage;
        response: boolean;
    };
    [MessageType.GET_USERNAME]: {
        message: DefaultMessage<MessageType.GET_USERNAME>;
        response: string | null;
    };
    [MessageType.UPDATE_MARKETING_CONSENT]: {
        message: UpdateMarketingConsentMessage;
        response: void;
    };
    [MessageType.CHECK_IS_PREMIUM_TOKEN]: {
        message: DefaultMessage<MessageType.CHECK_IS_PREMIUM_TOKEN>;
        response: boolean;
    };
    [MessageType.SET_NOTIFICATION_VIEWED]: {
        message: SetNotificationViewedMessage;
        response: void;
    };
    [MessageType.OPEN_TAB]: {
        message: OpenTabMessage;
        response: browser.Tabs.Tab;
    };
    [MessageType.REPORT_BUG]: {
        message: ReportBugMessage;
        response: RequestSupportResponse | undefined;
    };
    [MessageType.OPEN_FORWARDER_URL_WITH_EMAIL]: {
        message: OpenForwarderUrlWithEmailMessage;
        response: void;
    };
    [MessageType.SET_FLAG]: {
        message: SetFlagMessage;
        response: void;
    };
    [MessageType.HIDE_RATE_MODAL_AFTER_CANCEL]: {
        message: DefaultMessage<MessageType.HIDE_RATE_MODAL_AFTER_CANCEL>;
        response: void;
    };
    [MessageType.HIDE_RATE_MODAL_AFTER_RATE]: {
        message: DefaultMessage<MessageType.HIDE_RATE_MODAL_AFTER_RATE>;
        response: void;
    };
    [MessageType.HIDE_MOBILE_EDGE_PROMO_BANNER]: {
        message: DefaultMessage<MessageType.HIDE_MOBILE_EDGE_PROMO_BANNER>;
        response: void;
    };
    [MessageType.GET_GENERAL_EXCLUSIONS]: {
        message: DefaultMessage<MessageType.GET_GENERAL_EXCLUSIONS>;
        response: string;
    };
    [MessageType.GET_SELECTIVE_EXCLUSIONS]: {
        message: DefaultMessage<MessageType.GET_SELECTIVE_EXCLUSIONS>;
        response: string;
    };
    [MessageType.RESTORE_EXCLUSIONS]: {
        message: DefaultMessage<MessageType.RESTORE_EXCLUSIONS>;
        response: void;
    };
    [MessageType.ADD_CUSTOM_DNS_SERVER]: {
        message: AddCustomDnsServerMessage;
        response: void;
    };
    [MessageType.HANDLE_CUSTOM_DNS_LINK]: {
        message: HandleCustomDnsLinkMessage;
        response: null;
    };
    [MessageType.EDIT_CUSTOM_DNS_SERVER]: {
        message: EditCustomDnsServerMessage;
        response: DnsServerData[];
    };
    [MessageType.REMOVE_CUSTOM_DNS_SERVER]: {
        message: RemoveCustomDnsServerMessage;
        response: void;
    };
    [MessageType.RESTORE_CUSTOM_DNS_SERVERS_DATA]: {
        message: DefaultMessage<MessageType.RESTORE_CUSTOM_DNS_SERVERS_DATA>;
        response: DnsServerData[];
    };
    [MessageType.GET_LOGS]: {
        message: DefaultMessage<MessageType.GET_LOGS>;
        response: string;
    };
    [MessageType.GET_APP_VERSION]: {
        message: DefaultMessage<MessageType.GET_APP_VERSION>;
        response: string;
    };
    [MessageType.SET_HINT_POPUP_VIEWED]: {
        message: DefaultMessage<MessageType.SET_HINT_POPUP_VIEWED>;
        response: void;
    };
    [MessageType.REFRESH_LOCATIONS]: {
        message: DefaultMessage<MessageType.REFRESH_LOCATIONS>;
        response: void;
    };
    [MessageType.TELEMETRY_EVENT_SEND_PAGE_VIEW]: {
        message: SendPageViewTelemetryEventMessage;
        response: void;
    };
    [MessageType.TELEMETRY_EVENT_SEND_CUSTOM]: {
        message: SendCustomTelemetryEventMessage;
        response: void;
    };
    [MessageType.TELEMETRY_EVENT_REMOVE_OPENED_PAGE]: {
        message: TelemetryRemoveOpenedPageMessage;
        response: void;
    };
    [MessageType.STATISTICS_GET_BY_RANGE]: {
        message: StatisticsGetByRangeMessage;
        response: StatisticsByRange;
    };
    [MessageType.STATISTICS_CLEAR]: {
        message: DefaultMessage<MessageType.STATISTICS_CLEAR>;
        response: void;
    };
    [MessageType.STATISTICS_SET_IS_DISABLED]: {
        message: StatisticsSetIsDisabledMessage;
        response: void;
    };
    [MessageType.SEND_WEB_AUTH_ACTION]: {
        message: SendWebAuthActionMessage;
        response: void;
    };
    [MessageType.NOTIFY_LISTENERS]: {
        message: NotifyListenersMessage;
        response: void;
    }
    [MessageType.ADD_LONG_LIVED_CONNECTION]: {
        message: AddLongLivedConnectionMessage;
        response: void;
    }
    [MessageType.UPDATE_LISTENERS]: {
        message: DefaultMessage<MessageType.UPDATE_LISTENERS>;
        response: void;
    }
    [MessageType.GET_STARTUP_DATA]: {
        message: DefaultMessage<MessageType.GET_STARTUP_DATA>;
        response: GetStartupDataResponse;
    }
}

/**
 * Helper type to check if a given type is a valid message type.
 */
export type ValidMessageTypes = keyof MessageMap;

/**
 * Helper type to extract the response type for a given message type
 */
export type ExtractMessageResponse<T extends ValidMessageTypes> = MessageMap[T]['response'];

/**
 * Helper type to extract the message data type for a given message type.
 */
export type ExtractMessageData<T extends ValidMessageTypes> = MessageMap[T]['message']['data'];

/**
 * All messages that can be sent.
 */
export type Message = MessageMap[ValidMessageTypes]['message'];
