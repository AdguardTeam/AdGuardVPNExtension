import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import rootStore from '../../../stores';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

import './status.pcss';

const Status = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        isExcluded,
        exclusionsInverted,
        isConnected,
        isConnectingIdle,
        isConnectingRetrying,
    } = settingsStore;

    const renderVpnStatusSubstring = () => {
        return exclusionsInverted
            ? reactTranslator.translate('context_menu_selective_mode')
            : reactTranslator.translate('context_menu_regular_mode');
    };

    const renderVpnStatusTitle = () => {
        if (isConnected) {
            return reactTranslator.translate('settings_vpn_enabled');
        }

        if (isConnectingIdle || isConnectingRetrying) {
            return reactTranslator.translate('settings_connecting');
        }

        if ((isExcluded && !exclusionsInverted) || (isExcluded && exclusionsInverted)) {
            return reactTranslator.translate('settings_vpn_disabled');
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
