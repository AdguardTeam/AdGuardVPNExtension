import React, {
    Fragment,
    useContext,
    useEffect,
} from 'react';
import { observer } from 'mobx-react';
import Header from '../Header';
import Map from '../Map';
import InfoMessage from '../InfoMessage';
import Endpoints from '../Endpoints';
import Authentication from '../Authentication';
import ExtraOptions from '../ExtraOptions';
import Stats from '../Stats';
import Settings from '../Settings';
import rootStore from '../../stores';

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

    const { authenticated } = authStore;
    const { isOpenEndpointsSearch, isOpenOptionsModal } = uiStore;

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
            <Header authenticated={authenticated} />
            <Map globalProxyEnabled={extensionEnabled} />
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
