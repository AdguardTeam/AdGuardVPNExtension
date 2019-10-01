import React, {
    Fragment,
    useContext,
    useEffect,
} from 'react';
import { observer } from 'mobx-react';
import Modal from 'react-modal';
import browser from 'webextension-polyfill';
import Header from '../Header';
import MapContainer from '../MapContainer';
import InfoMessage from '../InfoMessage';
import Endpoints from '../Endpoints';
import Authentication from '../Authentication';
import ExtraOptions from '../ExtraOptions';
import Preloader from '../Preloader';
import Stats from '../Stats';
import Settings from '../Settings';
import rootStore from '../../stores';
import { REQUEST_STATUSES } from '../../stores/consts';
import { MESSAGES_TYPES } from '../../../lib/constants';

// Set modal app element in the app module because we use multiple modal
Modal.setAppElement('#root');

const App = observer(() => {
    const {
        settingsStore,
        authStore,
        uiStore,
        vpnStore,
    } = useContext(rootStore);

    useEffect(() => {
        (async () => {
            await settingsStore.getGlobalProxyEnabled();
            await settingsStore.checkProxyControl();
            settingsStore.checkIsWhitelisted();
            authStore.isAuthenticated();
            vpnStore.getVpnInfo();
        })();

        const messageHandler = (message) => {
            const { type, data } = message;

            switch (type) {
                case MESSAGES_TYPES.VPN_INFO_UPDATED: {
                    vpnStore.setVpnInfo(data);
                    break;
                }
                case MESSAGES_TYPES.ENDPOINTS_UPDATED: {
                    vpnStore.setEndpoints(data);
                    break;
                }
                default: {
                    console.log('there is no such message type: ', type);
                    break;
                }
            }
        };

        browser.runtime.onMessage.addListener(messageHandler);

        return () => {
            browser.runtime.onMessage.removeListener(messageHandler);
        };
    }, []);

    const {
        extensionEnabled,
        canControlProxy,
    } = settingsStore;

    const { state: requestProcessState, authenticated, receivedAuthenticationInfo } = authStore;
    const { isOpenEndpointsSearch, isOpenOptionsModal } = uiStore;

    if (!receivedAuthenticationInfo) {
        return (
            <Fragment>
                {requestProcessState === REQUEST_STATUSES.PENDING
                    && <Preloader />
                }
            </Fragment>
        );
    }

    if (!authenticated) {
        return (
            <Fragment>
                {requestProcessState === REQUEST_STATUSES.PENDING
                    && <Preloader />
                }
                <Header authenticated={authenticated} />
                <Authentication />
            </Fragment>
        );
    }

    if (isOpenEndpointsSearch) {
        return (
            <Fragment>
                <Header authenticated={authenticated} />
                <Endpoints />
                {canControlProxy && <InfoMessage />}
            </Fragment>
        );
    }

    return (
        <Fragment>
            {isOpenOptionsModal && <ExtraOptions />}
            <Header authenticated={authenticated} />
            <MapContainer globalProxyEnabled={extensionEnabled} />
            <Settings
                canControlProxy={canControlProxy}
                globalProxyEnabled={extensionEnabled}
            />
            {canControlProxy && <Stats />}
            {canControlProxy && <InfoMessage />}
        </Fragment>
    );
});

export default App;
