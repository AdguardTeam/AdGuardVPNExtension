import { Machine, interpret } from 'xstate';
import { switcher } from '../switcher';
import notifier from '../../lib/notifier';

export const TRANSITION = {
    CONNECT: 'CONNECT',
    WS_CONNECT_RETRY: 'WS_CONNECT_RETRY',
    CONNECTION_SUCCESS: 'CONNECTION_SUCCESS',
    CONNECTION_FAIL: 'CONNECTION_FAIL',
    WS_ERROR: 'WS_ERROR',
    DISCONNECT: 'DISCONNECT',
};

const services = {
    turnOnProxy: () => switcher.turnOn(),
    turnOffProxy: () => switcher.turnOff(),
};

const connectivityFSM = new Machine({
    id: 'connectivity',
    initial: 'disconnectedIdle',
    states: {
        disconnectedIdle: {
            on: {
                CONNECT: 'connectingIdle',
            },
            invoke: {
                src: 'turnOffProxy',
            },
        },
        disconnectedRetrying: {
            on: {
                WS_CONNECT_RETRY: 'connectingRetrying',
                CONNECT: 'connectingRetrying',
            },
        },
        connectingIdle: {
            invoke: {
                src: 'turnOnProxy',
                onDone: {
                    target: 'connected',
                },
                onError: {
                    target: 'disconnectedRetrying',
                },
            },
        },
        connectingRetrying: {
            on: {
                CONNECTION_SUCCESS: 'connected',
                CONNECTION_FAIL: 'disconnectedRetrying',
            },
        },
        connected: {
            on: {
                WS_ERROR: 'disconnectedRetrying',
                DISCONNECT: 'disconnectedIdle',
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
