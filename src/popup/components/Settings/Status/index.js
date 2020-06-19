import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import translator from '../../../../lib/translator/translator';
import rootStore from '../../../stores';
import { PING_WITH_WARNING } from '../../../stores/consts';

import './status.pcss';

const Status = observer(() => {
    const { settingsStore, vpnStore } = useContext(rootStore);

    const endpointStatus = classnames({
        'status__subtitle--disabled': !settingsStore.displayEnabled,
        'status__subtitle--warning': settingsStore.displayEnabled && vpnStore.selectedLocationPing >= PING_WITH_WARNING,
        'status__subtitle--success': settingsStore.displayEnabled && vpnStore.selectedLocationPing < PING_WITH_WARNING,
    });

    const renderStatus = () => {
        if (!settingsStore.switcherEnabled) {
            return translator.translate('settings_connection_not_secured');
        }

        if (settingsStore.displayEnabled && vpnStore.selectedLocationPing) {
            return translator.translateReact('popup_ping_value', {
                pingValue: vpnStore.selectedLocationPing,
            });
        }

        return translator.translate('settings_connecting');
    };

    const renderTitle = () => {
        if (settingsStore.switcherEnabled) {
            return translator.translate('settings_vpn_enabled');
        }

        return translator.translate('settings_vpn_disabled');
    };

    return (
        <div className="status">
            <div className="status__title">
                {renderTitle()}
            </div>
            <div className={`status__subtitle ${endpointStatus}`}>
                {renderStatus()}
            </div>
        </div>
    );
});

export default Status;
