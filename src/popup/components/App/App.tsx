import React, { useContext, useEffect, useLayoutEffect } from 'react';
import { observer } from 'mobx-react';
import Modal from 'react-modal';

import { useMachine } from '@xstate/react';

import { Header } from '../Header';
import { InfoMessage, FeedbackMessage } from '../InfoMessage';
import { Locations } from '../Locations';
import { Authentication } from '../Authentication';
import { ExtraOptions } from '../ExtraOptions';
import { GlobalError } from '../GlobalError';
import { Settings } from '../Settings';
import { PromoNotificationModal } from '../PromoNotificationModal';
import { Icons } from '../../../common/components/Icons';
import { CurrentEndpoint } from '../Settings/CurrentEndpoint';
import { ExclusionsScreen } from '../Settings/ExclusionsScreen';
import { rootStore } from '../../stores';
import { log } from '../../../common/logger';
import { type NotifierMessage, messenger } from '../../../common/messenger';
import { notifier } from '../../../common/notifier';
import { useAppearanceTheme } from '../../../common/useAppearanceTheme';
import { TrafficLimitExceeded, TrafficLimitExceededB } from '../Settings/TrafficLimitExceeded';
import { ConnectionsLimitError } from '../ConnectionsLimitError';
import { Onboarding } from '../Authentication/Onboarding';
import { Newsletter } from '../Authentication/Newsletter';
import { UpgradePaywall } from '../Authentication/UpgradeScreen';
import { ReviewPopup } from '../ReviewPopup';
import { ServerErrorPopup } from '../ServerErrorPopup';
import { VpnBlockedError } from '../VpnBlockedError';
import { HostPermissionsError } from '../HostPermissionsError';
import { NoLocationsError } from '../NoLocationsError';
import { LimitedOfferModal } from '../LimitedOfferModal';
import { SETTINGS_IDS } from '../../../common/constants';
import { TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { MobileEdgePromo } from '../MobileEdgePromo';
import { Stats } from '../Stats';
import { ProfilesScreen } from '../Profiles/ProfilesScreen';
import { ProfileToast } from '../Profiles/ProfileToast/ProfileToast';
import { SkeletonLoading } from '../SkeletonLoading';

import { FullScreenLoader } from './FullScreenLoader';
import { popupAppMachine } from './popupAppMachine';
import { PopupEvent, PopupState } from './popupAppMachineEnums';

// Set modal app element in the app module because we use multiple modal
Modal.setAppElement('#root');

export const App = observer(() => {
    const {
        settingsStore,
        authStore,
        uiStore,
        vpnStore,
        globalStore,
        telemetryStore,
        statsStore,
        translationStore,
    } = useContext(rootStore);

    const {
        canControlProxy,
        hasGlobalError,
        hasLimitExceededError,
        isCurrentTabExcluded,
        canBeExcluded,
        showLimitExceededScreen,
        isVpnBlocked,
        isHostPermissionsGranted,
        isLimitedOfferActive,
        isAndroidBrowser,
    } = settingsStore;

    const { authenticated } = authStore;

    const {
        isOpenOptionsModal,
        isOpenLocationsScreen,
        shouldShowRegionNotice,
        isPaywallBVariant,
    } = uiStore;

    const { isOpenStatsScreen } = statsStore;

    const {
        premiumPromoEnabled,
        isPremiumToken,
        filteredLocations,
        notSearchingAndSavedTab,
        isProfilesScreenOpen,
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

    useEffect(() => {
        settingsStore.trackSystemTheme();

        const messageHandler = async (message: NotifierMessage): Promise<void> => {
            switch (message.type) {
                case notifier.types.VPN_INFO_UPDATED: {
                    vpnStore.setVpnInfo(message.data);
                    break;
                }
                case notifier.types.LOCATIONS_UPDATED: {
                    vpnStore.setLocations(message.data);
                    break;
                }
                case notifier.types.LOCATION_STATE_UPDATED: {
                    vpnStore.updateLocationState(message.data);
                    break;
                }
                case notifier.types.CURRENT_LOCATION_UPDATED: {
                    vpnStore.setSelectedLocation(message.data);
                    break;
                }
                case notifier.types.PERMISSIONS_ERROR_UPDATE: {
                    settingsStore.setGlobalError(message.data);
                    // If there is no error, it is time to check if token is premium
                    if (!message.data) {
                        await vpnStore.requestIsPremiumToken();
                    }
                    break;
                }
                case notifier.types.TOKEN_PREMIUM_STATE_UPDATED: {
                    vpnStore.setIsPremiumToken(message.data);
                    break;
                }
                case notifier.types.CONNECTIVITY_STATE_CHANGED: {
                    settingsStore.setConnectivityState(message.data);
                    break;
                }
                case notifier.types.TOO_MANY_DEVICES_CONNECTED: {
                    vpnStore.setTooManyDevicesConnected(true);
                    vpnStore.setMaxDevicesAllowed(message.data);
                    break;
                }
                case notifier.types.SERVER_ERROR: {
                    settingsStore.openServerErrorPopup();
                    break;
                }
                case notifier.types.SETTING_UPDATED: {
                    if (
                        message.data === SETTINGS_IDS.HELP_US_IMPROVE
                        && typeof message.value === 'boolean'
                    ) {
                        telemetryStore.setIsHelpUsImproveEnabled(message.value);
                    }
                    break;
                }
                case notifier.types.SHOW_RATE_MODAL: {
                    authStore.setShouldShowRateModal(true);
                    break;
                }
                case notifier.types.STATS_UPDATED: {
                    await statsStore.updateStatistics();
                    break;
                }
                case notifier.types.AUTH_CACHE_UPDATED: {
                    authStore.handleAuthCacheUpdate(message.data, message.value);
                    break;
                }
                case notifier.types.LANGUAGE_CHANGED: {
                    await translationStore.setLocalePreference(message.data);
                    break;
                }
                case notifier.types.USER_AUTHENTICATED: {
                    authStore.setIsAuthenticated(true);
                    send(PopupEvent.UserAuthenticated);
                    break;
                }
                case notifier.types.USER_DEAUTHENTICATED: {
                    authStore.setIsAuthenticated(false);
                    send(PopupEvent.UserDeauthenticated);
                    break;
                }
                case notifier.types.PROFILE_SWITCH_IN_PROGRESS: {
                    vpnStore.startSwitchingProfile(message.data);
                    break;
                }
                case notifier.types.ACTIVE_PROFILE_CHANGED: {
                    vpnStore.handleProfileChanged(message.data);
                    break;
                }
                default: {
                    log.debug('[vpn.App]: there is no such message type: ', message.type);
                    break;
                }
            }
        };

        const events = [
            notifier.types.VPN_INFO_UPDATED,
            notifier.types.LOCATIONS_UPDATED,
            notifier.types.LOCATION_STATE_UPDATED,
            notifier.types.CURRENT_LOCATION_UPDATED,
            notifier.types.PERMISSIONS_ERROR_UPDATE,
            notifier.types.TOKEN_PREMIUM_STATE_UPDATED,
            notifier.types.CONNECTIVITY_STATE_CHANGED,
            notifier.types.TOO_MANY_DEVICES_CONNECTED,
            notifier.types.SERVER_ERROR,
            notifier.types.SETTING_UPDATED,
            notifier.types.SHOW_RATE_MODAL,
            notifier.types.STATS_UPDATED,
            notifier.types.AUTH_CACHE_UPDATED,
            notifier.types.LANGUAGE_CHANGED,
            notifier.types.USER_AUTHENTICATED,
            notifier.types.USER_DEAUTHENTICATED,
            notifier.types.PROFILE_SWITCH_IN_PROGRESS,
            notifier.types.ACTIVE_PROFILE_CHANGED,
        ];

        const { onUnload, portId } = messenger.createLongLivedConnection(events, messageHandler);

        telemetryStore.setPageId(portId);

        return (): void => {
            telemetryStore.setPageId(null);
            onUnload();
            settingsStore.stopTrackSystemTheme();
        };
    }, [send]);

    /**
     * We are adding "android" class to html element
     * in order to apply android specific styles.
     */
    useLayoutEffect(() => {
        const ANDROID_CLASS = 'android';
        const html = document.documentElement;

        if (isAndroidBrowser) {
            html.classList.add(ANDROID_CLASS);
        } else {
            html.classList.remove(ANDROID_CLASS);
        }

        return (): void => {
            html.classList.remove(ANDROID_CLASS);
        };
    }, [isAndroidBrowser]);

    /**
     * Update popup height on Android browsers based on window height.
     * This is required because Android browser's popup does not support 100vh properly.
     */
    useLayoutEffect(() => {
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
        const html = document.documentElement;

        const removeHeightProperty = (): void => {
            html.style.removeProperty(POPUP_HEIGHT_PROP);
        };

        if (!isAndroidBrowser) {
            // Remove if height property previously set on html element
            removeHeightProperty();

            // Cleanup: Remove the height property after unmount
            return removeHeightProperty;
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

        // Cleanup: Remove the height property and event listener after unmount
        return (): void => {
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

    if (state.matches(PopupState.Idle)
        || state.matches(PopupState.LoadingPlatformData)
        || state.matches(PopupState.LoadingAuthStatus)) {
        return null;
    }

    // Show authentication screen
    if (state.matches(PopupState.ShowingAuthScreen)) {
        return (
            <>
                <Authentication />
                <Icons />
                <ServerErrorPopup />
            </>
        );
    }

    // Loading startup data
    if (state.matches(PopupState.LoadingStartupData)) {
        return <FullScreenLoader />;
    }

    // Show onboarding screens
    if (state.matches(PopupState.ShowingOnboarding)) {
        if (renderNewsletter) {
            return <Newsletter />;
        }

        if (renderOnboarding) {
            return (
                <>
                    <Onboarding />
                    <Icons />
                </>
            );
        }

        if (!isPremiumToken && renderUpgradeScreen) {
            return (
                <>
                    <UpgradePaywall />
                    <Icons />
                </>
            );
        }

        // All onboarding screens dismissed — useEffect above will fire OnboardingComplete
        return <FullScreenLoader />;
    }

    // Loading popup data — show skeleton for authenticated users, dots for others
    if (state.matches(PopupState.LoadingPopupData)) {
        if (authenticated) {
            return <SkeletonLoading />;
        }

        return <FullScreenLoader />;
    }

    // Error state
    if (state.matches(PopupState.Error)) {
        const handleRetry = (): void => {
            send(PopupEvent.Retry);
        };

        return (
            <>
                <Header showMenuButton={false} />
                <GlobalError onRetry={handleRetry} />
                <Icons />
                <ServerErrorPopup />
            </>
        );
    }

    // show browser permission error after user is authenticated
    if (!isHostPermissionsGranted && authenticated) {
        return (
            <HostPermissionsError />
        );
    }

    // warn authenticated users if no locations were fetched. AG-28164
    if (authenticated
        && !hasGlobalError
        && notSearchingAndSavedTab
        && filteredLocations.length === 0) {
        return (
            <NoLocationsError />
        );
    }

    // Unauthenticated user reaching showingPopup (edge case: logout during loading)
    if (!authenticated && !hasGlobalError) {
        return (
            <>
                <Authentication />
                <Icons />
                <ServerErrorPopup />
            </>
        );
    }

    if ((hasGlobalError && !hasLimitExceededError) || !canControlProxy) {
        const showMenuButton = authenticated && canControlProxy;

        // Screen name can be null if the error is not related to the control of the proxy.
        const screenName = !canControlProxy ? TelemetryScreenName.DisableAnotherVpnExtensionScreen : null;

        return (
            <>
                {isOpenOptionsModal && <ExtraOptions />}
                <Header showMenuButton={showMenuButton} screenName={screenName} />
                {
                    // do not show the warning if there is a limited offer active
                    !isLimitedOfferActive && <VpnBlockedError />
                }
                <Icons />
                <GlobalError />
                <ServerErrorPopup />
            </>
        );
    }

    if (showLimitExceededScreen || !canControlProxy) {
        const LimitExceededComponent = isPaywallBVariant
            ? TrafficLimitExceededB
            : TrafficLimitExceeded;

        return (
            <>
                <LimitExceededComponent />
                <Icons />
            </>
        );
    }

    if (isOpenLocationsScreen) {
        return (
            <>
                <Locations />
                <Icons />
            </>
        );
    }

    if (!isPremiumToken && renderUpgradeScreen) {
        return (
            <>
                <UpgradePaywall />
                <Icons />
            </>
        );
    }

    if (isOpenStatsScreen) {
        return (
            <>
                <Stats />
                <Icons />
            </>
        );
    }

    if (isProfilesScreenOpen) {
        return (
            <>
                <ProfilesScreen />
                <ProfileToast />
                <Icons />
            </>
        );
    }

    return (
        <>
            <ConnectionsLimitError />
            <PromoNotificationModal />
            {isOpenOptionsModal && <ExtraOptions />}
            <MobileEdgePromo />
            <Header showMenuButton={authenticated} />
            {
                (shouldShowRegionNotice || isVpnBlocked)
                // do not show the warning if there is a limited offer active
                && !isLimitedOfferActive
                && <VpnBlockedError />
            }
            {
                isLimitedOfferActive
                && <LimitedOfferModal />
            }
            {isCurrentTabExcluded && canBeExcluded
                ? <ExclusionsScreen />
                : (
                    <>
                        <Settings />
                        <div className="footer">
                            {premiumPromoEnabled ? (
                                <InfoMessage />
                            ) : (
                                <FeedbackMessage />
                            )}
                            <CurrentEndpoint />
                        </div>
                    </>
                )}
            <Icons />
            <ReviewPopup />
            <ServerErrorPopup />
        </>
    );
});
