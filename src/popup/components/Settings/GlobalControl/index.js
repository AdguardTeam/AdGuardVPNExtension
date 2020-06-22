import React from 'react';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

const GlobalControl = ({ handleConnect, handleDisconnect, enabled }) => {
    const buttonsStates = {
        enabled: {
            className: 'button--outline-secondary',
            message: reactTranslator.translate('settings_disconnect'),
            handler: handleDisconnect,
        },
        default: {
            className: 'button--green-gradient',
            message: reactTranslator.translate('settings_connect'),
            handler: handleConnect,
        },
    };

    const buttonState = enabled ? buttonsStates.enabled : buttonsStates.default;

    return (
        <button
            type="button"
            className={`button button--medium ${buttonState.className}`}
            onClick={buttonState.handler}
        >
            {buttonState.message}
        </button>
    );
};

export default GlobalControl;
