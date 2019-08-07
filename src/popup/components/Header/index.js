import React, { Component } from 'react';
import './header.pcss';
import { uiStore } from '../../stores';

class Header extends Component {
    async handleSettingsClick() {
        uiStore.openOptionsModal(true);
    }

    render() {
        const { authenticated } = this.props;
        return (
            <div className="header">
                <div className="header__title">
                    <div className="header__logo" />
                    <div className="header__text">
                        <span className="header__text-mark">AdGuard</span>
                        VPN
                    </div>
                </div>
                {authenticated && (
                <button
                    className="button header__setting"
                    role="button"
                    tabIndex="0"
                    onClick={this.handleSettingsClick}
                />
                )}
            </div>
        );
    }
}

Header.defaultProps = {
    authenticated: false,
};

export default Header;
