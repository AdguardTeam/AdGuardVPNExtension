import React, { Component } from 'react';
import classNames from 'classnames';
import log from '../../../lib/logger';
import background from '../../../lib/background-service';
import './header.pcss';

class Header extends Component {
    handleGlobalStatusChange = previousStatus => () => {
        const { handleGlobalStatus } = this.props;
        handleGlobalStatus(!previousStatus);
    };

    renderGlobalStatusButton = (status) => {
        const buttonClasses = {
            button: true,
            button_icon: true,
        };

        if (status) {
            buttonClasses.button_icon__pause = true;
        } else {
            buttonClasses.button_icon__start = true;
        }

        return (
            <i
                role="button"
                tabIndex="0"
                className={classNames(buttonClasses)}
                onClick={this.handleGlobalStatusChange(status)}
            />
        );
    };

    async handleSettingsClick() {
        const actions = await background.getActionsModule();
        try {
            await actions.openOptionsPage();
        } catch (e) {
            log.error(e);
        }
    }

    render() {
        const { globalProxyEnabled } = this.props;
        return (
            <div className="header">
                <div className="title">AdGuard VPN</div>
                <div className="buttons">
                    {this.renderGlobalStatusButton(globalProxyEnabled)}
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
