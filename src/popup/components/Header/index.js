import React, { Component } from 'react';
import './header.pcss';
import { uiStore } from '../../stores';

class Header extends Component {
    async handleSettingsClick() {
        uiStore.openOptionsModal(true);
    }

    render() {
        return (
            <div className="header">
                <div className="title">AdGuard VPN</div>
                <div className="buttons">
                    <i
                        role="button"
                        tabIndex="0"
                        className="button button_icon button_icon__settings"
                        onClick={this.handleSettingsClick}
                    />
                </div>
            </div>
        );
    }
}

export default Header;
