import { Machine, interpret, assign } from 'xstate';
import { turnOnProxy, turnOffProxy } from '../switcher';
import notifier from '../../lib/notifier';
import endpointConnectivity from './endpointConnectivity';

export const TRANSITION = {
    CONNECT_BTN_PRESSED: 'CONNECT_BTN_PRESSED',
    DISCONNECT_BTN_PRESSED: 'DISCONNECT_BTN_PRESSED',
    CONNECT_SETTINGS_APPLY: 'CONNECT_SETTINGS_APPLY',
    DISCONNECT_SETTINGS_APPLY: 'DISCONNECT_SETTINGS_APPLY',
    WS_CONNECT_RETRY: 'WS_CONNECT_RETRY',
    CONNECTION_SUCCESS: 'CONNECTION_SUCCESS',
    CONNECTION_FAIL: 'CONNECTION_FAIL',
    WS_ERROR: 'WS_ERROR',
    WS_CLOSE: 'WS_CLOSE',
};

export const STATE = {
    DISCONNECTED_IDLE: 'disconnectedIdle',
    DISCONNECTED_RETRYING: 'disconnectedRetrying',
    CONNECTING_IDLE: 'connectingIdle',
    CONNECTING_RETRYING: 'connectingRetrying',
    CONNECTED: 'connected',
};

const minReconnectionDelay = 1000;
const maxReconnectionDelay = 10000;
const reconnectionDelayGrowFactor = 1.3;

// TODO implement connection timeout in this module or in the connectivity
const connectionTimout = 4000;

const actions = {
    turnOnProxy: () => {
        turnOnProxy();
    },
    turnOffProxy: () => {
        turnOffProxy();
    },
    retryConnection: (context, event) => {
        // TODO
        //  after 70 sec, try to get new endpoint from the same location, and connect to it
        //  stop trying to connect after 1 hour
        endpointConnectivity.start();
    },
};

const resetReconnectCounters = assign({
    currentReconnectionDelay: minReconnectionDelay,
    retryCount: 0,
});

const incrementRetryCount = assign({
    retryCount: (context) => {
        return context.retryCount + 1;
    },
});

const incrementDelay = assign({
    currentReconnectionDelay: (context) => {
        let delay = context.currentReconnectionDelay * reconnectionDelayGrowFactor;
        if (delay > maxReconnectionDelay) {
            delay = maxReconnectionDelay;
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
        currentReconnectionDelay: minReconnectionDelay,
    },
    initial: STATE.DISCONNECTED_IDLE,
    states: {
        [STATE.DISCONNECTED_IDLE]: {
            on: {
                [TRANSITION.CONNECT_BTN_PRESSED]: STATE.CONNECTING_IDLE,
                [TRANSITION.CONNECT_SETTINGS_APPLY]: STATE.CONNECTING_IDLE,
            },
        },
        [STATE.DISCONNECTED_RETRYING]: {
            on: {
                [TRANSITION.CONNECT_BTN_PRESSED]: STATE.CONNECTING_RETRYING,
            },
            after: {
                RETRY_DELAY: STATE.CONNECTING_RETRYING,
            },
            entry: [incrementDelay],
        },
        [STATE.CONNECTING_IDLE]: {
            entry: ['turnOnProxy'],
            on: {
                [TRANSITION.CONNECTION_SUCCESS]: STATE.CONNECTED,
                [TRANSITION.CONNECTION_FAIL]: STATE.DISCONNECTED_RETRYING,
                // If ws connection didn't get handshake response
                [TRANSITION.WS_CLOSE]: STATE.DISCONNECTED_RETRYING,
            },
        },
        [STATE.CONNECTING_RETRYING]: {
            entry: [incrementRetryCount, 'retryConnection'],
            on: {
                [TRANSITION.CONNECTION_SUCCESS]: STATE.CONNECTED,
                [TRANSITION.CONNECTION_FAIL]: STATE.DISCONNECTED_RETRYING,
            },
        },
        [STATE.CONNECTED]: {
            on: {
                [TRANSITION.WS_ERROR]: STATE.DISCONNECTED_RETRYING,
                [TRANSITION.WS_CLOSE]: STATE.DISCONNECTED_RETRYING,
                [TRANSITION.DISCONNECT_BTN_PRESSED]: STATE.DISCONNECTED_IDLE,
            },
            entry: [resetReconnectCounters],
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
