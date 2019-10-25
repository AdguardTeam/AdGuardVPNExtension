import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import browser from 'webextension-polyfill';
import ReactHtmlParser from 'react-html-parser';
import Warning from './Warning';
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


const Settings = observer((props) => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const handleEndpointSelectorClick = () => {
        uiStore.openEndpointsSearch();
    };

    const handleSwitchChange = async (e) => {
        const { checked } = e.target;
        await settingsStore.setGlobalSwitcherState(checked);
    };

    const { canControlProxy } = props;
    const { switcherEnabled, globalError, proxyEnabled } = settingsStore;

    const renderWarning = () => {
        if (!canControlProxy) {
            const warningBlock = (
                <div>
                    { browser.i18n.getMessage('global_error_can_control') }
                </div>
            );
            return (
                <Warning
                    mod="exclamation"
                    desc={warningBlock}
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
                    status={getStatusMessage(proxyEnabled)}
                />
                <GlobalSwitcher
                    handle={handleSwitchChange}
                    checked={switcherEnabled}
                />
            </div>
            {renderWarning()}
        </div>
    );
});

export default Settings;
