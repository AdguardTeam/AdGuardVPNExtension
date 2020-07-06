/**
 * NOTICE, do not keep here any program logic, because this file is used on popup also
 */


// TODO remove unused events before merge
/**
 * Possible events for connectivity finite state machine
 */
export const EVENT = {
    CONNECT_BTN_PRESSED: 'CONNECT_BTN_PRESSED',
    DISCONNECT_BTN_PRESSED: 'DISCONNECT_BTN_PRESSED',
    CONNECT_SETTINGS_APPLY: 'CONNECT_SETTINGS_APPLY',
    DISCONNECT_SETTINGS_APPLY: 'DISCONNECT_SETTINGS_APPLY',
    WS_CONNECT_RETRY: 'WS_CONNECT_RETRY',
    CONNECTION_SUCCESS: 'CONNECTION_SUCCESS',
    CONNECTION_FAIL: 'CONNECTION_FAIL',
    WS_ERROR: 'WS_ERROR',
    WS_CLOSE: 'WS_CLOSE',
    NETWORK_ONLINE: 'NETWORK_ONLINE',
};

/**
 * States of connectivity finite state machine
 */
export const STATE = {
    DISCONNECTED_IDLE: 'disconnectedIdle',
    DISCONNECTED_RETRYING: 'disconnectedRetrying',
    CONNECTING_IDLE: 'connectingIdle',
    CONNECTING_RETRYING: 'connectingRetrying',
    CONNECTED: 'connected',
};
