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
import { MESSAGES_TYPES } from '../../../lib/constants';

// Set modal app element in the app module because we use multiple modal
Modal.setAppElement('#root');

const App = observer(() => {
    const {
        settingsStore,
        authStore,
        uiStore,
        vpnInfoStore,
    } = useContext(rootStore);

    useEffect(() => {
        (async () => {
            await settingsStore.getGlobalProxyEnabled();
            await settingsStore.checkProxyControl();
            settingsStore.checkIsWhitelisted();
            authStore.isAuthenticated();
            vpnInfoStore.getVpnInfo();
        })();

        const messageHandler = (message) => {
            if (message.type === MESSAGES_TYPES.VPN_INFO_UPDATED) {
                vpnInfoStore.setVpnInfo(message.data);
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

    const { authenticated } = authStore;
    const { isOpenEndpointsSearch, isOpenOptionsModal, isOpenPreloaderModal } = uiStore;

    if (!authenticated) {
        return (
            <Fragment>
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
            {isOpenPreloaderModal && <Preloader />}
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
