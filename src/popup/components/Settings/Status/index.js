import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import rootStore from '../../../stores';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

import './status.pcss';

const Status = observer(() => {
    const { settingsStore, vpnStore } = useContext(rootStore);

    const renderVpnStatusSubstring = () => {
        if (settingsStore.isConnected && vpnStore.selectedLocationPing) {
            return reactTranslator.translate('popup_ping_value', {
                pingValue: vpnStore.selectedLocationPing,
            });
        }

        if (settingsStore.isDisconnectedRetrying) {
            return reactTranslator.translate('settings_not_responding');
        }

        return reactTranslator.translate('settings_connection_not_secured');
    };

    const renderVpnStatusTitle = () => {
        if (settingsStore.isConnected) {
            return reactTranslator.translate('settings_vpn_enabled');
        }

        if (settingsStore.isConnectingIdle || settingsStore.isConnectingRetrying) {
            return reactTranslator.translate('settings_connecting');
        }

        return reactTranslator.translate('settings_vpn_disabled');
    };

    return (
        <div className="status">
            <div className="status__title">
                {renderVpnStatusTitle()}
            </div>
            <div className="status__subtitle">
                {renderVpnStatusSubstring()}
            </div>
        </div>
    );
});

export default Status;
