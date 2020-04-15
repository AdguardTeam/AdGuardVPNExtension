export const SETTINGS_IDS = {
    PROXY_ENABLED: 'proxy.enabled',
    RATE_SHOW: 'rate.show',
    EXCLUSIONS: 'exclusions.list',
    HANDLE_WEBRTC_ENABLED: 'webrtc.handle.enabled',
    SELECTED_DNS_SERVER: 'dns.handle.server',
    CONTEXT_MENU_ENABLED: 'context.menu.enabled',
};

export const MESSAGES_TYPES = {
    ENDPOINTS_UPDATED: 'endpoints.updated',
    ENDPOINTS_PING_UPDATED: 'endpoints.ping.updated',
    CURRENT_ENDPOINT_UPDATED: 'proxy.current.endpoint.updated',
    VPN_TOKEN_NOT_FOUND: 'vpn.token.not.found',
    VPN_INFO_UPDATED: 'vpn.info.updated',
    AUTHENTICATE_SOCIAL: 'authenticate.social',
    AUTHENTICATE_SOCIAL_SUCCESS: 'authenticate.social.success',
    PERMISSIONS_ERROR_UPDATE: 'permissions.error.update',
    EXCLUSIONS_UPDATED: 'exclusions.updated',
    EXTENSION_PROXY_ENABLED: 'proxy.extension.enabled',
    EXTENSION_PROXY_DISABLED: 'proxy.extension.disabled',

    // popup -> background
    GET_POPUP_DATA: 'get.popup.data',
    GET_VPN_FAILURE_PAGE: 'get.vpn.failure.page',
    OPEN_OPTIONS_PAGE: 'open.options.page',
    SET_CURRENT_ENDPOINT: 'set.current.endpoint',
    GET_APP_ID: 'get.app.id',
    DEAUTHENTICATE_USER: 'deauthenticate.user',
    UPDATE_AUTH_CACHE: 'update.auth.cache',
};

export const ERROR_STATUSES = {
    NETWORK_ERROR: 'network.error',
    INVALID_TOKEN_ERROR: 'invalid.token.error',
    LIMIT_EXCEEDED: 'limit.exceeded.error',
};
