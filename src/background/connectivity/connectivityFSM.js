import { Machine, interpret, assign } from 'xstate';
import { turnOnProxy, turnOffProxy } from '../switcher';
import notifier from '../../lib/notifier';
import endpointConnectivity from './endpointConnectivity';

// TODO remove unused events before merge
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

export const STATE = {
    DISCONNECTED_IDLE: 'disconnectedIdle',
    DISCONNECTED_RETRYING: 'disconnectedRetrying',
    CONNECTING_IDLE: 'connectingIdle',
    CONNECTING_RETRYING: 'connectingRetrying',
    CONNECTED: 'connected',
};

const minReconnectionDelayMs = 1000;
const maxReconnectionDelayMs = 1000 * 60 * 3; // 3 minutes
const reconnectionDelayGrowFactor = 1.3;
const retryConnectionTimeMs = 70000; // 70 seconds

const actions = {
    turnOnProxy: () => {
        turnOnProxy();
    },
    turnOffProxy: () => {
        turnOffProxy();
    },
    retryConnection: (context) => {
        if (context.retryTimeCount > retryConnectionTimeMs
            && !context.retriedConnectToOtherEndpoint) {
            // TODO refresh locations, tokens
            turnOnProxy();
            // TODO figure out how to update with assign,
            //  documentation prohibits change of context externally
            context.retriedConnectToOtherEndpoint = true;
        } else {
            endpointConnectivity.start();
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

const connectivityFSM = new Machine({
    id: 'connectivity',
    context: {
        retryCount: 0,
        retryTimeCount: 0,
        currentReconnectionDelay: minReconnectionDelayMs,
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
            },
        },
        [STATE.CONNECTING_RETRYING]: {
            entry: [incrementRetryCount, 'retryConnection'],
            on: {
                [EVENT.CONNECTION_SUCCESS]: STATE.CONNECTED,
                [EVENT.CONNECTION_FAIL]: STATE.DISCONNECTED_RETRYING,
                [EVENT.WS_CLOSE]: STATE.DISCONNECTED_RETRYING,
            },
        },
        [STATE.CONNECTED]: {
            on: {
                [EVENT.WS_ERROR]: STATE.DISCONNECTED_RETRYING,
                [EVENT.WS_CLOSE]: STATE.DISCONNECTED_RETRYING,
                [EVENT.DISCONNECT_BTN_PRESSED]: STATE.DISCONNECTED_IDLE,
            },
            entry: [resetOnSuccessfulConnection],
            exit: ['turnOffProxy'],
        },
    },
}, { actions, delays });

export const connectivityService = interpret(connectivityFSM)
    .start()
    .onEvent((event) => console.log(event))
    .onTransition((state) => {
        console.log({ currentState: state.value });
        console.log(state.context);
        notifier.notifyListeners(notifier.types.CONNECTIVITY_STATE_CHANGED, { value: state.value });
    });

connectivityService.start();

export const isVPNConnected = () => {
    return connectivityService.state.matches(STATE.CONNECTED);
};
