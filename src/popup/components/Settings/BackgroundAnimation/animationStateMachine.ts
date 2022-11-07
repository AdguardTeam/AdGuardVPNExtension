import { createMachine, interpret } from 'xstate';

import { AnimationState, AnimationEvent } from '../../../../lib/constants';

export const animationStateMachine = createMachine({
    id: 'animationStateMachine',
    initial: AnimationState.VpnDisabled,
    predictableActionArguments: true,
    states: {
        [AnimationState.VpnDisabled]: {
            on: {
                [AnimationEvent.VpnConnected]: AnimationState.VpnConnecting,
                [AnimationEvent.LocationSelected]: AnimationState.VpnDisabled,
            },
        },
        [AnimationState.VpnEnabled]: {
            on: {
                [AnimationEvent.LocationSelected]: AnimationState.VpnSwitchingLocation,
                [AnimationEvent.VpnDisconnected]: AnimationState.VpnDisconnecting,
            },
        },
        [AnimationState.VpnSwitchingLocation]: {
            on: {
                [AnimationEvent.VpnConnected]: AnimationState.VpnEnabled,
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

export const animationService = interpret(animationStateMachine);
