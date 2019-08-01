import React, { Fragment, Component } from 'react';
import { observer } from 'mobx-react';
import Header from '../Header';
import Map from '../Map';
import Settings from '../Settings';
import Footer from '../Footer';
import { uiStore, settingsStore } from '../../stores';
import Endpoints from '../Endpoints';
import SignIn from '../SignIn';
import ExtraOptions from '../ExtraOptions';

@observer
class App extends Component {
    async componentDidMount() {
        await settingsStore.getGlobalProxyEnabled();
        await settingsStore.checkProxyControl();
        await settingsStore.checkIsWhitelisted();
    }

    handleGlobalStatus = async (value) => {
        await settingsStore.setGlobalProxyEnabled(value);
    };

    render() {
        const {
            extensionEnabled,
            canControlProxy,
            signedIn,
        } = settingsStore;
        const { isOpenEndpointsSearch, isOpenOptionsModal } = uiStore;
        if (!signedIn) {
            return (
                <Fragment>
                    <Header
                        handleGlobalStatus={this.handleGlobalStatus}
                        globalProxyEnabled={extensionEnabled}
                    />
                    <SignIn />
                </Fragment>
            );
        }
        if (isOpenEndpointsSearch) {
            return (
                <Fragment>
                    <Header
                        handleGlobalStatus={this.handleGlobalStatus}
                        globalProxyEnabled={extensionEnabled}
                    />
                    <Endpoints />
                </Fragment>
            );
        }
        return (
            <Fragment>
                {isOpenOptionsModal && <ExtraOptions />}
                <Header />
                <Map globalProxyEnabled={extensionEnabled} />
                <Settings
                    canControlProxy={canControlProxy}
                    globalProxyEnabled={extensionEnabled}
                    handleGlobalStatus={this.handleGlobalStatus}
                />
                <Footer />
            </Fragment>
        );
    }
}

export default App;
