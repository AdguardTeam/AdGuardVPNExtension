import React, { Fragment, Component } from 'react';
import { observer } from 'mobx-react';
import Header from '../Header';
import Map from '../Map';
import InfoMessage from '../InfoMessage';
import { uiStore, settingsStore, authStore } from '../../stores';
import Endpoints from '../Endpoints';
import SignIn from '../SignIn';
import ExtraOptions from '../ExtraOptions';
import Stats from '../Stats';

@observer
class App extends Component {
    async componentDidMount() {
        await settingsStore.getGlobalProxyEnabled();
        await settingsStore.checkProxyControl();
        await settingsStore.checkIsWhitelisted();
    }

    render() {
        const {
            extensionEnabled,
        } = settingsStore;

        const { authenticated } = authStore;
        const { isOpenEndpointsSearch, isOpenOptionsModal } = uiStore;

        if (!authenticated) {
            return (
                <Fragment>
                    <Header authenticated={authenticated} />
                    <SignIn />
                </Fragment>
            );
        }

        if (isOpenEndpointsSearch) {
            return (
                <Fragment>
                    <Header authenticated={authenticated} />
                    <Endpoints />
                </Fragment>
            );
        }

        return (
            <Fragment>
                {isOpenOptionsModal && <ExtraOptions />}
                <Header authenticated={authenticated} />
                <Map globalProxyEnabled={extensionEnabled} />
                <Stats />
                <InfoMessage />
            </Fragment>
        );
    }
}

export default App;
