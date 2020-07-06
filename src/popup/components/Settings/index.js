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

const Settings = observer(() => {
    const { settingsStore, vpnStore } = useContext(rootStore);

    const {
        isConnected,
        hasLimitExceededError,
    } = settingsStore;

    const {
        premiumPromoEnabled,
        premiumPromoPage,
    } = vpnStore;

    const settingsClass = classnames(
        'settings',
        { 'settings--active': isConnected },
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
                    <Status />
                    <GlobalControl />
                </>
            </div>
            <CurrentEndpoint />
        </div>
    );
});

export default Settings;
