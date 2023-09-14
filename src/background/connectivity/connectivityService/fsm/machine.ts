import { createMachine, interpret } from 'xstate';

import { ConnectivityContext, ConnectivityStateType } from '../../../schema/connectivity';
import { ConnectivityEvent, ConnectivityEventType } from './events';
import { connectivityDelays, ConnectivityDelayType } from './delays';
import { connectivityActions, ConnectivityActionType } from './actions';

type ConnectivityState = {
    value: ConnectivityStateType,
    context: ConnectivityContext,
};

const FSM_ID = 'connectivity';

/**
 * Creates new connectivity FSM with passed {@link context}
 *
 * @param context - FSM context
 * @returns FSM used to manage connectivity states
 */
export function createConnectivityMachine(context: ConnectivityContext) {
    return createMachine<ConnectivityContext, ConnectivityEvent, ConnectivityState>({
        id: FSM_ID,
        predictableActionArguments: true,
        context,
        states: {
            [ConnectivityStateType.Idle]: {
                on: {
                    [ConnectivityEventType.ConnectBtnPressed]: ConnectivityStateType.ConnectingIdle,
                    [ConnectivityEventType.ExtensionLaunched]: ConnectivityStateType.ConnectingIdle,
                    [ConnectivityEventType.DesktopVpnEnabled]: {
                        actions: [ConnectivityActionType.SetDesktopVpnEnabled],
                    },
                },
            },
            [ConnectivityStateType.DisconnectedIdle]: {
                entry: [ConnectivityActionType.TurnOffProxy],
                on: {
                    [ConnectivityEventType.ConnectBtnPressed]: ConnectivityStateType.ConnectingIdle,
                    [ConnectivityEventType.DesktopVpnEnabled]: {
                        actions: [ConnectivityActionType.SetDesktopVpnEnabled],
                    },
                },
            },
            [ConnectivityStateType.DisconnectedRetrying]: {
                entry: [ConnectivityActionType.IncrementDelay],
                on: {
                    [ConnectivityEventType.ConnectBtnPressed]: ConnectivityStateType.ConnectingRetrying,
                    [ConnectivityEventType.NetworkOnline]: ConnectivityStateType.ConnectingRetrying,
                    // this event can occur when user signs out,
                    // so we have to stop trying to connect to WS
                    [ConnectivityEventType.DisconnectBtnPressed]: ConnectivityStateType.DisconnectedIdle,
                    // this event fires when user has too many devises connected
                    [ConnectivityEventType.TooManyDevicesConnected]: ConnectivityStateType.DisconnectedIdle,
                    // if vpn enabled in desktop app
                    [ConnectivityEventType.DesktopVpnEnabled]: {
                        target: ConnectivityStateType.DisconnectedIdle,
                        actions: [ConnectivityActionType.SetDesktopVpnEnabled],
                    },
                },
                after: {
                    [ConnectivityDelayType.RetryDelay]: ConnectivityStateType.ConnectingRetrying,
                },
            },
            [ConnectivityStateType.ConnectingIdle]: {
                entry: [ConnectivityActionType.TurnOnProxy],
                on: {
                    [ConnectivityEventType.ConnectionSuccess]: ConnectivityStateType.Connected,
                    [ConnectivityEventType.ConnectionFail]: ConnectivityStateType.DisconnectedRetrying,
                    // If ws connection didn't get handshake response
                    [ConnectivityEventType.WsClose]: ConnectivityStateType.DisconnectedRetrying,
                    [ConnectivityEventType.WsError]: ConnectivityStateType.DisconnectedRetrying,
                    [ConnectivityEventType.ProxyConnectionError]: ConnectivityStateType.DisconnectedIdle,
                    // if user decided to connect to another location
                    [ConnectivityEventType.DisconnectBtnPressed]: ConnectivityStateType.DisconnectedIdle,
                    // if user has too many devises connected
                    [ConnectivityEventType.TooManyDevicesConnected]: ConnectivityStateType.DisconnectedIdle,
                    // if vpn enabled in desktop app
                    [ConnectivityEventType.DesktopVpnEnabled]: {
                        target: ConnectivityStateType.DisconnectedIdle,
                        actions: [ConnectivityActionType.SetDesktopVpnEnabled],
                    },
                },
            },
            [ConnectivityStateType.ConnectingRetrying]: {
                entry: [
                    ConnectivityActionType.IncrementRetryCount,
                    ConnectivityActionType.RetryConnection,
                    ConnectivityActionType.SetTimeSinceLastRetryWithRefreshMs,
                ],
                on: {
                    [ConnectivityEventType.ConnectionSuccess]: ConnectivityStateType.Connected,
                    [ConnectivityEventType.ConnectionFail]: ConnectivityStateType.DisconnectedRetrying,
                    [ConnectivityEventType.WsClose]: ConnectivityStateType.DisconnectedRetrying,
                    [ConnectivityEventType.WsError]: ConnectivityStateType.DisconnectedRetrying,
                    [ConnectivityEventType.ProxyConnectionError]: ConnectivityStateType.DisconnectedIdle,
                    // if user decided to connect to another location
                    [ConnectivityEventType.DisconnectBtnPressed]: ConnectivityStateType.DisconnectedIdle,
                    // this event fires when user has too many devises connected
                    [ConnectivityEventType.TooManyDevicesConnected]: ConnectivityStateType.DisconnectedIdle,
                    // if vpn enabled in desktop app
                    [ConnectivityEventType.DesktopVpnEnabled]: {
                        target: ConnectivityStateType.DisconnectedIdle,
                        actions: [ConnectivityActionType.SetDesktopVpnEnabled],
                    },
                },
            },
            [ConnectivityStateType.Connected]: {
                entry: [ConnectivityActionType.ResetOnSuccessfulConnection],
                on: {
                    [ConnectivityEventType.WsError]: ConnectivityStateType.DisconnectedRetrying,
                    [ConnectivityEventType.WsClose]: ConnectivityStateType.DisconnectedRetrying,
                    [ConnectivityEventType.DisconnectBtnPressed]: ConnectivityStateType.DisconnectedIdle,
                    // this event fires when user has too many devises connected
                    [ConnectivityEventType.TooManyDevicesConnected]: ConnectivityStateType.DisconnectedIdle,
                    // if vpn enabled in desktop app
                    [ConnectivityEventType.DesktopVpnEnabled]: {
                        target: ConnectivityStateType.DisconnectedIdle,
                        actions: [ConnectivityActionType.SetDesktopVpnEnabled],
                    },
                },
            },
        },
    }, {
        delays: connectivityDelays,
        actions: connectivityActions,
    });
}

/**
 * Creates new interpreter for passed connectivity FSM
 *
 * @param machine Connectivity FSM
 * @returns New interpreter for passed connectivity FSM
 */
export function createConnectivityInterpreter(machine: ReturnType<typeof createConnectivityMachine>) {
    return interpret(machine);
}
