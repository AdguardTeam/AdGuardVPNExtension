import { createMachine, interpret } from 'xstate';

import { AnimationState, AnimationEvent } from '../../../../lib/constants';

const animationStateMachine = createMachine({
    id: 'animationStateMachine',
    initial: AnimationState.VpnDisabledIdle,
    predictableActionArguments: true,
    states: {
        [AnimationState.VpnDisabledIdle]: {
            on: {
                // used to set initial state without connecting state
                [AnimationEvent.VpnConnected]: AnimationState.VpnEnabled,
                [AnimationEvent.VpnDisconnected]: AnimationState.VpnDisabled,
            },
        },
        [AnimationState.VpnDisabled]: {
            on: {
                [AnimationEvent.VpnConnected]: AnimationState.VpnConnecting,
            },
        },
        [AnimationState.VpnEnabled]: {
            on: {
                [AnimationEvent.VpnDisconnected]: AnimationState.VpnDisconnecting,
                [AnimationEvent.LocationSelected]: AnimationState.VpnSwitchingLocation,
                [AnimationEvent.ExclusionScreen]: AnimationState.VpnDisabled,
            },
        },
        [AnimationState.VpnDisconnecting]: {
            on: {
                [AnimationEvent.VpnConnected]: AnimationState.VpnConnecting,
                [AnimationEvent.AnimationEnded]: AnimationState.VpnDisabled,
            },
        },
        [AnimationState.VpnConnecting]: {
            on: {
                [AnimationEvent.VpnDisconnected]: AnimationState.VpnDisconnecting,
                [AnimationEvent.AnimationEnded]: AnimationState.VpnEnabled,
                [AnimationEvent.LocationSelected]: AnimationState.VpnSwitchingLocation,
            },
        },
        [AnimationState.VpnSwitchingLocation]: {
            on: {
                [AnimationEvent.VpnConnected]: AnimationState.VpnEnabled,
                [AnimationEvent.VpnDisconnectedRetrying]: AnimationState.VpnDisabled,
            },
        },
    },
});

export const animationService = interpret(animationStateMachine).start();
