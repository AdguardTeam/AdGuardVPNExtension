import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import rootStore from '../../../stores';
import { PING_WITH_WARNING } from '../../../stores/consts';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

import './status.pcss';

const Status = observer(() => {
    const { settingsStore, vpnStore } = useContext(rootStore);

    const endpointStatus = classnames('status__subtitle', {
        'status__subtitle--disabled': !settingsStore.isConnected,
        'status__subtitle--warning': settingsStore.isConnected && vpnStore.selectedLocationPing >= PING_WITH_WARNING,
        'status__subtitle--success': settingsStore.isConnected && vpnStore.selectedLocationPing < PING_WITH_WARNING,
    });

    const renderVpnStatusSubstring = () => {
        if (settingsStore.isConnected && vpnStore.selectedLocationPing) {
            return reactTranslator.translate('popup_ping_value', {
                pingValue: vpnStore.selectedLocationPing,
            });
        }

        if (settingsStore.isDisconnectedRetrying
            || settingsStore.isConnectingRetrying) {
            return reactTranslator.translate('settings_not_responding');
        }

        return reactTranslator.translate('settings_connection_not_secured');
    };

    const renderVpnStatusTitle = () => {
        if (settingsStore.isConnected) {
            return reactTranslator.translate('settings_vpn_enabled');
        }

        return reactTranslator.translate('settings_vpn_disabled');
    };

    return (
        <div className="status">
            <div className="status__title">
                {renderVpnStatusTitle()}
            </div>
            <div className={endpointStatus}>
                {renderVpnStatusSubstring()}
            </div>
        </div>
    );
});

export default Status;
