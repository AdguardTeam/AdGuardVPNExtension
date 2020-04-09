import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import rootStore from '../../stores';

import CurrentEndpoint from './CurrentEndpoint';
import GlobalControl from './GlobalControl';
import Status from './Status';
import SiteInfo from './SiteInfo';
import ServerError from './ServerError';
import Upgrade from './Upgrade';

import './settings.pcss';

const getStatusMessage = (proxyEnabled) => {
    if (proxyEnabled) {
        return 'Connected';
    }
    return 'Disabled';
};

const Settings = observer(() => {
    const { settingsStore, uiStore, vpnStore } = useContext(rootStore);

    const handleEndpointSelectorClick = () => {
        uiStore.openEndpointsSearch();
    };

    const handleConnect = async () => {
        await settingsStore.setProxyState(true);
    };

    const handleDisconnect = async () => {
        await settingsStore.setProxyState(false);
    };

    const {
        switcherEnabled,
        proxyEnabled,
        serverError,
    } = settingsStore;
    const {
        premiumPromoEnabled,
        insufficientTraffic,
        premiumPromoPage,
    } = vpnStore;

    const settingsClass = classnames(
        'settings settings--feedback',
        { 'settings--active': proxyEnabled },
        { 'settings--premium-promo': premiumPromoEnabled }
    );


    if (insufficientTraffic) {
        return (
            <Upgrade premiumPromoPage={premiumPromoPage} />
        );
    }

    return (
        <div className={settingsClass}>
            <div className="settings__main">
                {serverError ? (
                    <ServerError
                        handleClick={handleEndpointSelectorClick}
                    />
                ) : (
                    <>
                        <SiteInfo />
                        <Status status={getStatusMessage(proxyEnabled)} />
                        <GlobalControl
                            handleConnect={handleConnect}
                            handleDisconnect={handleDisconnect}
                            enabled={switcherEnabled}
                        />
                    </>
                )}
            </div>
            <CurrentEndpoint
                handle={handleEndpointSelectorClick}
            />
        </div>
    );
});

export default Settings;
