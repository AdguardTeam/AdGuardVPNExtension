import React, { Fragment, Component } from 'react';
import { observer } from 'mobx-react';
import Header from '../Header';
import Map from '../Map';
import Settings from '../Settings';
import Footer from '../Footer';
import settingsStore from '../../stores/settingsStore';

@observer
class App extends Component {
    async componentDidMount() {
        await settingsStore.getGlobalProxyEnabled();
        await settingsStore.checkProxyControl();
    }

    handleGlobalStatus = async (value) => {
        await settingsStore.setGlobalProxyEnabled(value);
    };

    render() {
        const {
            extensionEnabled,
            canControlProxy,
        } = settingsStore;
        return (
            <Fragment>
                <Header
                    handleGlobalStatus={this.handleGlobalStatus}
                    globalProxyEnabled={extensionEnabled}
                />
                <Map globalProxyEnabled={extensionEnabled} />
                <Settings
                    canControlProxy={canControlProxy}
                    globalProxyEnabled={extensionEnabled}
                    handleGlobalStatus={this.handleGlobalStatus}
                />
                {extensionEnabled && canControlProxy && <Footer />}
            </Fragment>
        );
    }
}

export default App;
