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

    // TODO add connecting state
    const buttonStates = {
        disconnect: {
            className: 'button--outline-secondary',
            message: reactTranslator.translate('settings_disconnect'),
            handler: disconnectHandler,
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
