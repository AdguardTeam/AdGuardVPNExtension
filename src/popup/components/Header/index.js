import React, { Component } from 'react';
import { observer } from 'mobx-react';
import './header.pcss';
import { uiStore, authStore } from '../../stores';

@observer
class Header extends Component {
    handleSettingsClick() {
        uiStore.openOptionsModal(true);
    }

    async handleFakeDeauthentication() {
        await authStore.deauthenticate();
    }

    render() {
        const { authenticated } = this.props;
        return (
            <div className="header">
                <div className="header__title" onClick={this.handleFakeDeauthentication}>
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
