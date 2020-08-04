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
import Icons from '../ui/Icons';
import CurrentEndpoint from '../Settings/CurrentEndpoint';
import ExclusionsDisable from '../Settings/ExclusionsDisable';

import rootStore from '../../stores';
import { REQUEST_STATUSES } from '../../stores/consts';
import log from '../../../lib/logger';
import messenger from '../../../lib/messenger';
import notifier from '../../../lib/notifier';
import PromoSale from '../PromoSale';
import { PROMO_SALE_STATUSES } from '../../../lib/constants';

// Set modal app element in the app module because we use multiple modal
Modal.setAppElement('#root');

const App = observer(() => {
    const {
        settingsStore,
        authStore,
        uiStore,
        vpnStore,
        globalStore,
    } = useContext(rootStore);

    useEffect(() => {
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
        ];

        const onUnload = messenger.createLongLivedConnection(events, messageHandler);

        return () => {
            onUnload();
        };
    }, []);

    const { status } = globalStore;

    // show nothing while data is loading
    if (status === REQUEST_STATUSES.PENDING) {
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
        saleVisibleState,
        exclusionStatus,
        canBeExcluded,
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

    return (
        <>
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
                    !isPremiumToken
                    && saleVisibleState === PROMO_SALE_STATUSES.DISPLAY_ON_POPUP_OPEN
                    && settingsStore.isConnected
                }
                timeout={300}
                classNames="fade"
                unmountOnExit
            >
                <PromoSale />
            </CSSTransition>
            {exclusionStatus && canBeExcluded ? <ExclusionsDisable /> : (
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
        </>
    );
});

export default App;
