import React, { Component } from 'react';
import classnames from 'classnames';
import uiStore from '../../stores/uiStore';
import Checkbox from './Checkbox';

import './settings.pcss';
import settingsStore from '../../stores/settingsStore';
import Endpoint from './Endpoint';
import GlobalSwitcher from './GlobalSwitcher';

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
            <div key={setting.id} className="settings__item">
                <Checkbox key={setting.id} setting={setting} />
                <div className="settings__info" />
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
            'settings__extra--disabled': !extensionEnabled,
        });

        if (!canControlProxy) {
            return (
                <div className="settings">
                    <p>Other extension prevents us from setting up the tunnel.</p>
                    <p>Please disable it in browser settings</p>
                </div>
            );
        }
        return (
            <div className="settings">
                <div className="settings__main">
                    <Endpoint
                        handle={this.handleEndpointSelectorClick}
                        status={getStatusMessage(extensionEnabled)}
                    />
                    <GlobalSwitcher
                        handle={this.handleSwitchChange}
                        checked={settingsStore.extensionEnabled}
                    />
                </div>
                <div className={`settings__extra ${extraSettingsClassNames}`}>
                    {this.renderSettings()}
                </div>
            </div>
        );
    }
}

export default Settings;
