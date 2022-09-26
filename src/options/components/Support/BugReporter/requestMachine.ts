import { Machine } from 'xstate';

export enum RequestState {
    Idle = 'idle',
    Sending = 'sending',
    Success = 'success',
    Error = 'error',
}

export enum RequestEvent {
    SendReport = 'send.report',
    ClearErrors = 'clear.errors',
    StartAgain = 'start.again',
}

export const requestMachine = Machine({
    id: 'requestMachine',
    initial: RequestState.Idle,
    states: {
        [RequestState.Idle]: {
            on: { [RequestEvent.SendReport]: RequestState.Sending },
        },
        [RequestState.Sending]: {
            invoke: {
                src: 'sendReport',
                onDone: {
                    target: RequestState.Success,
                },
                onError: {
                    target: RequestState.Error,
                },
            },
        },
        [RequestState.Success]: {
            on: {
                [RequestEvent.StartAgain]: RequestState.Idle,
            },
        },
        [RequestState.Error]: {
            on: {
                [RequestEvent.SendReport]: RequestState.Sending,
                [RequestEvent.ClearErrors]: RequestState.Idle,
            },
        },
    },
});
