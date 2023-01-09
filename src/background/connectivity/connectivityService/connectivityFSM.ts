import {
    createMachine,
    interpret,
    assign,
    EventObject,
} from 'xstate';

import { notifier } from '../../../lib/notifier';
import { State, Event } from './connectivityConstants';
import { log } from '../../../lib/logger';
// eslint-disable-next-line import/no-cycle
import { switcher } from '../switcher';

interface ConnectivityEvent extends EventObject {
    data?: unknown;
}

type ContextType = {
    retryCount: number;
    timeSinceLastRetryWithRefreshMs: number;
    currentReconnectionDelayMs: number;
    retriedConnectToOtherEndpoint: boolean;
    desktopVpnEnabled: boolean;
};

const MIN_RECONNECTION_DELAY_MS = 1000; // 1 second
const MAX_RECONNECTION_DELAY_MS = 1000 * 60 * 3; // 3 minutes
const RECONNECTION_DELAY_GROW_FACTOR = 1.3;
const RETRY_CONNECTION_TIME_MS = 70000; // 70 seconds

const actions = {
    turnOnProxy: async (): Promise<void> => {
        try {
            await switcher.turnOn();
        } catch (e) {
            log.debug(e);
        }
    },
    turnOffProxy: async (): Promise<void> => {
        try {
            await switcher.turnOff();
        } catch (e) {
            log.debug(e);
        }
    },
    /**
     * After 70 seconds of fruitless reconnection attempts to previously selected endpoint we
     *      1. re-fetch tokens, vpn info and locations list from the backend
     *      2. choose endpoint once again (it's possible that the one that previously failed
     *          is already excluded from the list)
     *      3. retrying connection attempts (probably to another endpoint)

     * Why 70 seconds:
     * There are 2 possible kinds of failures:
     *      1. short term (OOM & restart, deployment of a new version)
     *      2. long term (server dead or brought down intentionally)
     * We don't want our users rambling between endpoints and overloading them when (1) occurs,
     * so we bring in 70 seconds threshold after which we treat the unavailability as (2)
     * and try find another one (backend probably has alternatives in this case).
     */
    retryConnection: async (context: ContextType): Promise<void> => {
        if (context.timeSinceLastRetryWithRefreshMs
            && context.timeSinceLastRetryWithRefreshMs > RETRY_CONNECTION_TIME_MS) {
            // eslint-disable-next-line no-param-reassign
            context.timeSinceLastRetryWithRefreshMs = 0;
            // retry to connect after tokens, VPN info and locations refresh
            await switcher.retryTurnOn(true);
        } else {
            // Retries to connect to ws without cache refresh
            await switcher.retryTurnOn();
        }
    },

    setDesktopVpnEnabled: assign((_ctx, event: ConnectivityEvent) => ({
        desktopVpnEnabled: event.data,
    })),
};

/**
 * Resets context information
 * Description of every property could be found in the context section description
 */
const resetOnSuccessfulConnection = assign({
    currentReconnectionDelayMs: MIN_RECONNECTION_DELAY_MS,
    retryCount: 0,
    retriedConnectToOtherEndpoint: false,
    timeSinceLastRetryWithRefreshMs: 0,
    desktopVpnEnabled: false,
});

/**
 * Action, which increments count of connection retries and time passed since first retry
 */
const incrementRetryCount = assign<ContextType>({
    retryCount: (context: ContextType): number => {
        return context.retryCount + 1;
    },

    timeSinceLastRetryWithRefreshMs: (context: ContextType): number => {
        return context.timeSinceLastRetryWithRefreshMs + context.currentReconnectionDelayMs;
    },
});

/**
 * Action, which increases delay between reconnection
 */
const incrementDelay = assign<ContextType>({
    currentReconnectionDelayMs: (context: ContextType): number => {
        let delayMs = context.currentReconnectionDelayMs * RECONNECTION_DELAY_GROW_FACTOR;
        if (delayMs > MAX_RECONNECTION_DELAY_MS) {
            delayMs = MAX_RECONNECTION_DELAY_MS;
        }
        return delayMs;
    },
});

const delays = {
    RETRY_DELAY: (context: ContextType): number => {
        return context.currentReconnectionDelayMs;
    },
};

/**
 * Finite state machine used to manage websocket connectivity states
 * Transitions react only to the described events, all other events are ignored
 */
const connectivityFSM = createMachine({
    id: 'connectivity',
    predictableActionArguments: true,
    context: {
        /**
         * Count of connections retries
         */
        retryCount: 0,
        /**
         * Time in ms passed since last retry with tokens and locations list refresh
         */
        timeSinceLastRetryWithRefreshMs: 0,
        /**
         * Property used to keep growing delay between reconnections
         */
        currentReconnectionDelayMs: MIN_RECONNECTION_DELAY_MS,
        /**
         * Flag used to reconnect to another endpoint of current location
         */
        retriedConnectToOtherEndpoint: false,
        /**
         * Flag used to keep actual desktop vpn connection status
         */
        desktopVpnEnabled: false,

    },
    initial: State.DisconnectedIdle,
    states: {
        [State.DisconnectedIdle]: {
            entry: ['turnOffProxy'],
            on: {
                [Event.ConnectBtnPressed]: State.ConnectingIdle,
                [Event.ExtensionLaunched]: State.ConnectingIdle,
                [Event.DesktopVpnEnabled]: {
                    actions: ['setDesktopVpnEnabled'],
                },
            },
        },
        [State.DisconnectedRetrying]: {
            on: {
                [Event.ConnectBtnPressed]: State.ConnectingRetrying,
                [Event.NetworkOnline]: State.ConnectingRetrying,
                // this event can occur when user signs out,
                // so we have to stop trying to connect to WS
                [Event.DisconnectBtnPressed]: State.DisconnectedIdle,
                // this event fires when user has too many devises connected
                [Event.TooManyDevicesConnected]: State.DisconnectedIdle,
                // if vpn enabled in desktop app
                [Event.DesktopVpnEnabled]: {
                    target: State.DisconnectedIdle,
                    actions: ['setDesktopVpnEnabled'],
                },
            },
            after: {
                RETRY_DELAY: State.ConnectingRetrying,
            },
            entry: [incrementDelay],
        },
        [State.ConnectingIdle]: {
            entry: ['turnOnProxy'],
            on: {
                [Event.ConnectionSuccess]: State.Connected,
                [Event.ConnectionFail]: State.DisconnectedRetrying,
                // If ws connection didn't get handshake response
                [Event.WsClose]: State.DisconnectedRetrying,
                [Event.WsError]: State.DisconnectedRetrying,
                [Event.ProxyConnectionError]: State.DisconnectedIdle,
                // if user decided to connect to another location
                [Event.DisconnectBtnPressed]: State.DisconnectedIdle,
                // if user has too many devises connected
                [Event.TooManyDevicesConnected]: State.DisconnectedIdle,
                // if vpn enabled in desktop app
                [Event.DesktopVpnEnabled]: {
                    target: State.DisconnectedIdle,
                    actions: ['setDesktopVpnEnabled'],
                },
            },
        },
        [State.ConnectingRetrying]: {
            entry: [incrementRetryCount, 'retryConnection'],
            on: {
                [Event.ConnectionSuccess]: State.Connected,
                [Event.ConnectionFail]: State.DisconnectedRetrying,
                [Event.WsClose]: State.DisconnectedRetrying,
                [Event.WsError]: State.DisconnectedRetrying,
                [Event.ProxyConnectionError]: State.DisconnectedIdle,
                // if user decided to connect to another location
                [Event.DisconnectBtnPressed]: State.DisconnectedIdle,
                // this event fires when user has too many devises connected
                [Event.TooManyDevicesConnected]: State.DisconnectedIdle,
                // if vpn enabled in desktop app
                [Event.DesktopVpnEnabled]: {
                    target: State.DisconnectedIdle,
                    actions: ['setDesktopVpnEnabled'],
                },
            },
        },
        [State.Connected]: {
            on: {
                [Event.WsError]: State.DisconnectedRetrying,
                [Event.WsClose]: State.DisconnectedRetrying,
                [Event.DisconnectBtnPressed]: State.DisconnectedIdle,
                // this event fires when user has too many devises connected
                [Event.TooManyDevicesConnected]: State.DisconnectedIdle,
                // if vpn enabled in desktop app
                [Event.DesktopVpnEnabled]: {
                    target: State.DisconnectedIdle,
                    actions: ['setDesktopVpnEnabled'],
                },
            },
            entry: [resetOnSuccessfulConnection],
        },
    },
}, { actions, delays });

export const connectivityService = interpret(connectivityFSM)
    .start()
    .onEvent((event: ConnectivityEvent) => {
        log.debug(event);
        if (event.type === Event.DesktopVpnEnabled) {
            notifier.notifyListeners(
                notifier.types.CONNECTIVITY_DESKTOP_VPN_STATUS_CHANGED,
                event.data,
            );
        }
    })
    .onTransition((state) => {
        log.debug({ currentState: state.value });
        notifier.notifyListeners(notifier.types.CONNECTIVITY_STATE_CHANGED, { value: state.value });
    });

connectivityService.start();

export const isVPNConnected = (): boolean => {
    return connectivityService.getSnapshot().matches(State.Connected);
};

export const isVPNDisconnectedIdle = (): boolean => {
    return connectivityService.getSnapshot().matches(State.DisconnectedIdle);
};

export const setDesktopVpnEnabled = (data: boolean): void => {
    connectivityService.send(Event.DesktopVpnEnabled, { data });
};
