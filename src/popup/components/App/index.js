import React, {
    Fragment,
    useContext,
    useEffect,
} from 'react';
import { observer } from 'mobx-react';
import Modal from 'react-modal';
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

// Set modal app element in the app module because we use multiple modal
Modal.setAppElement('#root');

const App = observer(() => {
    const { settingsStore, authStore, uiStore } = useContext(rootStore);
    useEffect(() => {
        (async () => {
            await settingsStore.getGlobalProxyEnabled();
            await settingsStore.checkProxyControl();
            await settingsStore.checkIsWhitelisted();
            await authStore.isAuthenticated();
        })();
    }, []);

    const {
        extensionEnabled,
        canControlProxy,
    } = settingsStore;

    const { state: requestProcessState, authenticated } = authStore;
    const { isOpenEndpointsSearch, isOpenOptionsModal } = uiStore;

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
