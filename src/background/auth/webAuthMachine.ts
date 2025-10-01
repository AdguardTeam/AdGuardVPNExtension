import { createMachine } from 'xstate';

import { WebAuthAction, WebAuthState } from './webAuthEnums';

export const webAuthMachine = createMachine({
    id: 'webAuthMachine',
    initial: WebAuthState.Idle,
    predictableActionArguments: true,
    states: {
        [WebAuthState.Idle]: {
            on: {
                [WebAuthAction.Start]: WebAuthState.Loading,
            },
        },
        [WebAuthState.Loading]: {
            on: {
                [WebAuthAction.Reopen]: WebAuthState.Loading,
                [WebAuthAction.Cancel]: WebAuthState.Idle,
                [WebAuthAction.Fail]: WebAuthState.Failed,
                [WebAuthAction.TabModified]: WebAuthState.FailedByUser,
                [WebAuthAction.Succeed]: WebAuthState.Idle,
            },
        },
        [WebAuthState.Failed]: {
            on: {
                [WebAuthAction.DismissFailure]: WebAuthState.Opened,
            },
        },
        [WebAuthState.FailedByUser]: {
            on: {
                [WebAuthAction.DismissFailure]: WebAuthState.Opened,
            },
        },
        [WebAuthState.Opened]: {
            on: {
                [WebAuthAction.Reopen]: WebAuthState.Loading,
                [WebAuthAction.Cancel]: WebAuthState.Idle,
            },
        },
    },
});
