/**
 * NOTICE, do not keep here any program logic, because this file is used on popup also.
 */

/**
 * Possible events for connectivity finite state machine.
 */
export enum ConnectivityEventType {
    /**
     * Fires when user presses connect button, or when user connects to another location.
     */
    ConnectBtnPressed = 'connectBtnPressed',

    /**
     * Fires when user presses disconnect button, or when user connects to another location.
     */
    DisconnectBtnPressed = 'disconnectBtnPressed',

    /**
     *  Fires when extension applies settings after browser launched or extension updated.
     *  If earlier the extension was connected to some endpoint - the event forces extension
     *  to reconnect to that endpoint.
     */
    ExtensionLaunched = 'extensionLaunched',

    /**
     * Fires when WS successfully connects to endpoint and applies proxy settings in browser api.
     */
    ConnectionSuccess = 'connectionSuccess',

    /**
     * Fires when proxy can't
     * 1. measure ping to endpoint,
     * 2. send first ping message to WS after connection
     */
    ConnectionFail = 'connectionFail',

    /**
     * Fires on WS error event.
     */
    WsError = 'wsError',

    /**
     * Fires on WS close event. This event can fire when WS connection was closed externally,
     * or by extension on connection timeout.
     */
    WsClose = 'wsClose',

    /**
     * Fires when browser is getting online, then we retry to connect to WS immediately.
     */
    NetworkOnline = 'networkOnline',

    /**
     * Fires when browser is getting offline, then we stop trying to connect
     * Notice this is not used in the extension, but do not delete it.
     */
    NetworkOffline = 'networkOffline',

    /**
     * Fires when we can't set proxy setting in the browser api,
     * because other extension is controlling proxy settings.
     */
    ProxyConnectionError = 'proxyConnectionError',

    /**
     * Fires when too many devices are connected and we should disable connection.
     */
    TooManyDevicesConnected = 'tooManyDevicesConnected',

    /**
     * Fires when vpn enabled in desktop app.
     */
    DesktopVpnEnabled = 'desktopVpnEnabled',
}

/**
 * {@link ConnectivityEventType.ConnectBtnPressed} event object for connectivity FSM.
 */
export type ConnectBtnPressedEvent = {
    type: ConnectivityEventType.ConnectBtnPressed;
};

/**
 * {@link ConnectivityEventType.DisconnectBtnPressed} event object for connectivity FSM.
 */
export type DisconnectBtnPressedEvent = {
    type: ConnectivityEventType.DisconnectBtnPressed;
};

/**
 * {@link ConnectivityEventType.ExtensionLaunched} event object for connectivity FSM.
 */
export type ExtensionLaunchedEvent = {
    type: ConnectivityEventType.ExtensionLaunched;
};

/**
 * {@link ConnectivityEventType.ConnectionSuccess} event object for connectivity FSM.
 */
export type ConnectionSuccessEvent = {
    type: ConnectivityEventType.ConnectionSuccess;
};

/**
 * {@link ConnectivityEventType.ConnectionFail} event object for connectivity FSM.
 */
export type ConnectionFailEvent = {
    type: ConnectivityEventType.ConnectionFail;
};

/**
 * {@link ConnectivityEventType.WsError} event object for connectivity FSM.
 */
export type WsErrorEvent = {
    type: ConnectivityEventType.WsError;
};

/**
 * {@link ConnectivityEventType.WsClose} event object for connectivity FSM.
 */
export type WsCloseEvent = {
    type: ConnectivityEventType.WsClose;
};

/**
 * {@link ConnectivityEventType.NetworkOnline} event object for connectivity FSM.
 */
export type NetworkOnlineEvent = {
    type: ConnectivityEventType.NetworkOnline;
};

/**
 * {@link ConnectivityEventType.NetworkOffline} event object for connectivity FSM.
 */
export type NetworkOfflineEvent = {
    type: ConnectivityEventType.NetworkOffline;
};

/**
 * {@link ConnectivityEventType.ProxyConnectionError} event object for connectivity FSM.
 */
export type ProxyConnectionErrorEvent = {
    type: ConnectivityEventType.ProxyConnectionError;
};

/**
 * {@link ConnectivityEventType.TooManyDevicesConnected} event object for connectivity FSM.
 */
export type TooManyDevicesConnectedEvent = {
    type: ConnectivityEventType.TooManyDevicesConnected;
};

/**
 * {@link ConnectivityEventType.DesktopVpnEnabled} event object for connectivity FSM.
 */
export type DesktopVpnEnabledEvent = {
    type: ConnectivityEventType.DesktopVpnEnabled;
    data: boolean,
};

/**
 * Union type for all possible events for connectivity FSM.
 */
export type ConnectivityEvent =
    | ConnectBtnPressedEvent
    | DisconnectBtnPressedEvent
    | ExtensionLaunchedEvent
    | ConnectionSuccessEvent
    | ConnectionFailEvent
    | WsErrorEvent
    | WsCloseEvent
    | NetworkOnlineEvent
    | NetworkOfflineEvent
    | ProxyConnectionErrorEvent
    | TooManyDevicesConnectedEvent
    | DesktopVpnEnabledEvent;
