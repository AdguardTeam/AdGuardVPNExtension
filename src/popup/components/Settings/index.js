import React, { Component } from 'react';
import Checkbox from './Checkbox';

import './settings.pcss';

const SETTINGS_META = {
    currentUrlProxyEnabled: {
        id: 'currentUrlProxyEnabled',
        title: 'Use VPN for lenta.ru',
    },
    onlineTrackingPrevention: {
        id: 'onlineTrackingPrevention',
        title: 'Online tracking prevention',
    },
    malwareProtection: {
        id: 'malwareProtection',
        title: 'Malware protection',
    },
};

const SETTINGS_ORDER = ['currentUrlProxyEnabled', 'onlineTrackingPrevention', 'malwareProtection'];

const renderSettings = () => SETTINGS_ORDER.map((settingId) => {
    const setting = SETTINGS_META[settingId];
    return (
        <div key={setting.id} className="setting">
            <Checkbox key={setting.id} setting={setting} />
        </div>
    );
});

class Settings extends Component {
    render() {
        return (
            <div className="settings">
                {renderSettings()}
            </div>
        );
    }
}

export default Settings;
