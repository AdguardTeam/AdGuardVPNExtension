import React, { Component } from 'react';
import classnames from 'classnames';
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

class Settings extends Component {
    renderSettings = () => SETTINGS_ORDER.map((settingId) => {
        const setting = SETTINGS_META[settingId];
        return (
            <div key={setting.id} className="setting">
                <Checkbox key={setting.id} setting={setting} />
            </div>
        );
    });

    handleEnableButtonClick = () => {
        const { handleGlobalStatus } = this.props;
        handleGlobalStatus(true);
    };

    renderEnableButton = () => (
        <div
            className="tunnel-switcher"
            onClick={this.handleEnableButtonClick}
        >
            <i className="button button_icon button_icon__start" />
            <div className="button">Turn on the tunnel</div>
        </div>
    );

    render() {
        const { globalProxyEnabled } = this.props;
        const settingsClasses = classnames({
            settings: true,
            settings_row: !globalProxyEnabled,
            settings_col: globalProxyEnabled,
        });
        return (
            <div className={settingsClasses}>
                {globalProxyEnabled ? this.renderSettings() : this.renderEnableButton()}
            </div>
        );
    }
}

export default Settings;
