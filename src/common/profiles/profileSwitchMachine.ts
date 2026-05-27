import { createMachine } from 'xstate';

/**
 * States of the profile switch machine.
 */
export enum ProfileSwitchState {
    /**
     * Waiting for initial data from the background.
     * Accepts both live notifier events and initial data.
     * Once the machine leaves this state, it never returns,
     * replacing the manual `hasReceivedSwitchEvent` flag.
     */
    WaitingForInit = 'waitingForInit',

    /**
     * No profile operation is in progress.
     */
    Idle = 'idle',

    /**
     * A profile is currently being applied.
     */
    Switching = 'switching',
}

/**
 * Events dispatched to the profile switch machine.
 */
export enum ProfileSwitchEvent {
    /**
     * Initial data loaded from the background.
     * Only processed while in WaitingForInit; ignored afterwards.
     */
    InitialData = 'INITIAL_DATA',

    /**
     * A profile switch has started.
     */
    SwitchStarted = 'SWITCH_STARTED',

    /**
     * A profile switch has completed.
     */
    SwitchCompleted = 'SWITCH_COMPLETED',
}

const GUARD_HAS_SWITCHING_PROFILE = 'hasSwitchingProfile';

/**
 * XState machine that models the profile switch lifecycle.
 *
 * Starts in WaitingForInit. INITIAL_DATA with a non-null
 * switchingProfileId transitions to Switching; otherwise to Idle.
 * Live notifier events are accepted from any state.
 */
export const profileSwitchMachine = createMachine(
    {
        id: 'profileSwitch',
        initial: ProfileSwitchState.WaitingForInit,
        predictableActionArguments: true,
        states: {
            [ProfileSwitchState.WaitingForInit]: {
                on: {
                    [ProfileSwitchEvent.InitialData]: [
                        {
                            target: ProfileSwitchState.Switching,
                            cond: GUARD_HAS_SWITCHING_PROFILE,
                        },
                        {
                            target: ProfileSwitchState.Idle,
                        },
                    ],
                    [ProfileSwitchEvent.SwitchStarted]: ProfileSwitchState.Switching,
                    [ProfileSwitchEvent.SwitchCompleted]: ProfileSwitchState.Idle,
                },
            },
            [ProfileSwitchState.Idle]: {
                on: {
                    [ProfileSwitchEvent.SwitchStarted]: ProfileSwitchState.Switching,
                },
            },
            [ProfileSwitchState.Switching]: {
                on: {
                    [ProfileSwitchEvent.SwitchStarted]: ProfileSwitchState.Switching,
                    [ProfileSwitchEvent.SwitchCompleted]: ProfileSwitchState.Idle,
                },
            },
        },
    },
    {
        guards: {
            [GUARD_HAS_SWITCHING_PROFILE]: (_context, event) => {
                return event.switchingProfileId !== null;
            },
        },
    },
);
