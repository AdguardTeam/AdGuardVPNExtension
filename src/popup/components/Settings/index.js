import React, { useContext } from 'react';
import Warning from './Warning';
import rootStore from '../../stores';

import './settings.pcss';
import CurrentEndpoint from './CurrentEndpoint';
import GlobalSwitcher from './GlobalSwitcher';

const getStatusMessage = (extensionEnabled) => {
    if (extensionEnabled) {
        return 'Connected';
    }
    return 'Disabled';
};

const Settings = (props) => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const handleEndpointSelectorClick = () => {
        uiStore.openEndpointsSearch();
    };

    const handleSwitchChange = async (e) => {
        const { checked } = e.target;
        await settingsStore.setGlobalProxyEnabled(checked);
    };

    const { canControlProxy } = props;
    const { extensionEnabled } = settingsStore;

    return (
        <div className="settings">
            <div className="settings__main">
                <CurrentEndpoint
                    handle={handleEndpointSelectorClick}
                    status={getStatusMessage(extensionEnabled)}
                />
                <GlobalSwitcher
                    handle={handleSwitchChange}
                    checked={settingsStore.extensionEnabled}
                />
            </div>
            {!canControlProxy && (
            <Warning
                mod="exclamation"
                desc="Other extension prevents us from setting up the tunnel. Please disable it in browser settings."
            />
            )}
        </div>
    );
};

export default Settings;
