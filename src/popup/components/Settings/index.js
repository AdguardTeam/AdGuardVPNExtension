import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import rootStore from '../../stores';

import './settings.pcss';
import CurrentEndpoint from './CurrentEndpoint';
import GlobalSwitcher from './GlobalSwitcher';

const getStatusMessage = (proxyEnabled) => {
    if (proxyEnabled) {
        return 'Connected';
    }
    return 'Disabled';
};

const Settings = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const handleEndpointSelectorClick = () => {
        uiStore.openEndpointsSearch();
    };

    const handleSwitchChange = async (e) => {
        const { checked } = e.target;
        await settingsStore.setProxyState(checked);
    };

    const {
        switcherEnabled,
        proxyEnabled,
    } = settingsStore;

    return (
        <div className="settings">
            <div className="settings__main">
                <CurrentEndpoint
                    handle={handleEndpointSelectorClick}
                    status={getStatusMessage(proxyEnabled)}
                />
                <GlobalSwitcher
                    handle={handleSwitchChange}
                    checked={switcherEnabled}
                />
            </div>
        </div>
    );
});

export default Settings;
