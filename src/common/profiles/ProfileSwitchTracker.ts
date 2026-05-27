import {
    observable,
    computed,
    action,
    runInAction,
} from 'mobx';
import { interpret, type StateFrom } from 'xstate';

import { profileSwitchMachine, ProfileSwitchState, ProfileSwitchEvent } from './profileSwitchMachine';
import { type ActiveProfileChangedPayload } from './types';

/**
 * Encapsulates the profile switch state machine with MobX bindings.
 * Composed into popup VpnStore and options ProfilesStore to avoid
 * duplicating the machine lifecycle and observable state.
 */
export class ProfileSwitchTracker {
    /**
     * Current state of the profile switch machine.
     */
    @observable.ref
    private machineState: StateFrom<typeof profileSwitchMachine> = profileSwitchMachine.initialState;

    /**
     * Interpreter for the profile switch state machine.
     */
    private service = interpret(profileSwitchMachine);

    /**
     * Currently active profile ID.
     */
    @observable public activeProfileId: string;

    constructor(defaultProfileId: string) {
        this.activeProfileId = defaultProfileId;
        this.service.onTransition((state) => {
            if (state.changed) {
                runInAction(() => {
                    this.machineState = state;
                });
            }
        });
        this.service.start();
    }

    /**
     * Whether a profile switch is in progress.
     */
    @computed public get isSwitching(): boolean {
        return this.machineState.matches(ProfileSwitchState.Switching);
    }

    /**
     * Whether the machine is still waiting for initial data.
     */
    public get isWaitingForInit(): boolean {
        return this.machineState.matches(ProfileSwitchState.WaitingForInit);
    }

    /**
     * Marks a profile switch as in progress and sets the target profile.
     *
     * @param profileId The target profile ID being switched to.
     */
    @action
    public startSwitch(profileId: string): void {
        this.service.send({ type: ProfileSwitchEvent.SwitchStarted, profileId });
        this.activeProfileId = profileId;
    }

    /**
     * Completes a profile switch and updates the active profile.
     *
     * @param payload Event payload with profile ID, success flag, and reason.
     */
    @action
    public completeSwitch(payload: ActiveProfileChangedPayload): void {
        this.service.send({ type: ProfileSwitchEvent.SwitchCompleted, payload });
        this.activeProfileId = payload.profileId;
    }

    /**
     * Applies initial profile state, only if no live event has updated it yet.
     * If a live event has already moved the machine out of WaitingForInit,
     * the initial data snapshot is stale and must not overwrite the live state.
     *
     * @param activeProfileId Active profile ID from the initial data snapshot.
     * @param switchingProfileId Target profile ID, or `null` if idle.
     */
    @action
    public applyInitialData(activeProfileId: string, switchingProfileId: string | null): void {
        if (!this.isWaitingForInit) {
            return;
        }

        this.activeProfileId = activeProfileId;

        this.service.send({
            type: ProfileSwitchEvent.InitialData,
            switchingProfileId,
        });
        if (this.isSwitching && switchingProfileId !== null) {
            this.activeProfileId = switchingProfileId;
        }
    }
}
