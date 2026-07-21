import { assign, createMachine } from 'xstate';

import {
    type PopupAppContext,
    PopupEvent,
    PopupGuard,
    PopupScreen,
    PopupService,
    PopupState,
    type ScreenChangedEvent,
} from './popupAppMachineEnums';

/**
 * State machine that orchestrates the popup lifecycle.
 *
 * idle -> loadingPlatformData -> loadingAuthStatus -> (showingAuthScreen | loadingStartupData)
 * -> (showingOnboarding | loadingPopupData) -> showingPopup.
 *
 * Within the ShowingPopup state, the machine also tracks which concrete screen
 * is rendered via the `screen` context field. The value is derived from store
 * flags by {@link derivePopupScreen} (see App.tsx) and kept in sync through a
 * MobX reaction that sends the ScreenChanged event. This makes the machine the
 * single rendering authority and removes the parallel `if` blocks that used to
 * follow the machine in App.tsx.
 */
export const popupAppMachine = createMachine<PopupAppContext>({
    id: 'popupApp',
    initial: PopupState.Idle,
    predictableActionArguments: true,
    context: {
        screen: PopupScreen.Main,
    },
    on: {
        [PopupEvent.UserDeauthenticated]: PopupState.ShowingAuthScreen,
        // ScreenChanged is handled at the machine root (not only in
        // ShowingPopup) so the derived screen is captured during the loading
        // states too. The MobX reaction in App.tsx fires with
        // fireImmediately: true and on every observable change; handling it at
        // the root guarantees context.screen is current when the machine later
        // enters ShowingPopup, even when the derived value (e.g.
        // NoLocationsError, GlobalError, LimitExceeded, HostPermissionsError)
        // stops changing before that point.
        [PopupEvent.ScreenChanged]: {
            actions: assign<PopupAppContext, ScreenChangedEvent>({
                screen: (_ctx, event) => event.screen,
            }),
        },
    },
    states: {
        [PopupState.Idle]: {
            on: {
                [PopupEvent.Init]: PopupState.LoadingPlatformData,
            },
        },
        [PopupState.LoadingPlatformData]: {
            invoke: {
                src: PopupService.LoadPlatformData,
                onDone: PopupState.LoadingAuthStatus,
                onError: PopupState.Error,
            },
        },
        [PopupState.LoadingAuthStatus]: {
            invoke: {
                src: PopupService.LoadAuthStatus,
                onDone: [
                    {
                        target: PopupState.LoadingStartupData,
                        cond: PopupGuard.IsAuthenticated,
                    },
                    {
                        target: PopupState.ShowingAuthScreen,
                    },
                ],
                onError: PopupState.Error,
            },
        },
        [PopupState.ShowingAuthScreen]: {
            on: {
                [PopupEvent.UserAuthenticated]: PopupState.LoadingStartupData,
            },
        },
        [PopupState.LoadingStartupData]: {
            invoke: {
                src: PopupService.LoadStartupData,
                onDone: [
                    {
                        target: PopupState.ShowingOnboarding,
                        cond: PopupGuard.ShouldShowOnboarding,
                    },
                    {
                        target: PopupState.LoadingPopupData,
                    },
                ],
                onError: PopupState.Error,
            },
        },
        [PopupState.ShowingOnboarding]: {
            on: {
                [PopupEvent.OnboardingComplete]: PopupState.LoadingPopupData,
            },
        },
        [PopupState.LoadingPopupData]: {
            invoke: {
                src: PopupService.LoadPopupData,
                onDone: PopupState.ShowingPopup,
                onError: PopupState.Error,
            },
        },
        [PopupState.ShowingPopup]: {},
        [PopupState.Error]: {
            on: {
                [PopupEvent.Retry]: PopupState.LoadingPlatformData,
            },
        },
    },
});
