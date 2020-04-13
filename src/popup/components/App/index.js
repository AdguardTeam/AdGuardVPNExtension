import React, {
    useContext,
    useEffect,
} from 'react';
import { observer } from 'mobx-react';
import Modal from 'react-modal';
import browser from 'webextension-polyfill';
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
import { MESSAGES_TYPES } from '../../../lib/constants';
import log from '../../../lib/logger';

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
                case MESSAGES_TYPES.VPN_INFO_UPDATED: {
                    vpnStore.setVpnInfo(data);
                    break;
                }
                case MESSAGES_TYPES.ENDPOINTS_UPDATED: {
                    vpnStore.setAllEndpoints(data);
                    break;
                }
                case MESSAGES_TYPES.ENDPOINTS_PING_UPDATED: {
                    vpnStore.setPing(data);
                    break;
                }
                case MESSAGES_TYPES.CURRENT_ENDPOINT_UPDATED: {
                    vpnStore.setSelectedEndpoint(data);
                    break;
                }
                case MESSAGES_TYPES.PERMISSIONS_ERROR_UPDATE:
                case MESSAGES_TYPES.VPN_TOKEN_NOT_FOUND: {
                    settingsStore.setGlobalError(data);
                    break;
                }
                case MESSAGES_TYPES.EXTENSION_PROXY_ENABLED: {
                    await settingsStore.getProxyStats();
                    settingsStore.getProxyPing();
                    settingsStore.setProxyEnabled(true);
                    break;
                }
                case MESSAGES_TYPES.EXTENSION_PROXY_DISABLED: {
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

        browser.runtime.onMessage.addListener(messageHandler);

        return () => {
            browser.runtime.onMessage.removeListener(messageHandler);
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
