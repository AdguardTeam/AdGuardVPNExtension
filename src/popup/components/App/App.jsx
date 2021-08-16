import React, {
    useContext,
    useEffect,
} from 'react';
import { observer } from 'mobx-react';
import Modal from 'react-modal';
import { CSSTransition } from 'react-transition-group';

import Header from '../Header';
import InfoMessage from '../InfoMessage';
import FeedbackMessage from '../InfoMessage/FeedbackMessage';
import Locations from '../Locations';
import Authentication from '../Authentication';
import ExtraOptions from '../ExtraOptions';
import Preloader from '../Preloader';
import GlobalError from '../GlobalError';
import Settings from '../Settings';
import { PromoNotificationModal } from '../PromoNotificationModal';
import Icons from '../ui/Icons';
import CurrentEndpoint from '../Settings/CurrentEndpoint';
import ExclusionsScreen from '../Settings/ExclusionsScreen';

import { rootStore } from '../../stores';
import { REQUEST_STATUSES } from '../../stores/consts';
import { log } from '../../../lib/logger';
import messenger from '../../../lib/messenger';
import notifier from '../../../lib/notifier';
import PromoSale from '../PromoSale';
import { PROMO_SCREEN_STATES } from '../../../lib/constants';
import { useAppearanceTheme } from '../../../common/useAppearanceTheme';
import { TrafficLimitExceeded } from '../Settings/TrafficLimitExceeded';
import { ConnectionsLimitError } from '../ConnectionsLimitError';

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

    useEffect(() => {
        settingsStore.getAppearanceTheme();
        (async () => {
            await globalStore.init();
        })();

        const messageHandler = async (message) => {
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
        ];

        const onUnload = messenger.createLongLivedConnection(events, messageHandler);

        return () => {
            onUnload();
        };
    }, []);

    useAppearanceTheme(settingsStore.appearanceTheme);

    // show nothing while data is loading, except cases after authentication
    if (authStore.requestProcessState !== REQUEST_STATUSES.PENDING
        && settingsStore.checkPermissionsState !== REQUEST_STATUSES.PENDING
        && globalStore.status === REQUEST_STATUSES.PENDING) {
        return null;
    }

    const { requestProcessState, authenticated } = authStore;

    if (!authenticated) {
        return (
            <>
                {requestProcessState === REQUEST_STATUSES.PENDING
                && <Preloader isOpen={requestProcessState === REQUEST_STATUSES.PENDING} />}
                <Authentication />
                <Icons />
            </>
        );
    }

    const {
        canControlProxy,
        hasGlobalError,
        checkPermissionsState,
        hasLimitExceededError,
        promoScreenState,
        displayExclusionScreen,
        canBeExcluded,
        showLimitExceededScreen,
    } = settingsStore;

    const { isOpenEndpointsSearch, isOpenOptionsModal } = uiStore;
    const { premiumPromoEnabled, isPremiumToken } = vpnStore;

    if ((hasGlobalError && !hasLimitExceededError) || !canControlProxy) {
        const showMenuButton = authenticated && canControlProxy;
        return (
            <>
                {checkPermissionsState === REQUEST_STATUSES.PENDING
                && <Preloader isOpen={checkPermissionsState === REQUEST_STATUSES.PENDING} />}
                {isOpenOptionsModal && <ExtraOptions />}
                <Header showMenuButton={showMenuButton} />
                <Icons />
                <GlobalError />
            </>
        );
    }

    if (showLimitExceededScreen || !canControlProxy) {
        return (
            <>
                <Preloader isOpen={checkPermissionsState === REQUEST_STATUSES.PENDING} />
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
            <CSSTransition
                in={isOpenEndpointsSearch}
                timeout={300}
                classNames="fade"
                unmountOnExit
            >
                <Locations />
            </CSSTransition>
            <CSSTransition
                in={
                    (!isPremiumToken
                        && promoScreenState === PROMO_SCREEN_STATES.DISPLAY_ON_POPUP_OPEN
                        && settingsStore.isConnected)
                    || settingsStore.freeUserClickedPremiumLocation
                }
                timeout={300}
                classNames="fade"
                unmountOnExit
            >
                <PromoSale />
            </CSSTransition>
            {displayExclusionScreen && canBeExcluded
                ? <ExclusionsScreen />
                : (
                    <>
                        <Settings />
                        {!hasLimitExceededError && (
                            <div className="footer">
                                {premiumPromoEnabled ? (
                                    <InfoMessage />
                                ) : (
                                    <FeedbackMessage />
                                )}
                                <CurrentEndpoint />
                            </div>
                        )}
                    </>
                )}
            <Icons />
        </>
    );
});
