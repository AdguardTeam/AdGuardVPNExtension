import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import rootStore from '../../../stores';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

import './status.pcss';

const Status = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const renderVpnStatusSubstring = () => {
        return settingsStore.exclusionsInverted
            ? reactTranslator.translate('context_menu_selective_mode')
            : reactTranslator.translate('context_menu_regular_mode');
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
