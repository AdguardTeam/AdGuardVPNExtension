/**
 * NOTICE, do not keep here any program logic, because this file is used on popup also
 */

/**
 * Possible events for connectivity finite state machine
 */
export const EVENT = {
    /**
     * Fires when user presses connect button, or when user connects to another location
     */
    CONNECT_BTN_PRESSED: 'CONNECT_BTN_PRESSED',

    /**
     * Fires when user presses disconnect button, or when user connects to another location
     */
    DISCONNECT_BTN_PRESSED: 'DISCONNECT_BTN_PRESSED',

    /**
     *  Fires when extension applies settings after browser launched or extension updated.
     *  If earlier the extension was connected to some endpoint - the event forces extension
     *  to reconnect to that endpoint.
     */
    EXTENSION_LAUNCHED: 'EXTENSION_LAUNCHED',

    /**
     * Fires when WS successfully connects to endpoint and applies proxy settings in browser api
     */
    CONNECTION_SUCCESS: 'CONNECTION_SUCCESS',

    /**
     * Fires when proxy can't
     * 1. measure ping to endpoint,
     * 2. send first ping message to WS after connection
     */
    CONNECTION_FAIL: 'CONNECTION_FAIL',

    /**
     * Fires on WS error event
     */
    WS_ERROR: 'WS_ERROR',

    /**
     * Fires on WS close event. This event can fire when WS connection was closed externally,
     * or by extension on connection timeout
     */
    WS_CLOSE: 'WS_CLOSE',

    /**
     * Fires when browser is getting online, then we retry to connect to WS immediately
     */
    NETWORK_ONLINE: 'NETWORK_ONLINE',

    /**
     * Fires when browser is getting offline, then we stop trying to connect
     * Notice this is not used in the extension, but do not delete it
     */
    NETWORK_OFFLINE: 'NETWORK_OFFLINE',

    /**
     * Fires when we can't set proxy setting in the browser api,
     * because other extension is controlling proxy settings
     */
    PROXY_CONNECTION_ERROR: 'PROXY_CONNECTION_ERROR',
};

/**
 * States of connectivity finite state machine
 */
export const STATE = {
    /**
     * This is the initial state
     * In this state WS is disconnected and waiting for user to press connect button or
     * extension applies enabled state saved in storage after browser or extension restart
     */
    DISCONNECTED_IDLE: 'disconnectedIdle',

    /**
     * In this state extension waits delays between reconnection retries
     * Here user can force WS reconnection to selected location by pressing CONNECT
     * button in UI or choose another location to connect
     */
    DISCONNECTED_RETRYING: 'disconnectedRetrying',

    /**
     * In this state WS is trying to connect after idle state
     * if connection fails state changes to "DISCONNECTED_RETRYING",
     * otherwise to "CONNECTED" state
     */
    CONNECTING_IDLE: 'connectingIdle',

    /**
     * In this state WS is trying to connect after disconnected retrying state
     * if connection fails it returns back to "DISCONNECTED_RETRYING",
     * otherwise to "CONNECTED" state
     */
    CONNECTING_RETRYING: 'connectingRetrying',

    /**
     * In this state WS is connected and proxy enabled
     * If an WS error or close event fires, state changes to DISCONNECTED_RETRYING state
     * If user presses disconnect button, state changes to DISCONNECTED_IDLE state
     */
    CONNECTED: 'connected',
};

/**
 * Connection shouldn't be faster than specified time, because it causes ugly UI experience
 * @type {number}
 */
export const MIN_CONNECTION_DURATION_MS = 500;
