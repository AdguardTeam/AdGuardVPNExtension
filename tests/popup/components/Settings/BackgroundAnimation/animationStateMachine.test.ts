import { describe, it, expect } from 'vitest';

import {
    animationStateMachine,
} from '../../../../../src/popup/components/Settings/BackgroundAnimation/animationStateMachine';
import { AnimationEvent, AnimationState } from '../../../../../src/popup/constants';

/**
 * Resolves the state the machine moves to on the given event.
 *
 * @param state Current animation state.
 * @param event Event to send.
 * @returns Target state value.
 */
const next = (state: AnimationState, event: AnimationEvent): AnimationState => {
    return <AnimationState>animationStateMachine.transition(state, event).value;
};

describe('animationStateMachine', () => {
    describe('tab routing changes', () => {
        it('plays the disconnection animation when the site becomes excluded while enabled', () => {
            expect(next(AnimationState.VpnEnabled, AnimationEvent.SiteExcluded))
                .toBe(AnimationState.VpnDisconnecting);
        });

        it('plays the disconnection animation when the site becomes excluded while connecting', () => {
            expect(next(AnimationState.VpnConnecting, AnimationEvent.SiteExcluded))
                .toBe(AnimationState.VpnDisconnecting);
        });

        it('plays the disconnection animation when the site becomes excluded while switching location', () => {
            expect(next(AnimationState.VpnSwitchingLocation, AnimationEvent.SiteExcluded))
                .toBe(AnimationState.VpnDisconnecting);
        });

        it('keeps playing the disconnection animation when the site becomes excluded while disconnecting', () => {
            expect(next(AnimationState.VpnDisconnecting, AnimationEvent.SiteExcluded))
                .toBe(AnimationState.VpnDisconnecting);
        });

        it('applies the disabled state instantly when the popup opens on an excluded site', () => {
            expect(next(AnimationState.VpnDisabledIdle, AnimationEvent.SiteExcluded))
                .toBe(AnimationState.VpnDisabled);
        });

        it('keeps the disabled state when the site becomes excluded while already disabled', () => {
            expect(next(AnimationState.VpnDisabled, AnimationEvent.SiteExcluded))
                .toBe(AnimationState.VpnDisabled);
        });

        it('plays the connection animation when the site is routed again while the tunnel is up', () => {
            expect(next(AnimationState.VpnDisabled, AnimationEvent.VpnConnected))
                .toBe(AnimationState.VpnConnecting);
        });
    });

    describe('transition completion', () => {
        it('lands on the enabled state after the connection animation ends', () => {
            expect(next(AnimationState.VpnConnecting, AnimationEvent.AnimationEnded))
                .toBe(AnimationState.VpnEnabled);
        });

        it('lands on the disabled state after the disconnection animation ends', () => {
            expect(next(AnimationState.VpnDisconnecting, AnimationEvent.AnimationEnded))
                .toBe(AnimationState.VpnDisabled);
        });

        it('lands on the disabled state when the site becomes excluded while connecting', () => {
            const disconnecting = next(AnimationState.VpnConnecting, AnimationEvent.SiteExcluded);
            expect(next(disconnecting, AnimationEvent.AnimationEnded)).toBe(AnimationState.VpnDisabled);
        });
    });

    describe('initial state', () => {
        it('starts idle and lands on the enabled state without a transition', () => {
            expect(animationStateMachine.initialState.value).toBe(AnimationState.VpnDisabledIdle);
            expect(next(AnimationState.VpnDisabledIdle, AnimationEvent.VpnConnected))
                .toBe(AnimationState.VpnEnabled);
        });

        it('lands on the disabled state without a transition when the tunnel is down', () => {
            expect(next(AnimationState.VpnDisabledIdle, AnimationEvent.VpnDisconnected))
                .toBe(AnimationState.VpnDisabled);
        });

        it('ignores the location selection while the site is excluded', () => {
            expect(next(AnimationState.VpnDisabled, AnimationEvent.LocationSelected))
                .toBe(AnimationState.VpnDisabled);
        });
    });

    describe('connection drop', () => {
        it('plays the disconnection animation when the connection drops while enabled', () => {
            expect(next(AnimationState.VpnEnabled, AnimationEvent.VpnDisconnectedRetrying))
                .toBe(AnimationState.VpnDisconnecting);
        });

        it('plays the disconnection animation when the connection drops while connecting', () => {
            expect(next(AnimationState.VpnConnecting, AnimationEvent.VpnDisconnectedRetrying))
                .toBe(AnimationState.VpnDisconnecting);
        });
    });

    describe('initialization landing', () => {
        it('lands on the enabled state without a transition from any state', () => {
            expect(next(AnimationState.VpnDisabledIdle, AnimationEvent.InitEnabled)).toBe(AnimationState.VpnEnabled);
            expect(next(AnimationState.VpnDisabled, AnimationEvent.InitEnabled)).toBe(AnimationState.VpnEnabled);
            expect(next(AnimationState.VpnConnecting, AnimationEvent.InitEnabled)).toBe(AnimationState.VpnEnabled);
            expect(next(AnimationState.VpnDisconnecting, AnimationEvent.InitEnabled)).toBe(AnimationState.VpnEnabled);
            expect(next(AnimationState.VpnSwitchingLocation, AnimationEvent.InitEnabled))
                .toBe(AnimationState.VpnEnabled);
        });

        it('lands on the disabled state without a transition from any state', () => {
            expect(next(AnimationState.VpnDisabledIdle, AnimationEvent.InitDisabled)).toBe(AnimationState.VpnDisabled);
            expect(next(AnimationState.VpnEnabled, AnimationEvent.InitDisabled)).toBe(AnimationState.VpnDisabled);
            expect(next(AnimationState.VpnConnecting, AnimationEvent.InitDisabled)).toBe(AnimationState.VpnDisabled);
            expect(next(AnimationState.VpnDisconnecting, AnimationEvent.InitDisabled)).toBe(AnimationState.VpnDisabled);
            expect(next(AnimationState.VpnSwitchingLocation, AnimationEvent.InitDisabled))
                .toBe(AnimationState.VpnDisabled);
        });
    });
});
