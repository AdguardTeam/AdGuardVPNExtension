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
import Endpoints from '../Endpoints';
import Authentication from '../Authentication';
import ExtraOptions from '../ExtraOptions';
import Preloader from '../Preloader';
import GlobalError from '../GlobalError';
import Settings from '../Settings';
import Icons from '../ui/Icons';

import rootStore from '../../stores';
import { REQUEST_STATUSES } from '../../stores/consts';
import log from '../../../lib/logger';
import messenger from '../../../lib/messenger';
import notifier from '../../../lib/notifier';

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
                case notifier.types.ENDPOINTS_UPDATED: {
                    vpnStore.setLocations(data);
                    break;
                }
                case notifier.types.ENDPOINTS_PING_UPDATED: {
                    vpnStore.setPing(data);
                    break;
                }
                case notifier.types.ENDPOINT_BACKUP_FOUND: {
                    vpnStore.replaceWithBackupEndpoint(data);
                    break;
                }
                case notifier.types.CURRENT_ENDPOINT_UPDATED: {
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
                case notifier.types.PROXY_TURNED_ON: {
                    settingsStore.setProxyEnabled(true);
                    break;
                }
                case notifier.types.PROXY_TURNED_OFF: {
                    settingsStore.setProxyEnabled(false);
                    settingsStore.setSwitcher(false);
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
            notifier.types.ENDPOINTS_UPDATED,
            notifier.types.ENDPOINTS_PING_UPDATED,
            notifier.types.ENDPOINT_BACKUP_FOUND,
            notifier.types.CURRENT_ENDPOINT_UPDATED,
            notifier.types.PERMISSIONS_ERROR_UPDATE,
            notifier.types.PROXY_TURNED_ON,
            notifier.types.PROXY_TURNED_OFF,
            notifier.types.TOKEN_PREMIUM_STATE_UPDATED,
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
    } = settingsStore;

    const { isOpenEndpointsSearch, isOpenOptionsModal } = uiStore;
    const { premiumPromoEnabled } = vpnStore;

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
                <Endpoints />
            </CSSTransition>
            <Settings />
            <div className="footer">
                {premiumPromoEnabled ? (
                    <InfoMessage />
                ) : (
                    <FeedbackMessage />
                )}
            </div>
            <Icons />
        </>
    );
});

export default App;
