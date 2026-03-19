import * as v from 'valibot';

/**
 * States of connectivity finite state machine.
 */
export enum ConnectivityStateType {
    /**
     * This is the initial state.
     * In this state WS is disconnected and waiting for user to press connect button or
     * extension applies enabled state saved in storage after browser or extension restart.
     */
    Idle = 'idle',

    /**
     * In this state WS is disconnected and waiting for user to press connect button.
     */
    DisconnectedIdle = 'disconnectedIdle',

    /**
     * In this state extension waits delays between reconnection retries.
     * Here user can force WS reconnection to selected location by pressing CONNECT
     * button in UI or choose another location to connect.
     */
    DisconnectedRetrying = 'disconnectedRetrying',

    /**
     * In this state WS is trying to connect after idle state.
     * if connection fails state changes to "DISCONNECTED_RETRYING",
     * otherwise to "CONNECTED" state.
     */
    ConnectingIdle = 'connectingIdle',

    /**
     * In this state WS is trying to connect after disconnected retrying state.
     * if connection fails it returns back to "DISCONNECTED_RETRYING",
     * otherwise to "CONNECTED" state.
     */
    ConnectingRetrying = 'connectingRetrying',

    /**
     * In this state WS is connected and proxy enabled.
     * If an WS error or close event fires, state changes to DISCONNECTED_RETRYING state.
     * If user presses disconnect button, state changes to DISCONNECTED_IDLE state.
     */
    Connected = 'connected',
}

/**
 * Connectivity FSM state schema.
 */
export const connectivityStateScheme = v.enum(ConnectivityStateType);

/**
 * Default connectivity FSM state.
 */
export const CONNECTIVITY_STATE_DEFAULT = ConnectivityStateType.Idle;
