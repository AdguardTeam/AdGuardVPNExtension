import { Machine, interpret } from 'xstate';
import { turnOnProxy, turnOffProxy } from '../switcher';
import notifier from '../../lib/notifier';

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

const actions = {
    turnOnProxy: () => {
        turnOnProxy();
    },
    turnOffProxy: () => {
        turnOffProxy();
    },
};

const connectivityFSM = new Machine({
    id: 'connectivity',
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
                [TRANSITION.WS_CONNECT_RETRY]: STATE.CONNECTING_RETRYING,
                [TRANSITION.CONNECT_BTN_PRESSED]: STATE.CONNECTING_RETRYING,
            },
        },
        [STATE.CONNECTING_IDLE]: {
            entry: ['turnOnProxy'],
            on: {
                [TRANSITION.CONNECTION_SUCCESS]: STATE.CONNECTED,
                [TRANSITION.CONNECTION_FAIL]: STATE.DISCONNECTED_RETRYING,
            },
        },
        [STATE.CONNECTING_RETRYING]: {
            entry: ['turnOnProxy'],
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
            exit: ['turnOffProxy'],
        },
    },
}, { actions });

export const connectivityService = interpret(connectivityFSM)
    .start()
    .onEvent((event) => console.log(event))
    .onTransition((state) => {
        console.log(state);
        notifier.notifyListeners(notifier.types.CONNECTIVITY_STATE_CHANGED, { value: state.value });
    });

connectivityService.start();
