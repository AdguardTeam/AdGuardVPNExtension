import { Machine, interpret } from 'xstate';
import { switcher } from '../switcher';
import notifier from '../../lib/notifier';

export const TRANSITION = {
    CONNECT_BTN_PRESSED: 'CONNECT_BTN_PRESSED',
    DISCONNECT_BTN_PRESSED: 'DISCONNECT_BTN_PRESSED',
    CONNECT_SETTINGS_APPLY: 'CONNECT_SETTINGS_APPLY',
    WS_CONNECT_RETRY: 'WS_CONNECT_RETRY',
    CONNECTION_SUCCESS: 'CONNECTION_SUCCESS',
    CONNECTION_FAIL: 'CONNECTION_FAIL',
    WS_ERROR: 'WS_ERROR',
};

export const STATE = {
    DISCONNECTED_IDLE: 'disconnectedIdle',
    DISCONNECTED_RETRYING: 'disconnectedRetrying',
    CONNECTING_IDLE: 'connectingIdle',
    CONNECTING_RETRYING: 'connectingRetrying',
    CONNECTED: 'connected',
};

// TODO replace services with signals, because switcher do not reflect ws connection anymore
const services = {
    turnOnProxy: () => switcher.turnOn(),
    turnOffProxy: () => switcher.turnOff(),
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
            invoke: {
                src: 'turnOffProxy', // TODO extract services ids into constants
            },
        },
        [STATE.DISCONNECTED_RETRYING]: {
            on: {
                [TRANSITION.WS_CONNECT_RETRY]: STATE.CONNECTING_RETRYING,
                [TRANSITION.CONNECT_BTN_PRESSED]: STATE.CONNECTING_RETRYING,
            },
        },
        [STATE.CONNECTING_IDLE]: {
            invoke: {
                src: 'turnOnProxy',
                onDone: {
                    target: STATE.CONNECTED,
                },
                onError: {
                    target: STATE.DISCONNECTED_RETRYING,
                },
            },
        },
        [STATE.CONNECTING_RETRYING]: {
            invoke: {
                src: 'turnOnProxy',
                onDone: {
                    target: STATE.CONNECTED,
                },
                onError: {
                    target: STATE.DISCONNECTED_RETRYING,
                },
            },
        },
        [STATE.CONNECTED]: {
            on: {
                [TRANSITION.WS_ERROR]: STATE.DISCONNECTED_RETRYING,
                [TRANSITION.DISCONNECT_BTN_PRESSED]: STATE.DISCONNECTED_IDLE,
            },
        },
    },
}, { services });

export const connectivityService = interpret(connectivityFSM)
    .start()
    .onEvent((ev) => console.log(ev)) // TODO remove further
    .onTransition((state) => {
        console.log(state);
        notifier.notifyListeners(notifier.types.CONNECTIVITY_STATE_CHANGED, { value: state.value });
    });

connectivityService.start();
