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
                <div className="header__title">
                    <div className="header__logo" />
                    <div className="header__text">
                        <span className="header__text-mark">AdGuard</span> VPN
                    </div>
                </div>
                <button className="button header__setting"
                    role="button"
                    tabIndex="0"
                    onClick={this.handleSettingsClick}
                />
            </div>
        );
    }
}

export default Header;
