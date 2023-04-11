// TODO: use internal axios fetch adapter after they release it instead of @vespaiach/axios-fetch-adapter
// https://github.com/axios/axios/pull/5146
import fetchAdapter from '@vespaiach/axios-fetch-adapter';

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
};

export const enum AppearanceTheme {
    System = 'System',
    Dark = 'Dark',
    Light = 'Light',
}

export const enum QuickConnectSetting {
    LastUsedLocation = 'lastUsedLocation',
    FastestLocation = 'fastestLocation',
}

export const QUICK_CONNECT_SETTING_DEFAULT = QuickConnectSetting.LastUsedLocation;

export const THEME_URL_PARAMETER = 'theme';

export const APPEARANCE_THEME_DEFAULT = AppearanceTheme.System;

export enum MessageType {
    ADD_EVENT_LISTENER = 'add.event.listener',
    NOTIFY_LISTENERS = 'notify.listeners',
    REMOVE_EVENT_LISTENER = 'remove.event.listener',

    ADD_LONG_LIVED_CONNECTION = 'add.long.lived.connection',
    AUTHENTICATE_SOCIAL = 'authenticate.social',
    AUTHENTICATE_THANKYOU_PAGE = 'authenticate.thankyou.page',
    GET_POPUP_DATA = 'get.popup.data',
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
    SET_DESKTOP_VPN_ENABLED = 'set.desktop.vpn.enabled',
    OPEN_PREMIUM_PROMO_PAGE = 'open.premium.promo.page',
    ADD_REGULAR_EXCLUSIONS = 'add.regular.exclusions',
    ADD_SELECTIVE_EXCLUSIONS = 'add.selective.exclusions',
    SET_FLAG = 'set.flag',
    GET_GENERAL_EXCLUSIONS = 'get.general.exclusions',
    GET_SELECTIVE_EXCLUSIONS = 'get.selective.exclusions',
    OPEN_FREE_GBS_PAGE = 'open.free.gbs.page',
    GET_REFERRAL_DATA = 'get.referral.data',
    GET_BONUSES_DATA = 'get.bonuses.data',
    RESTORE_EXCLUSIONS = 'restore.exclusions',
    ADD_EXCLUSIONS_MAP = 'add.exclusions.map',
    SET_RATE_MODAL_VIEWED = 'set.rate.modal.viewed',
    ADD_CUSTOM_DNS_SERVER = 'add.custom.dns.server',
    EDIT_CUSTOM_DNS_SERVER = 'edit.custom.dns.server',
    REMOVE_CUSTOM_DNS_SERVER = 'remove.custom.dns.server',
    RESEND_CONFIRM_REGISTRATION_LINK = 'resend.confirm.registration.link',
    RESTORE_CUSTOM_DNS_SERVERS_DATA = 'restore.custom.dns.servers.data',

    GET_LOGS = 'get.logs',
    GET_APP_VERSION = 'get.app.version',
}

export const ERROR_STATUSES = {
    NETWORK_ERROR: 'network.error',
    INVALID_TOKEN_ERROR: 'invalid.token.error',
};

// Error text thrown when connection is canceled by user. See issue - AG-2291
export const FORCE_CANCELLED = 'Connection was cancelled by user';

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

export const FREE_GBS_ANCHOR = 'free-gbs';

export const enum AnimationState {
    // Initial state
    VpnDisabledIdle = 'vpnDisabledIdle',
    VpnEnabled = 'vpnEnabled',
    VpnDisabled = 'vpnDisabled',
    VpnConnecting = 'vpnConnecting',
    VpnDisconnecting = 'vpnDisconnecting',
    // on location switch we do not show animation
    VpnSwitchingLocation = 'vpnSwitchingLocation',
}

export const enum AnimationEvent {
    VpnConnected = 'vpnConnected',
    VpnDisconnected = 'vpnDisconnected',
    AnimationEnded = 'animationEnded',
    LocationSelected = 'locationSelected',
    VpnDisconnectedRetrying = 'vpnDisconnectedRetrying',
    ExclusionScreenDisplayed = 'exclusionScreenDisplayed',
}

const MOTION_FOLDER_PATH = '../../../assets/motion/';

type AnimationSourcesMap = {
    [key: string]: {
        [key: string]: string;
    }
};

export type ExclusionsContentMap = {
    [key: string]: string[];
};

export const animationSourcesMap: AnimationSourcesMap = {
    [AppearanceTheme.Light]: {
        [AnimationState.VpnEnabled]: `${MOTION_FOLDER_PATH}on-light.webm`,
        // Added this state for the case when switching location
        [AnimationState.VpnSwitchingLocation]: '',
        [AnimationState.VpnDisabled]: `${MOTION_FOLDER_PATH}off-light.webm`,
        [AnimationState.VpnDisabledIdle]: `${MOTION_FOLDER_PATH}off-light.webm`,
        [AnimationState.VpnConnecting]: `${MOTION_FOLDER_PATH}switch-on-light.webm`,
        [AnimationState.VpnDisconnecting]: `${MOTION_FOLDER_PATH}switch-off-light.webm`,
    },
    [AppearanceTheme.Dark]: {
        [AnimationState.VpnEnabled]: `${MOTION_FOLDER_PATH}on-dark.webm`,
        // Added this state for the case when switching location
        [AnimationState.VpnSwitchingLocation]: '',
        [AnimationState.VpnDisabled]: `${MOTION_FOLDER_PATH}off-dark.webm`,
        [AnimationState.VpnDisabledIdle]: `${MOTION_FOLDER_PATH}off-dark.webm`,
        [AnimationState.VpnConnecting]: `${MOTION_FOLDER_PATH}switch-on-dark.webm`,
        [AnimationState.VpnDisconnecting]: `${MOTION_FOLDER_PATH}switch-off-dark.webm`,
    },
};

export enum SubscriptionType {
    Monthly = 'MONTHLY',
    Yearly = 'YEARLY',
    TwoYears = 'TWO_YEARS',
}

export const fetchConfig = {
    adapter: fetchAdapter,
};
