import { createMachine, interpret } from 'xstate';

import { AnimationEvent, AnimationState } from '../../../constants';

/**
 * Background animation states and transitions.
 *
 * The animation mirrors the VPN state of the current tab: the tunnel state
 * while the tab is routed through the VPN, and the disabled state while the tab
 * is excluded. The machine is exported separately from the service so tests can
 * run it from a clean state.
 */
export const animationStateMachine = createMachine({
    id: 'animationStateMachine',
    initial: AnimationState.VpnDisabledIdle,
    predictableActionArguments: true,
    on: {
        [AnimationEvent.InitEnabled]: AnimationState.VpnEnabled,
        [AnimationEvent.InitDisabled]: AnimationState.VpnDisabled,
    },
    states: {
        [AnimationState.VpnDisabledIdle]: {
            on: {
                // used to set initial state without connecting state
                [AnimationEvent.VpnConnected]: AnimationState.VpnEnabled,
                [AnimationEvent.VpnDisconnected]: AnimationState.VpnDisabled,
                [AnimationEvent.SiteExcluded]: AnimationState.VpnDisabled,
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
                [AnimationEvent.VpnDisconnectedRetrying]: AnimationState.VpnDisconnecting,
                [AnimationEvent.LocationSelected]: AnimationState.VpnSwitchingLocation,
                [AnimationEvent.SiteExcluded]: AnimationState.VpnDisconnecting,
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
                [AnimationEvent.VpnDisconnectedRetrying]: AnimationState.VpnDisconnecting,
                [AnimationEvent.AnimationEnded]: AnimationState.VpnEnabled,
                [AnimationEvent.LocationSelected]: AnimationState.VpnSwitchingLocation,
                [AnimationEvent.SiteExcluded]: AnimationState.VpnDisconnecting,
            },
        },
        [AnimationState.VpnSwitchingLocation]: {
            on: {
                [AnimationEvent.VpnConnected]: AnimationState.VpnEnabled,
                [AnimationEvent.VpnDisconnectedRetrying]: AnimationState.VpnDisabled,
                [AnimationEvent.SiteExcluded]: AnimationState.VpnDisconnecting,
            },
        },
    },
});

export const animationService = interpret(animationStateMachine).start();
