import { describe, it, expect } from 'vitest';
import { interpret, type InterpreterFrom } from 'xstate';

import {
    profileSwitchMachine,
    ProfileSwitchState,
    ProfileSwitchEvent,
} from '../../src/common/profiles/profileSwitchMachine';
import { type ActiveProfileChangedPayload } from '../../src/common/profiles';

/**
 * Creates a started interpreter for the profile switch machine.
 */
function createService(): InterpreterFrom<typeof profileSwitchMachine> {
    return interpret(profileSwitchMachine).start();
}

/**
 * Builds a SWITCH_COMPLETED event with the given overrides.
 */
function switchCompleted(overrides: Partial<ActiveProfileChangedPayload> = {}) {
    return {
        type: ProfileSwitchEvent.SwitchCompleted,
        payload: {
            profileId: overrides.profileId ?? 'profile-1',
            success: overrides.success ?? true,
        },
    };
}

describe('profileSwitchMachine', () => {
    describe('initial state', () => {
        it('should start in WaitingForInit', () => {
            const service = createService();
            expect(service.state.matches(ProfileSwitchState.WaitingForInit)).toBe(true);
            service.stop();
        });
    });

    describe('INITIAL_DATA from WaitingForInit', () => {
        it('should transition to Idle when switchingProfileId is null', () => {
            const service = createService();

            service.send({ type: ProfileSwitchEvent.InitialData, switchingProfileId: null });

            expect(service.state.matches(ProfileSwitchState.Idle)).toBe(true);
            service.stop();
        });

        it('should transition to Switching when switchingProfileId is set', () => {
            const service = createService();

            service.send({ type: ProfileSwitchEvent.InitialData, switchingProfileId: 'profile-1' });

            expect(service.state.matches(ProfileSwitchState.Switching)).toBe(true);
            service.stop();
        });
    });

    describe('INITIAL_DATA ignored after first transition', () => {
        it('should ignore INITIAL_DATA in Idle state', () => {
            const service = createService();
            service.send({ type: ProfileSwitchEvent.InitialData, switchingProfileId: null });
            expect(service.state.matches(ProfileSwitchState.Idle)).toBe(true);

            service.send({ type: ProfileSwitchEvent.InitialData, switchingProfileId: 'profile-1' });

            expect(service.state.matches(ProfileSwitchState.Idle)).toBe(true);
            service.stop();
        });

        it('should ignore INITIAL_DATA in Switching state', () => {
            const service = createService();
            service.send({ type: ProfileSwitchEvent.SwitchStarted, profileId: 'profile-1' });
            expect(service.state.matches(ProfileSwitchState.Switching)).toBe(true);

            service.send({ type: ProfileSwitchEvent.InitialData, switchingProfileId: null });

            expect(service.state.matches(ProfileSwitchState.Switching)).toBe(true);
            service.stop();
        });
    });

    describe('live events from WaitingForInit', () => {
        it('should transition to Switching on SwitchStarted', () => {
            const service = createService();

            service.send({ type: ProfileSwitchEvent.SwitchStarted, profileId: 'profile-1' });

            expect(service.state.matches(ProfileSwitchState.Switching)).toBe(true);
            service.stop();
        });

        it('should transition to Idle on SwitchCompleted', () => {
            const service = createService();

            service.send(switchCompleted());

            expect(service.state.matches(ProfileSwitchState.Idle)).toBe(true);
            service.stop();
        });

        it('should skip WaitingForInit when live event arrives before initial data', () => {
            const service = createService();

            service.send({ type: ProfileSwitchEvent.SwitchStarted, profileId: 'profile-1' });
            expect(service.state.matches(ProfileSwitchState.Switching)).toBe(true);

            // Late INITIAL_DATA should be ignored
            service.send({ type: ProfileSwitchEvent.InitialData, switchingProfileId: null });
            expect(service.state.matches(ProfileSwitchState.Switching)).toBe(true);

            service.stop();
        });
    });

    describe('switching lifecycle', () => {
        it('should transition from Idle to Switching on SwitchStarted', () => {
            const service = createService();
            service.send({ type: ProfileSwitchEvent.InitialData, switchingProfileId: null });

            service.send({ type: ProfileSwitchEvent.SwitchStarted, profileId: 'profile-1' });

            expect(service.state.matches(ProfileSwitchState.Switching)).toBe(true);
            service.stop();
        });

        it('should transition from Switching to Idle on SwitchCompleted', () => {
            const service = createService();
            service.send({ type: ProfileSwitchEvent.InitialData, switchingProfileId: null });
            service.send({ type: ProfileSwitchEvent.SwitchStarted, profileId: 'profile-1' });

            service.send(switchCompleted());

            expect(service.state.matches(ProfileSwitchState.Idle)).toBe(true);
            service.stop();
        });

        it('should stay in Switching when a new SwitchStarted arrives', () => {
            const service = createService();
            service.send({ type: ProfileSwitchEvent.InitialData, switchingProfileId: null });
            service.send({ type: ProfileSwitchEvent.SwitchStarted, profileId: 'profile-1' });

            service.send({ type: ProfileSwitchEvent.SwitchStarted, profileId: 'profile-2' });

            expect(service.state.matches(ProfileSwitchState.Switching)).toBe(true);
            service.stop();
        });

        it('should ignore SwitchCompleted in Idle', () => {
            const service = createService();
            service.send({ type: ProfileSwitchEvent.InitialData, switchingProfileId: null });

            service.send(switchCompleted());

            expect(service.state.matches(ProfileSwitchState.Idle)).toBe(true);
            service.stop();
        });
    });

    describe('rapid switch scenario', () => {
        it('should handle B→C→complete(C) sequence', () => {
            const service = createService();
            service.send({ type: ProfileSwitchEvent.InitialData, switchingProfileId: null });

            service.send({ type: ProfileSwitchEvent.SwitchStarted, profileId: 'B' });
            expect(service.state.matches(ProfileSwitchState.Switching)).toBe(true);

            service.send({ type: ProfileSwitchEvent.SwitchStarted, profileId: 'C' });
            expect(service.state.matches(ProfileSwitchState.Switching)).toBe(true);

            service.send(switchCompleted({ profileId: 'C' }));
            expect(service.state.matches(ProfileSwitchState.Idle)).toBe(true);

            service.stop();
        });

        it('should handle failure and rollback', () => {
            const service = createService();
            service.send({ type: ProfileSwitchEvent.InitialData, switchingProfileId: null });
            service.send({ type: ProfileSwitchEvent.SwitchStarted, profileId: 'B' });

            service.send(switchCompleted({ profileId: 'A', success: false }));

            expect(service.state.matches(ProfileSwitchState.Idle)).toBe(true);
            service.stop();
        });
    });
});
