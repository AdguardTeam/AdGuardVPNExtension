import { createMachine, interpret } from 'xstate';

import { AnimationState, AnimationEvent } from '../../../../lib/constants';

const animationStateMachine = createMachine({
    id: 'animationStateMachine',
    initial: AnimationState.Initial,
    predictableActionArguments: true,
    states: {
        [AnimationState.Initial]: {
            on: {
                [AnimationEvent.VpnConnected]: AnimationState.VpnEnabled,
                [AnimationEvent.VpnDisconnected]: AnimationState.VpnDisabled,
            },
        },
        [AnimationState.VpnDisabled]: {
            on: {
                [AnimationEvent.VpnConnected]: AnimationState.VpnConnecting,
                [AnimationEvent.LocationSelected]: AnimationState.VpnDisabled,
            },
        },
        [AnimationState.VpnEnabled]: {
            on: {
                [AnimationEvent.VpnDisconnected]: AnimationState.VpnDisconnecting,
                [AnimationEvent.LocationSelected]: AnimationState.VpnSwitchingLocation,
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
