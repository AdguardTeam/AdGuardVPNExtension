import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import browser from 'webextension-polyfill';
import ReactHtmlParser from 'react-html-parser';
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


const Settings = observer((props) => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const handleEndpointSelectorClick = () => {
        uiStore.openEndpointsSearch();
    };

    const handleSwitchChange = async (e) => {
        const { checked } = e.target;
        await settingsStore.setGlobalProxyEnabled(checked);
    };

    const { canControlProxy } = props;
    const { extensionEnabled, globalError } = settingsStore;

    const renderWarning = () => {
        if (!canControlProxy) {
            return (
                <Warning
                    mod="exclamation"
                    desc="Other extension prevents us from setting up the tunnel. Please disable it in browser settings."
                />
            );
        }
        if (globalError) {
            const errorMsg = browser.i18n.getMessage('global_error_message');
            const errorBlock = (
                <div>
                    { ReactHtmlParser(errorMsg) }
                </div>
            );
            return (
                <Warning
                    mod="exclamation"
                    desc={errorBlock}
                />
            );
        }
        return null;
    };

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
            {renderWarning()}
        </div>
    );
});

export default Settings;
