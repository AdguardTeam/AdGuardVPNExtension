import { Machine, interpret, assign } from 'xstate';
import notifier from '../../../lib/notifier';
import { STATE, EVENT } from './connectivityConstants';
import log from '../../../lib/logger';
import {
    turnOnProxy,
    turnOffProxy,
    turnOnProxyRetry,
} from '../switcher';

const minReconnectionDelayMs = 1000;
const maxReconnectionDelayMs = 1000 * 60 * 3; // 3 minutes
const reconnectionDelayGrowFactor = 1.3;
const retryConnectionTimeMs = 70000; // 70 seconds

const actions = {
    turnOnProxy: async () => {
        await turnOnProxy();
    },
    turnOffProxy: async () => {
        await turnOffProxy();
    },
    retryConnection: async (context) => {
        if (context.retryTimeCount > retryConnectionTimeMs
            && !context.retriedConnectToOtherEndpoint) {
            // retry to connect after tokens, VPN info, locations refresh
            await turnOnProxyRetry(true);
            // eslint-disable-next-line no-param-reassign
            context.retriedConnectToOtherEndpoint = true;
        } else {
            // Retries to connect to ws without cache refresh
            await turnOnProxyRetry();
        }
    },
};

const resetOnSuccessfulConnection = assign({
    currentReconnectionDelay: minReconnectionDelayMs,
    retryCount: 0,
    retriedConnectToOtherEndpoint: false,
    retryTimeCount: 0,
});

const incrementRetryCount = assign({
    retryCount: (context) => {
        return context.retryCount + 1;
    },
    retryTimeCount: (context) => {
        return context.retryTimeCount + context.currentReconnectionDelay;
    },
});

const incrementDelay = assign({
    currentReconnectionDelay: (context) => {
        let delay = context.currentReconnectionDelay * reconnectionDelayGrowFactor;
        if (delay > maxReconnectionDelayMs) {
            delay = maxReconnectionDelayMs;
        }
        return delay;
    },
});

const delays = {
    RETRY_DELAY: (context) => {
        return context.currentReconnectionDelay;
    },
};

/**
 * Finite state machine used to manage websocket connectivity states
 * Transitions react only to the described events, all other events are ignored
 */
const connectivityFSM = new Machine({
    id: 'connectivity',
    context: {
        /**
         * Count of connections retries
         */
        retryCount: 0,
        /**
         * Time in ms since reconnections started
         */
        retryTimeCount: 0,
        /**
         * Property used to keep growing delay between reconnections
         */
        currentReconnectionDelay: minReconnectionDelayMs,
        /**
         * Flag used to reconnect to another endpoint of current location
         */
        retriedConnectToOtherEndpoint: false,
    },
    initial: STATE.DISCONNECTED_IDLE,
    states: {
        [STATE.DISCONNECTED_IDLE]: {
            on: {
                [EVENT.CONNECT_BTN_PRESSED]: STATE.CONNECTING_IDLE,
                [EVENT.CONNECT_SETTINGS_APPLY]: STATE.CONNECTING_IDLE,
            },
        },
        [STATE.DISCONNECTED_RETRYING]: {
            on: {
                [EVENT.CONNECT_BTN_PRESSED]: STATE.CONNECTING_RETRYING,
                [EVENT.NETWORK_ONLINE]: STATE.CONNECTING_RETRYING,
            },
            after: {
                RETRY_DELAY: STATE.CONNECTING_RETRYING,
            },
            entry: [incrementDelay],
        },
        [STATE.CONNECTING_IDLE]: {
            entry: ['turnOnProxy'],
            on: {
                [EVENT.CONNECTION_SUCCESS]: STATE.CONNECTED,
                [EVENT.CONNECTION_FAIL]: STATE.DISCONNECTED_RETRYING,
                // If ws connection didn't get handshake response
                [EVENT.WS_CLOSE]: STATE.DISCONNECTED_RETRYING,
                [EVENT.WS_ERROR]: STATE.DISCONNECTED_RETRYING,
                [EVENT.DISCONNECT_TRAFFIC_LIMIT_EXCEEDED]: STATE.DISCONNECTED_IDLE,
            },
        },
        [STATE.CONNECTING_RETRYING]: {
            entry: [incrementRetryCount, 'retryConnection'],
            on: {
                [EVENT.CONNECTION_SUCCESS]: STATE.CONNECTED,
                [EVENT.CONNECTION_FAIL]: STATE.DISCONNECTED_RETRYING,
                [EVENT.WS_CLOSE]: STATE.DISCONNECTED_RETRYING,
                [EVENT.WS_ERROR]: STATE.DISCONNECTED_RETRYING,
                [EVENT.DISCONNECT_TRAFFIC_LIMIT_EXCEEDED]: STATE.DISCONNECTED_IDLE,
            },
        },
        [STATE.CONNECTED]: {
            on: {
                [EVENT.WS_ERROR]: STATE.DISCONNECTED_RETRYING,
                [EVENT.WS_CLOSE]: STATE.DISCONNECTED_RETRYING,
                [EVENT.DISCONNECT_BTN_PRESSED]: STATE.DISCONNECTED_IDLE,
                [EVENT.DISCONNECT_TRAFFIC_LIMIT_EXCEEDED]: STATE.DISCONNECTED_IDLE,
            },
            entry: [resetOnSuccessfulConnection],
            exit: ['turnOffProxy'],
        },
    },
}, { actions, delays });

export const connectivityService = interpret(connectivityFSM)
    .start()
    .onEvent((event) => log.debug(event))
    .onTransition((state) => {
        log.debug({ currentState: state.value });
        notifier.notifyListeners(notifier.types.CONNECTIVITY_STATE_CHANGED, { value: state.value });
    });

connectivityService.start();

export const isVPNConnected = () => {
    return connectivityService.state.matches(STATE.CONNECTED);
};
