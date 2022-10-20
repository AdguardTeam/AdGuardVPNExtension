import { createMachine } from 'xstate';

import { AnimationState, AnimationEvent } from '../../../../lib/constants';

export const getVideoStateMachine = (initialState: AnimationState) => createMachine({
    id: 'videoStateMachine',
    initial: initialState,
    states: {
        [AnimationState.Disconnected]: {
            on: {
                [AnimationEvent.Connected]: {
                    target: AnimationState.SwitchOn,
                },
            },
        },
        [AnimationState.Connected]: {
            on: {
                [AnimationEvent.Disconnected]: {
                    target: AnimationState.SwitchOff,
                },
            },
        },
        [AnimationState.SwitchOff]: {
            on: {
                [AnimationEvent.VideoEnded]: {
                    target: AnimationState.Disconnected,
                },
                [AnimationEvent.Connected]: {
                    target: AnimationState.SwitchOn,
                },
            },
        },
        [AnimationState.SwitchOn]: {
            on: {
                [AnimationEvent.VideoEnded]: {
                    target: AnimationState.Connected,
                },
                [AnimationEvent.Disconnected]: {
                    target: AnimationState.SwitchOff,
                },
            },
        },
    },
});
