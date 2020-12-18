import { Machine } from 'xstate';

export const REQUEST_STATES = {
    IDLE: 'idle',
    SENDING: 'sending',
    SUCCESS: 'success',
    ERROR: 'error',
};

export const REQUEST_EVENTS = {
    SEND_REPORT: 'SEND_REPORT',
    CLEAR_ERRORS: 'CLEAR_ERRORS',
    START_AGAIN: 'START_AGAIN',
};

export const requestMachine = Machine({
    id: 'requestMachine',
    initial: REQUEST_STATES.IDLE,
    states: {
        [REQUEST_STATES.IDLE]: {
            on: { [REQUEST_EVENTS.SEND_REPORT]: REQUEST_STATES.SENDING },
        },
        [REQUEST_STATES.SENDING]: {
            invoke: {
                src: 'sendReport',
                onDone: {
                    target: REQUEST_STATES.SUCCESS,
                },
                onError: {
                    target: REQUEST_STATES.ERROR,
                },
            },
        },
        [REQUEST_STATES.SUCCESS]: {
            on: {
                [REQUEST_EVENTS.START_AGAIN]: REQUEST_STATES.IDLE,
            },
        },
        [REQUEST_STATES.ERROR]: {
            on: {
                [REQUEST_EVENTS.SEND_REPORT]: REQUEST_STATES.SENDING,
                [REQUEST_EVENTS.CLEAR_ERRORS]: REQUEST_STATES.IDLE,
            },
        },
    },
});
