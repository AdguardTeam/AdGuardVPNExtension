import React, { Component } from 'react';
import { uiStore, settingsStore } from '../../stores';

import './settings.pcss';
import CurrentEndpoint from './CurrentEndpoint';
import GlobalSwitcher from './GlobalSwitcher';

const getStatusMessage = (extensionEnabled) => {
    if (extensionEnabled) {
        return 'Connected';
    }
    return 'Disabled';
};

class Settings extends Component {
    handleEndpointSelectorClick = () => {
        uiStore.openEndpointsSearch();
    };

    handleSwitchChange = async (e) => {
        const { checked } = e.target;
        await settingsStore.setGlobalProxyEnabled(checked);
    };

    render() {
        const { canControlProxy } = this.props;
        const { extensionEnabled } = settingsStore;

        return (
            <div className="settings">
                <div className="settings__main">
                    <CurrentEndpoint
                        handle={this.handleEndpointSelectorClick}
                        status={getStatusMessage(extensionEnabled)}
                    />
                    <GlobalSwitcher
                        handle={this.handleSwitchChange}
                        checked={settingsStore.extensionEnabled}
                    />
                </div>
                {!canControlProxy && (
                    <div>
                        <p>Other extension prevents us from setting up the tunnel.</p>
                        <p>Please disable it in browser settings</p>
                    </div>
                )}
            </div>
        );
    }
}

export default Settings;
