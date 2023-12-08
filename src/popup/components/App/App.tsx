import React, {
    useContext,
    useEffect,
} from 'react';
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
import { RequestStatus } from '../../stores/consts';
import { log } from '../../../lib/logger';
import { messenger } from '../../../lib/messenger';
import { notifier, NotifierType } from '../../../lib/notifier';
import { useAppearanceTheme } from '../../../common/useAppearanceTheme';
import { TrafficLimitExceeded } from '../Settings/TrafficLimitExceeded';
import { ConnectionsLimitError } from '../ConnectionsLimitError';
import { Onboarding } from '../Authentication/Onboarding';
import { Newsletter } from '../Authentication/Newsletter';
import { UpgradeScreen } from '../Authentication/UpgradeScreen';
import { ReviewPopup } from '../ReviewPopup';
import { ConfirmEmailModal, ConfirmEmailNotice } from '../ConfirmEmail';
import { ServerErrorPopup } from '../ServerErrorPopup';
import { VpnBlockedError } from '../VpnBlockedError';
import { HostPermissionsError } from '../HostPermissionsError';
import { SkeletonLoading } from '../SkeletonLoading';
import { NoLocationsError } from '../NoLocationsError';

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
        desktopVpnEnabled,
        canControlProxy,
        hasGlobalError,
        hasLimitExceededError,
        isCurrentTabExcluded,
        canBeExcluded,
        showLimitExceededScreen,
        isVpnBlocked,
        isHostPermissionsGranted,
        hasDesktopAppForOs,
    } = settingsStore;

    const { authenticated } = authStore;

    const { initStatus } = globalStore;

    const { isOpenEndpointsSearch, isOpenOptionsModal } = uiStore;

    const { premiumPromoEnabled, isPremiumToken, filteredLocations } = vpnStore;

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
                case notifier.types.CONNECTIVITY_DESKTOP_VPN_STATUS_CHANGED: {
                    settingsStore.setDesktopVpnEnabled(data);
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
            notifier.types.CONNECTIVITY_DESKTOP_VPN_STATUS_CHANGED,
            notifier.types.SERVER_ERROR,
        ];

        const onUnload = messenger.createLongLivedConnection(events, messageHandler);

        return () => {
            onUnload();
            settingsStore.stopTrackSystemTheme();
        };
    }, []);

    useAppearanceTheme(settingsStore.appearanceTheme);

    // show skeleton while data is loading.
    // it is more reliable to show a separate skeleton component
    // instead of changing different components based on the initStatus
    // because it would be more difficult to check all components and make sure
    // that they do not require any data fetching
    if (initStatus === RequestStatus.Pending) {
        return (
            <SkeletonLoading />
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
    if (authenticated && filteredLocations.length === 0) {
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

    if ((hasGlobalError && !hasLimitExceededError) || !canControlProxy || desktopVpnEnabled) {
        const showMenuButton = authenticated && canControlProxy;
        return (
            <>
                {isOpenOptionsModal && <ExtraOptions />}
                <Header showMenuButton={showMenuButton} />
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
                && <VpnBlockedError />
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
                        <ConfirmEmailNotice />
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
            <ConfirmEmailModal />
            <ReviewPopup />
            <ServerErrorPopup />
        </>
    );
});
