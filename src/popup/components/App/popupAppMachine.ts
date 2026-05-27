import { createMachine } from 'xstate';

import {
    PopupEvent,
    PopupGuard,
    PopupService,
    PopupState,
} from './popupAppMachineEnums';

/**
 * State machine that orchestrates the popup lifecycle.
 *
 * idle -> loadingPlatformData -> loadingAuthStatus -> (showingAuthScreen | loadingStartupData)
 * -> (showingOnboarding | loadingPopupData) -> showingPopup.
 */
export const popupAppMachine = createMachine({
    id: 'popupApp',
    initial: PopupState.Idle,
    predictableActionArguments: true,
    on: {
        [PopupEvent.UserDeauthenticated]: PopupState.ShowingAuthScreen,
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
