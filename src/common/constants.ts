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
    AUTHENTICATE_SOCIAL = 'authenticate.social',
    AUTHENTICATE_THANKYOU_PAGE = 'authenticate.thankyou.page',
    GET_POPUP_DATA = 'get.popup.data',
    GET_LIMITED_OFFER_DATA = 'get.limited.offer.data',
    FORCE_UPDATE_LOCATIONS = 'force.update.locations',
    GET_OPTIONS_DATA = 'get.options.data',
    GET_VPN_FAILURE_PAGE = 'get.vpn.failure.page',
    OPEN_OPTIONS_PAGE = 'open.options.page',
    SET_SELECTED_LOCATION = 'set.selected.location',
    DEAUTHENTICATE_USER = 'deauthenticate.user',
    AUTHENTICATE_USER = 'authenticate.user',
    UPDATE_AUTH_CACHE = 'update.auth.cache',
    GET_AUTH_CACHE = 'get.auth.cache',
    CLEAR_AUTH_CACHE = 'clear.auth.cache',
    GET_CAN_CONTROL_PROXY = 'get.can.control.proxy',
    ENABLE_PROXY = 'enable.proxy',
    DISABLE_PROXY = 'disable.proxy',
    ADD_URL_TO_EXCLUSIONS = 'add.to.exclusions',
    REMOVE_EXCLUSION = 'remove.exclusion',
    DISABLE_VPN_BY_URL = 'disable.vpn.by.url',
    ENABLE_VPN_BY_URL = 'enable.vpn.by.url',
    CHECK_EMAIL = 'check.email',
    DISABLE_OTHER_EXTENSIONS = 'disable.other.extensions',
    REGISTER_USER = 'register.user',
    IS_AUTHENTICATED = 'is.authenticated',
    START_SOCIAL_AUTH = 'start.social.auth',
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
    GET_SELECTED_LOCATION = 'get.selected.location',
    CHECK_IS_PREMIUM_TOKEN = 'check.is.premium.token',
    SET_NOTIFICATION_VIEWED = 'set.notification.viewed',
    OPEN_TAB = 'open.tab.action',
    REPORT_BUG = 'post.report.bug',
    OPEN_PREMIUM_PROMO_PAGE = 'open.premium.promo.page',
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
    HANDLE_CUSTOM_DNS_LINK = 'handle.custom.dns.link',
    ADD_CUSTOM_DNS_SERVER = 'add.custom.dns.server',
    EDIT_CUSTOM_DNS_SERVER = 'edit.custom.dns.server',
    REMOVE_CUSTOM_DNS_SERVER = 'remove.custom.dns.server',
    RESEND_CONFIRM_REGISTRATION_LINK = 'resend.confirm.registration.link',
    GET_RESEND_CONFIRM_REGISTRATION_LINK_COUNTDOWN = 'get.resend.confirm.registration.link.countdown',
    SET_EMAIL_CONFIRMATION_AUTH_ID = 'set.email.confirmation.auth.id',
    RESEND_EMAIL_CONFIRMATION_CODE = 'resend.email.confirmation.code',
    GET_RESEND_CODE_COUNTDOWN = 'get.resend.code.countdown',
    RESTORE_CUSTOM_DNS_SERVERS_DATA = 'restore.custom.dns.servers.data',
    SET_HINT_POPUP_VIEWED = 'set.hint.popup.viewed',

    GET_LOGS = 'get.logs',
    GET_APP_VERSION = 'get.app.version',

    UPDATE_LISTENERS = 'update.listeners',

    RECALCULATE_PINGS = 'recalculate.pings',

    TELEMETRY_EVENT_SEND_PAGE_VIEW = 'telemetry.event.send.page.view',
    TELEMETRY_EVENT_SEND_CUSTOM = 'telemetry.event.send.custom',
    TELEMETRY_EVENT_ADD_OPENED_PAGE = 'telemetry.event.add.opened.page',
    TELEMETRY_EVENT_REMOVE_OPENED_PAGE = 'telemetry.event.remove.opened.page',
}

export enum SocialAuthProvider {
    Apple = 'apple',
    Google = 'google',
    Facebook = 'facebook',
}

export const FLAGS_FIELDS = {
    IS_NEW_USER: 'isNewUser',
    IS_SOCIAL_AUTH: 'isSocialAuth',
    SHOW_ONBOARDING: 'showOnboarding',
    SHOW_UPGRADE_SCREEN: 'showUpgradeScreen',
    SALE_SHOW: 'saleShow',
    SHOULD_SHOW_RATE_MODAL: 'shouldShowRateModal',
};

export type ExclusionsContentMap = {
    [key: string]: string[];
};

export enum SubscriptionType {
    Monthly = 'MONTHLY',
    Yearly = 'YEARLY',
    TwoYears = 'TWO_YEARS',
}

export const CUSTOM_DNS_ANCHOR_NAME = 'custom-dns';

export const REQUIRED_2FA_CODE = '2fa_required';
export const REQUIRED_EMAIL_CONFIRMATION_CODE = 'confirmation_code_required';
export const BAD_CREDENTIALS_CODE = 'bad_credentials';

/**
 * Delay in seconds before user can resend email confirmation code.
 */
export const RESEND_EMAIL_CONFIRMATION_CODE_DELAY_SEC = 60;

/**
 * Delay in seconds before user can resend confirmation registration link.
 */
export const RESEND_CONFIRMATION_REGISTRATION_LINK_DELAY_SEC = 60;

export const ONE_SECOND_MS = 1000;
export const ONE_MINUTE_MS = ONE_SECOND_MS * 60;
export const ONE_HOUR_MS = ONE_MINUTE_MS * 60;
export const ONE_DAY_MS = ONE_HOUR_MS * 24;
