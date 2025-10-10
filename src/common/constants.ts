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

    RECALCULATE_PINGS = 'recalculate.pings',

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
