import React, { Component } from 'react';
import classNames from 'classnames';
import './header.pcss';

class Header extends Component {
    handleGlobalStatusChange = previousStatus => () => {
        const { handleGlobalStatus } = this.props;
        handleGlobalStatus(!previousStatus);
    };

    renderGlobalStatusButton = (status) => {
        const buttonClasses = {
            button: true,
            global_status: true,
        };
        let text;

        if (status) {
            buttonClasses.global_status__pause = true;
            text = 'pause';
        } else {
            buttonClasses.global_status__start = true;
            text = 'start';
        }

        return (
            <button
                className={classNames(buttonClasses)}
                onClick={this.handleGlobalStatusChange(status)}
            >
                {text}
            </button>
        );
    };

    render() {
        const { globalProxyEnabled } = this.props;
        return (
            <div className="header">
                <div className="title">AdGuard VPN</div>
                <div className="buttons">
                    {this.renderGlobalStatusButton(globalProxyEnabled)}
                    <button className="button settings">settings</button>
                </div>
            </div>
        );
    }
}

export default Header;
