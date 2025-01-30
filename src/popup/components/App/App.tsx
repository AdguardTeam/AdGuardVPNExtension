import React, { useContext, useEffect, useLayoutEffect } from 'react';
import { observer } from 'mobx-react';
import Modal from 'react-modal';
import { CSSTransition } from 'react-transition-group';

import { Header } from '../Header';
import { InfoMessage, FeedbackMessage } from '../InfoMessage';
import { Locations } from '../Locations';
import { Authentication } from '../Authentication';
import { ExtraOptions } from '../ExtraOptions';
import { GlobalError } from '../GlobalError';
import { Settings } from '../Settings';
import { PromoNotificationModal } from '../PromoNotificationModal';
import { Icons } from '../ui/Icons';
import { CurrentEndpoint } from '../Settings/CurrentEndpoint';
import { ExclusionsScreen } from '../Settings/ExclusionsScreen';
import { rootStore } from '../../stores';
import { RequestStatus } from '../../stores/constants';
import { log } from '../../../common/logger';
import { messenger } from '../../../common/messenger';
import { notifier, type NotifierType } from '../../../common/notifier';
import { useAppearanceTheme } from '../../../common/useAppearanceTheme';
import { TrafficLimitExceeded } from '../Settings/TrafficLimitExceeded';
import { ConnectionsLimitError } from '../ConnectionsLimitError';
import { Onboarding } from '../Authentication/Onboarding';
import { Newsletter } from '../Authentication/Newsletter';
import { UpgradeScreen } from '../Authentication/UpgradeScreen';
import { DotsLoader } from '../../../common/components/DotsLoader';
import { ReviewPopup } from '../ReviewPopup';
import { ServerErrorPopup } from '../ServerErrorPopup';
import { VpnBlockedError } from '../VpnBlockedError';
import { HostPermissionsError } from '../HostPermissionsError';
import { SkeletonLoading } from '../SkeletonLoading';
import { NoLocationsError } from '../NoLocationsError';
import { LimitedOfferModal } from '../LimitedOfferModal/LimitedOfferModal';

export interface Message {
    type: NotifierType,
    data: any
}

// Set modal app element in the app module because we use multiple modal
Modal.setAppElement('#root');

export const App = observer(() => {
    const {
        settingsStore,
        authStore,
        uiStore,
        vpnStore,
        globalStore,
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
        hasDesktopAppForOs,
        isLimitedOfferActive,
        isAndroidBrowser,
    } = settingsStore;

    const { authenticated } = authStore;

    const { initStatus } = globalStore;

    const { isOpenEndpointsSearch, isOpenOptionsModal } = uiStore;

    const {
        premiumPromoEnabled,
        isPremiumToken,
        filteredLocations,
        showSearchResults,
    } = vpnStore;

    useEffect(() => {
        (async () => {
            await settingsStore.getAppearanceTheme();
            await globalStore.init();
        })();

        settingsStore.trackSystemTheme();

        const messageHandler = async (message: Message) => {
            const { type, data } = message;

            switch (type) {
                case notifier.types.VPN_INFO_UPDATED: {
                    vpnStore.setVpnInfo(data);
                    break;
                }
                case notifier.types.LOCATIONS_UPDATED: {
                    vpnStore.setLocations(data);
                    break;
                }
                case notifier.types.LOCATION_STATE_UPDATED: {
                    vpnStore.updateLocationState(data);
                    break;
                }
                case notifier.types.CURRENT_LOCATION_UPDATED: {
                    vpnStore.setSelectedLocation(data);
                    break;
                }
                case notifier.types.PERMISSIONS_ERROR_UPDATE: {
                    settingsStore.setGlobalError(data);
                    // If there is no error, it is time to check if token is premium
                    if (!data) {
                        await vpnStore.requestIsPremiumToken();
                    }
                    break;
                }
                case notifier.types.TOKEN_PREMIUM_STATE_UPDATED: {
                    vpnStore.setIsPremiumToken(data);
                    break;
                }
                case notifier.types.CONNECTIVITY_STATE_CHANGED: {
                    settingsStore.setConnectivityState(data);
                    break;
                }
                case notifier.types.TOO_MANY_DEVICES_CONNECTED: {
                    vpnStore.setTooManyDevicesConnected(true);
                    vpnStore.setMaxDevicesAllowed(data);
                    break;
                }
                case notifier.types.SERVER_ERROR: {
                    settingsStore.openServerErrorPopup();
                    break;
                }
                default: {
                    log.debug('there is no such message type: ', type);
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
        ];

        const onUnload = messenger.createLongLivedConnection(events, messageHandler);

        return () => {
            onUnload();
            settingsStore.stopTrackSystemTheme();
        };
    }, []);

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

        return () => {
            html.classList.remove(ANDROID_CLASS);
        };
    }, [isAndroidBrowser]);

    /**
     * Update popup height on Android browsers based on window height.
     * This is required because Android browser's popup do not support 100vh properly.
     */
    useLayoutEffect(() => {
        /**
         * Minimum height for the popup. If window height is less than this value,
         * popup height will be set to this value. Value is based on calculation:
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

        const removeHeightProperty = () => {
            html.style.removeProperty(POPUP_HEIGHT_PROP);
        };

        if (!isAndroidBrowser) {
            // Remove if height property previously set on html element
            removeHeightProperty();

            // Cleanup: Remove the height property after unmount
            return removeHeightProperty;
        }

        const resizePopupHeight = () => {
            const newHeight = Math.max(window.innerHeight, POPUP_MIN_HEIGHT);
            html.style.setProperty(POPUP_HEIGHT_PROP, `${newHeight}px`);
        };

        // Resize on initial render
        resizePopupHeight();

        // Add resize event listener
        window.addEventListener('resize', resizePopupHeight);

        // Cleanup: Remove the height property and event listener after unmount
        return () => {
            removeHeightProperty();
            window.removeEventListener('resize', resizePopupHeight);
        };
    }, [isAndroidBrowser]);

    useAppearanceTheme(settingsStore.appearanceTheme);

    // show skeleton while data is loading.
    // it is more reliable to show a separate skeleton component
    // instead of changing different components based on the initStatus
    // because it would be more difficult to check all components and make sure
    // that they do not require any data fetching
    if (initStatus === RequestStatus.Pending) {
        return authStore.authenticated
            && !authStore.renderOnboarding
            ? <SkeletonLoading />
            // show dots loader until the user is authenticated
            : (
                <div className="data-loader">
                    <DotsLoader />
                </div>
            );
    }

    if (authStore.requestProcessState !== RequestStatus.Pending
        && settingsStore.checkPermissionsState !== RequestStatus.Pending
        && globalStore.status === RequestStatus.Pending) {
        return null;
    }

    // show browser permission error after user is authenticated
    if (!isHostPermissionsGranted && authenticated) {
        return (
            <HostPermissionsError />
        );
    }

    // warn authenticated users if no locations were fetch. AG-28164
    if (authenticated
        && !hasGlobalError
        && !showSearchResults
        && filteredLocations.length === 0) {
        return (
            <NoLocationsError />
        );
    }

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
        return (
            <>
                {isOpenOptionsModal && <ExtraOptions />}
                <Header showMenuButton={showMenuButton} />
                {
                    // do not show the warning for users on linux AG-27487
                    hasDesktopAppForOs
                    // do not show the warning if there is a limited offer active
                    && !isLimitedOfferActive
                    && <VpnBlockedError />
                }
                <Icons />
                <GlobalError />
                <ServerErrorPopup />
            </>
        );
    }

    if (authStore.renderNewsletter) {
        return <Newsletter />;
    }

    if (authStore.renderOnboarding) {
        return (
            <>
                <Onboarding />
                <Icons />
            </>
        );
    }

    if (!isPremiumToken && authStore.renderUpgradeScreen) {
        return (
            <>
                <UpgradeScreen />
                <Icons />
            </>
        );
    }

    if (showLimitExceededScreen || !canControlProxy) {
        return (
            <>
                <TrafficLimitExceeded />
                <Icons />
            </>
        );
    }

    return (
        <>
            <ConnectionsLimitError />
            <PromoNotificationModal />
            {isOpenOptionsModal && <ExtraOptions />}
            <Header showMenuButton={authenticated} />
            {
                isVpnBlocked
                // do not show the warning for users on linux AG-27487
                && hasDesktopAppForOs
                // do not show the warning if there is a limited offer active
                && !isLimitedOfferActive
                && <VpnBlockedError />
            }
            {
                isLimitedOfferActive
                && <LimitedOfferModal />
            }
            <CSSTransition
                in={isOpenEndpointsSearch}
                timeout={300}
                classNames="fade"
                unmountOnExit
            >
                <Locations />
            </CSSTransition>
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
