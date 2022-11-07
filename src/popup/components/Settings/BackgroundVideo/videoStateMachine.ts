import { createMachine, interpret } from 'xstate';

import { AnimationState, AnimationEvent } from '../../../../lib/constants';

const { log } = console;

export const videoStateMachine = createMachine({
    id: 'videoStateMachine',
    initial: AnimationState.VpnDisabled,
    predictableActionArguments: true,
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

export const videoService = interpret(videoStateMachine)
    .start()
    .onTransition((state) => {
        log(`Background video state: ${state.value}`);
    });
