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
        const { globalProxyEnabled, canControlProxy } = this.props;

        const settingsClasses = classnames({
            settings: true,
            settings_row: !globalProxyEnabled,
            settings_col: globalProxyEnabled,
        });

        if (!canControlProxy) {
            const settingsClasses = classnames({
                settings: true,
                settings_col: true,
            });
            return (
                <div className={settingsClasses}>
                    <p>Other extension prevents us from setting up the tunnel.</p>
                    <p>Please disable it in browser settings</p>
                </div>
            );
        }
        return (
            <div className={settingsClasses}>
                {globalProxyEnabled ? this.renderSettings() : this.renderEnableButton()}
            </div>
        );
    }
}

export default Settings;
