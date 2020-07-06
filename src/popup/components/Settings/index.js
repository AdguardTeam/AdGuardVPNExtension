import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import rootStore from '../../stores';

import CurrentEndpoint from './CurrentEndpoint';
import GlobalControl from './GlobalControl';
import Status from './Status';
import SiteInfo from './SiteInfo';
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

    const {
        proxyEnabled,
        hasLimitExceededError,
    } = settingsStore;

    const {
        premiumPromoEnabled,
        premiumPromoPage,
    } = vpnStore;

    const settingsClass = classnames(
        'settings',
        { 'settings--active': proxyEnabled },
        { 'settings--premium-promo': premiumPromoEnabled },
        { 'settings--feedback': !premiumPromoEnabled }
    );

    if (hasLimitExceededError) {
        return (
            <Upgrade premiumPromoPage={premiumPromoPage} />
        );
    }

    return (
        <div className={settingsClass}>
            <div className="settings__main">
                <>
                    <SiteInfo />
                    <Status status={getStatusMessage(proxyEnabled)} />
                    <GlobalControl />
                </>
            </div>
            <CurrentEndpoint
                handle={handleEndpointSelectorClick}
            />
        </div>
    );
});

export default Settings;
