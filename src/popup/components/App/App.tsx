import React, { useContext, useEffect, useLayoutEffect } from 'react';
import { observer } from 'mobx-react';
import Modal from 'react-modal';

import { reaction } from 'mobx';
import { useMachine } from '@xstate/react';

import { Header } from '../Header';
import { Authentication } from '../Authentication';
import { GlobalError } from '../GlobalError';
import { Icons } from '../../../common/components/Icons';
import { rootStore } from '../../stores';
import { useAppearanceTheme } from '../../../common/useAppearanceTheme';
import { Onboarding } from '../Authentication/Onboarding';
import { Newsletter } from '../Authentication/Newsletter';
import { UpgradePaywall } from '../Authentication/UpgradeScreen';
import { ServerErrorPopup } from '../ServerErrorPopup';
import { SkeletonLoading } from '../SkeletonLoading';

import { FullScreenLoader } from './FullScreenLoader';
import { popupAppMachine } from './popupAppMachine';
import { PopupEvent, PopupState } from './popupAppMachineEnums';
import { derivePopupScreen, renderPopupScreen } from './popupScreens';
import { usePopupNotifier } from './popupNotifier';

// Set modal app element in the app module because we use multiple modal
Modal.setAppElement('#root');

export const App = observer(() => {
    const rootContext = useContext(rootStore);
    const {
        settingsStore,
        authStore,
        uiStore,
        vpnStore,
        globalStore,
        statsStore,
    } = rootContext;

    const {
        canControlProxy,
        isCurrentTabExcluded,
        canBeExcluded,
        isVpnBlocked,
        isLimitedOfferActive,
        isAndroidBrowser,
    } = settingsStore;

    const { authenticated } = authStore;

    const {
        isOpenOptionsModal,
        shouldShowRegionNotice,
        isPaywallBVariant,
    } = uiStore;

    const {
        premiumPromoEnabled,
        isPremiumToken,
    } = vpnStore;

    const [state, send] = useMachine(popupAppMachine, {
        services: {
            /**
             * Loads platform-specific data: Android detection and appearance theme.
             */
            loadPlatformData: async () => {
                await globalStore.getAndroidData();
                await settingsStore.getAppearanceTheme();
            },

            /**
             * Checks whether the user is authenticated.
             *
             * @returns The result so the guard can read it from event.data.
             */
            loadAuthStatus: async () => {
                const isAuthenticated = await globalStore.initAuthenticatedStatus();
                return { isAuthenticated };
            },

            /**
             * Loads startup data required for onboarding decisions.
             * If onboarding will be shown, starts preloading popup data
             * in the background so it's ready when onboarding finishes.
             *
             * @returns Whether onboarding should be shown.
             */
            loadStartupData: async () => {
                const shouldShowOnboarding = await globalStore.initStartupData();
                if (shouldShowOnboarding) {
                    // Start loading popup data in the background while user
                    // goes through onboarding screens — mirrors the old init() behavior
                    globalStore.startPopupDataPreload();
                }
                return { shouldShowOnboarding };
            },

            /**
             * Loads full popup data: stats, popup data, desktop app data.
             * If a preload was started during onboarding, awaits the existing
             * promise instead of starting a fresh load.
             */
            loadPopupData: async () => {
                await globalStore.awaitPopupData();
            },
        },
        guards: {
            /**
             * Checks if the user is authenticated from the service result.
             *
             * @returns Whether the user is authenticated.
             */
            isAuthenticated: (_context, event) => {
                return event.data?.isAuthenticated === true;
            },

            /**
             * Checks if onboarding should be shown from the service result.
             *
             * @returns Whether onboarding should be shown.
             */
            shouldShowOnboarding: (_context, event) => {
                return event.data?.shouldShowOnboarding === true;
            },
        },
    });

    useEffect(() => {
        send(PopupEvent.Init);
    }, [send]);

    usePopupNotifier(send, rootContext);

    /**
     * Apply Android-specific styling:
     * 1. Toggle the `android` class on the html element.
     * 2. Sync the `--popup-height` CSS variable with the window height, because
     *    Android browser popups do not support 100vh properly.
     *
     * Previously these were two separate effects; they are merged here because
     * they share the same dependency (`isAndroidBrowser`) and the same lifecycle.
     */
    useLayoutEffect(() => {
        const ANDROID_CLASS = 'android';
        const html = document.documentElement;

        if (isAndroidBrowser) {
            html.classList.add(ANDROID_CLASS);
        } else {
            html.classList.remove(ANDROID_CLASS);
        }

        /**
         * Minimum height for the popup. Value is based on calculation:
         * Android Extension Window Height = clamp(Popup Height, 15% of viewport height, 70% of viewport height)
         *
         * We took average mobile viewport height as 785px from:
         * {@link https://gs.statcounter.com/screen-resolution-stats/mobile/worldwide}
         *
         * 785px % 70 = 550px
         */
        const POPUP_MIN_HEIGHT = 550;
        const POPUP_HEIGHT_PROP = '--popup-height';

        const removeHeightProperty = (): void => {
            html.style.removeProperty(POPUP_HEIGHT_PROP);
        };

        if (!isAndroidBrowser) {
            // Remove if height property previously set on html element
            removeHeightProperty();

            // Cleanup: Remove the android class and the height property after unmount
            return (): void => {
                html.classList.remove(ANDROID_CLASS);
                removeHeightProperty();
            };
        }

        const resizePopupHeight = (): void => {
            /**
             * From observation on Android browsers, popup's `windows.innerHeight` is properly set only on third time:
             * 1. Initially equal to 0
             * 2. After that it is set to 15% (approx) of viewport height
             * 3. Finally it calculates properly fixed at 70% (approx) of viewport height.
             *
             * Example if viewport height is 840px:
             * 0px -> 126px (15% of 840px) -> 588px (70% of 840px)
             *
             * Example if viewport height is 770px:
             * 0px -> 115px (15% of 770px) -> 550px (we ignore 539px (70% of 770px) because it's smaller than 550px)
             *
             * This is needed to display the popup properly on Android browsers.
             */
            if (window.innerHeight < POPUP_MIN_HEIGHT) {
                return;
            }

            html.style.setProperty(POPUP_HEIGHT_PROP, `${window.innerHeight}px`);
        };

        // Resize on initial render
        resizePopupHeight();

        // Add resize event listener
        // NOTE: Do not use `once` option because it may cause unexpected
        // behavior on Android browsers when keyboard is opened.
        window.addEventListener('resize', resizePopupHeight);

        // Cleanup: Remove the android class, the height property and the
        // event listener after unmount
        return (): void => {
            html.classList.remove(ANDROID_CLASS);
            removeHeightProperty();
            window.removeEventListener('resize', resizePopupHeight);
        };
    }, [isAndroidBrowser]);

    useAppearanceTheme(settingsStore.appearanceTheme);

    const { renderNewsletter, renderOnboarding, renderUpgradeScreen } = authStore;

    /**
     * Whether onboarding is complete:
     * true when the machine is in ShowingOnboarding state
     * but none of the onboarding screens need to be rendered anymore.
     */
    const isOnboardingComplete = state.matches(PopupState.ShowingOnboarding)
        && !renderNewsletter
        && !renderOnboarding
        && !(renderUpgradeScreen && !isPremiumToken);

    /**
     * Transition out of ShowingOnboarding when all onboarding screens are dismissed.
     * This runs as an effect (not during render) to avoid side effects in the render phase.
     */
    useEffect(() => {
        if (isOnboardingComplete) {
            send(PopupEvent.OnboardingComplete);
        }
    }, [isOnboardingComplete, send]);

    // Extend the state machine to cover rendering logic: keep
    // `state.context.screen` in sync with the screen derived from the store
    // flags. A MobX reaction tracks the relevant observables; because all flag
    // mutations happen inside MobX actions, the reaction fires synchronously at
    // the end of the action, so the context is current before the next render.
    // This makes the machine the single rendering authority for ShowingPopup
    // and removes the parallel `if` blocks that used to follow the machine.
    useEffect(() => {
        const dispose = reaction(
            () => derivePopupScreen({
                settingsStore,
                authStore,
                uiStore,
                vpnStore,
                statsStore,
            }),
            (screen) => send({ type: PopupEvent.ScreenChanged, screen }),
            { fireImmediately: true },
        );
        return dispose;
    }, [
        send,
        settingsStore,
        authStore,
        uiStore,
        vpnStore,
        statsStore,
    ]);

    // Compute the state-specific content. Early init states (Idle,
    // LoadingPlatformData, LoadingAuthStatus) produce null content and return
    // nothing — not even Icons/ServerErrorPopup — matching the previous
    // behavior where those states returned null immediately.
    let content: React.ReactNode = null;

    if (state.matches(PopupState.Idle)
        || state.matches(PopupState.LoadingPlatformData)
        || state.matches(PopupState.LoadingAuthStatus)) {
        content = null;
    } else if (state.matches(PopupState.ShowingAuthScreen)) {
        content = <Authentication />;
    } else if (state.matches(PopupState.LoadingStartupData)) {
        content = <FullScreenLoader />;
    } else if (state.matches(PopupState.ShowingOnboarding)) {
        if (renderNewsletter) {
            content = <Newsletter />;
        } else if (renderOnboarding) {
            content = <Onboarding />;
        } else if (!isPremiumToken && renderUpgradeScreen) {
            content = <UpgradePaywall />;
        } else {
            // All onboarding screens dismissed — isOnboardingComplete effect
            // fires OnboardingComplete
            content = <FullScreenLoader />;
        }
    } else if (state.matches(PopupState.LoadingPopupData)) {
        content = authenticated
            ? <SkeletonLoading />
            : <FullScreenLoader />;
    } else if (state.matches(PopupState.Error)) {
        const handleRetry = (): void => {
            send(PopupEvent.Retry);
        };
        content = (
            <>
                <Header showMenuButton={false} />
                <GlobalError onRetry={handleRetry} />
            </>
        );
    } else if (state.matches(PopupState.ShowingPopup)) {
        content = renderPopupScreen(state.context.screen, {
            authenticated,
            isOpenOptionsModal,
            isPaywallBVariant,
            shouldShowRegionNotice,
            isVpnBlocked,
            isLimitedOfferActive,
            isCurrentTabExcluded,
            canBeExcluded,
            canControlProxy,
            premiumPromoEnabled,
        });
    }

    // Early init states render nothing — no Icons, no ServerErrorPopup —
    // matching the previous behavior where they returned null immediately.
    if (content === null) {
        return null;
    }

    return (
        <>
            {content}
            <Icons />
            <ServerErrorPopup />
        </>
    );
});
