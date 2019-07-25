import React, { Fragment, Component } from 'react';
import Header from '../Header';
import Map from '../Map';
import Settings from '../Settings';
import Footer from '../Footer';
import background from '../../../lib/background-service';

const globalProxyEnabledId = 'globalProxyEnabled';

class App extends Component {
    state = {
        globalProxyEnabled: false,
    };

    async componentDidMount() {
        const settings = await background.getSettings();
        const globalProxyEnabled = settings.getSetting(globalProxyEnabledId);
        this.setState({ globalProxyEnabled: globalProxyEnabled.value });
    }

    handleGlobalStatus = async (newGlobalStatus) => {
        let changed;
        try {
            const settings = await background.getSettings();
            changed = settings.setSetting(globalProxyEnabledId, newGlobalStatus);
        } catch (e) {
            console.log(e);
        }
        if (changed) {
            this.setState({ globalProxyEnabled: newGlobalStatus });
        }
    };

    render() {
        const { globalProxyEnabled } = this.state;
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
