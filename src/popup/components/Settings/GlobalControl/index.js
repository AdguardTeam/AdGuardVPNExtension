import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import rootStore from '../../../stores';

const GlobalControl = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const connectHandler = async () => {
        await settingsStore.setProxyState(true);
    };

    const disconnectHandler = async () => {
        await settingsStore.setProxyState(false);
    };

    const buttonStates = {
        disconnect: {
            className: 'button--outline-secondary',
            message: reactTranslator.translate('settings_disconnect'),
            handler: disconnectHandler,
        },
        connecting: {
            // TODO remove pointer, as during connection we can't press this button
            //  add animation with 1 sec delay
            className: 'button--green-gradient',
            message: 'Connecting', // TODO add to the locale messages
        },
        connect: {
            className: 'button--green-gradient',
            message: reactTranslator.translate('settings_connect'),
            handler: connectHandler,
        },
    };

    let buttonState = buttonStates.connect;

    if (settingsStore.isConnected) {
        buttonState = buttonStates.disconnect;
    } else if (settingsStore.isDisconnectedIdle) {
        buttonState = buttonStates.connect;
    } else if (settingsStore.isDisconnectedRetrying) {
        buttonState = buttonStates.connect;
    } else if (settingsStore.isConnectingRetrying) {
        buttonState = buttonStates.connecting;
    }

    return (
        <button
            type="button"
            className={`button button--medium ${buttonState.className}`}
            onClick={buttonState.handler}
        >
            {buttonState.message}
        </button>
    );
});

export default GlobalControl;
