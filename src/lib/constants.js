export const SETTINGS_IDS = {
    PROXY_ENABLED: 'proxy.enabled',
    RATE_SHOW: 'rate.show',
    EXCLUSIONS: 'exclusions.list',
    HANDLE_WEBRTC_ENABLED: 'webrtc.handle.enabled',
    SELECTED_DNS_SERVER: 'dns.handle.server',
    CONTEXT_MENU_ENABLED: 'context.menu.enabled',
};

export const MESSAGES_TYPES = {
    ADD_EVENT_LISTENER: 'add.event.listener',
    NOTIFY_LISTENERS: 'notify.listeners',
    REMOVE_EVENT_LISTENER: 'remove.event.listener',

    ADD_LONG_LIVED_CONNECTION: 'add.long.lived.connection',
    AUTHENTICATE_SOCIAL: 'authenticate.social',
    GET_POPUP_DATA: 'get.popup.data',
    GET_VPN_FAILURE_PAGE: 'get.vpn.failure.page',
    OPEN_OPTIONS_PAGE: 'open.options.page',
    SET_SELECTED_LOCATION: 'set.selected.location',
    DEAUTHENTICATE_USER: 'deauthenticate.user',
    AUTHENTICATE_USER: 'authenticate.user',
    UPDATE_AUTH_CACHE: 'update.auth.cache',
    GET_AUTH_CACHE: 'get.auth.cache',
    CLEAR_AUTH_CACHE: 'clear.auth.cache',
    GET_CAN_CONTROL_PROXY: 'get.can.control.proxy',
    ENABLE_PROXY: 'enable.proxy',
    DISABLE_PROXY: 'disable.proxy',
    ADD_TO_EXCLUSIONS: 'add.to.exclusions',
    REMOVE_FROM_EXCLUSIONS: 'remove.from.exclusions',
    GET_IS_EXCLUDED: 'get.is.excluded',
    CHECK_EMAIL: 'check.email',
    DISABLE_OTHER_EXTENSIONS: 'disable.other.extensions',
    REGISTER_USER: 'register.user',
    IS_AUTHENTICATED: 'is.authenticated',
    START_SOCIAL_AUTH: 'start.social.auth',
    CLEAR_PERMISSIONS_ERROR: 'clear.permissions.error',
    CHECK_PERMISSIONS: 'check.permissions',
    GET_EXCLUSIONS_INVERTED: 'get.exclusions.inverted',
    GET_EXCLUSIONS: 'get.exclusions',
    SET_EXCLUSIONS_MODE: 'set.exclusions.mode',
    REMOVE_EXCLUSION_BY_MODE: 'remove.exclusion.by.mode',
    TOGGLE_EXCLUSION_BY_MODE: 'toggle.exclusion.by.mode',
    RENAME_EXCLUSION_BY_MODE: 'rename.exclusion.by.mode',
    ADD_EXCLUSION_BY_MODE: 'add.exclusion.by.mode',
    GET_SETTING_VALUE: 'get.setting.value',
    SET_SETTING_VALUE: 'set.setting.value',
    GET_APP_VERSION: 'get.app.version',
    GET_USERNAME: 'get.username',
    GET_SELECTED_ENDPOINT: 'get.selected.endpoint',
    CHECK_IS_PREMIUM_TOKEN: 'check.is.premium.token',
};

export const ERROR_STATUSES = {
    NETWORK_ERROR: 'network.error',
    INVALID_TOKEN_ERROR: 'invalid.token.error',
    LIMIT_EXCEEDED: 'limit.exceeded.error',
};

// Error text thrown when connection is canceled by user. See issue - AG-2291
export const FORCE_CANCELLED = 'Connection was cancelled by user';

// Ping status for unavailable endpoints
export const NOT_AVAILABLE_STATUS = 'not_available';
