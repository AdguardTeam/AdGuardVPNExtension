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
    }

    handleGlobalStatus = async (value) => {
        await settingsStore.setGlobalProxyEnabled(value);
    };

    render() {
        const { globalProxyEnabled } = settingsStore;
        console.log(globalProxyEnabled);
        return (
            <Fragment>
                <Header
                    handleGlobalStatus={this.handleGlobalStatus}
                    globalProxyEnabled={globalProxyEnabled}
                />
                <Map />
                <Settings />
                <Footer />
            </Fragment>
        );
    }
}

export default App;
