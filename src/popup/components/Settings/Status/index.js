import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';

import './status.pcss';

const Status = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        exclusionsInverted,
        isConnected,
        isConnectingIdle,
        isConnectingRetrying,
        displayExclusionScreen,
        canBeExcluded,
    } = settingsStore;

    const renderVpnStatusSubstring = () => {
        return exclusionsInverted
            ? reactTranslator.getMessage('context_menu_selective_mode')
            : reactTranslator.getMessage('context_menu_general_mode');
    };

    const renderVpnStatusTitle = () => {
        if (isConnectingIdle || isConnectingRetrying) {
            return reactTranslator.getMessage('settings_vpn_connecting');
        }

        if (isConnected && !displayExclusionScreen) {
            return reactTranslator.getMessage('settings_vpn_enabled');
        }

        if (isConnected && !canBeExcluded) {
            return reactTranslator.getMessage('settings_vpn_enabled');
        }

        return reactTranslator.getMessage('settings_vpn_disabled');
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
