import { createMachine } from 'xstate';

import { AnimationState, AnimationEvent } from '../../../../lib/constants';

export const getVideoStateMachine = (initialState: AnimationState) => createMachine({
    id: 'videoStateMachine',
    initial: initialState,
    states: {
        [AnimationState.VpnDisabled]: {
            on: {
                [AnimationEvent.VpnConnected]: AnimationState.VpnConnecting,
            },
        },
        [AnimationState.VpnEnabled]: {
            on: {
                [AnimationEvent.VpnDisconnected]: AnimationState.VpnDisconnecting,
            },
        },
        [AnimationState.VpnDisconnecting]: {
            on: {
                [AnimationEvent.AnimationEnded]: AnimationState.VpnDisabled,
                [AnimationEvent.VpnConnected]: AnimationState.VpnConnecting,
            },
        },
        [AnimationState.VpnConnecting]: {
            on: {
                [AnimationEvent.AnimationEnded]: AnimationState.VpnEnabled,
                [AnimationEvent.VpnDisconnected]: AnimationState.VpnDisconnecting,
            },
        },
    },
});
