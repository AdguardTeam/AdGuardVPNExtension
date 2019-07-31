import React, { Component } from 'react';
import classnames from 'classnames';
import uiStore from '../../stores/uiStore';
import Checkbox from './Checkbox';

import './settings.pcss';
import settingsStore from '../../stores/settingsStore';

const SETTINGS_META = {
    onlineTrackingPrevention: {
        id: 'onlineTrackingPrevention',
        title: 'Online tracking prevention',
    },
    malwareProtection: {
        id: 'malwareProtection',
        title: 'Malware protection',
    },
};

const SETTINGS_ORDER = ['onlineTrackingPrevention', 'malwareProtection'];

const getStatusMessage = (extensionEnabled) => {
    if (extensionEnabled) {
        return 'Connected';
    }
    return 'Disabled';
};

class Settings extends Component {
    renderSettings = () => SETTINGS_ORDER.map((settingId) => {
        const setting = SETTINGS_META[settingId];
        return (
            <div key={setting.id} className="setting">
                <Checkbox key={setting.id} setting={setting} />
            </div>
        );
    });

    handleEndpointSelectorClick = () => {
        uiStore.openEndpointsSearch();
    };

    handleSwitchChange = async (e) => {
        const { checked } = e.target;
        await settingsStore.setGlobalProxyEnabled(checked);
    };

    render() {
        const { canControlProxy } = this.props;
        const { extensionEnabled } = settingsStore;

        const extraSettingsClassNames = classnames({
            extra_settings: true,
            extra_settings__enabled: extensionEnabled,
        });

        if (!canControlProxy) {
            return (
                <div className="settings">
                    <p>Other extension prevents us from setting up the tunnel.</p>
                    <p>Please disable it in browser settings</p>
                </div>
            );
        }
        const downArrow = '\u02C5';
        return (
            <div className="settings">
                <div className="main_settings">
                    <div className="endpoint_selector">
                        <div
                            className="endpoint_selector"
                            onClick={this.handleEndpointSelectorClick}
                        >
                            Germany
                            {' '}
                            {downArrow}
                        </div>
                        <div className="status">{getStatusMessage(extensionEnabled)}</div>
                    </div>
                    <div className="global_switcher">
                        <input
                            type="checkbox"
                            onChange={this.handleSwitchChange}
                            checked={settingsStore.extensionEnabled}
                        />
                    </div>
                </div>
                <div className={extraSettingsClassNames}>
                    {this.renderSettings()}
                </div>
            </div>
        );
    }
}

export default Settings;
