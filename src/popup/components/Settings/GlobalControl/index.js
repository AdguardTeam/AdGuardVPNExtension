import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';

const GlobalControl = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const connectHandler = async () => {
        await settingsStore.setProxyState(true);
    };

    const disconnectHandler = async () => {
        await settingsStore.setProxyState(false);
    };

    const disableVpnForCurrentSite = async () => {
        await settingsStore.disableVpnOnCurrentTab();
    };

    const renderExclusionButton = () => {
        return (
            <button
                onClick={disableVpnForCurrentSite}
                type="button"
                className="button button--inline settings__exclusion-btn"
            >
                {reactTranslator.getMessage('popup_settings_disable_vpn')}
            </button>
        );
    };

    const buttonStates = {
        disconnect: {
            className: 'button--background-white',
            message: reactTranslator.getMessage('settings_disconnect'),
            handler: disconnectHandler,
        },
        connecting: {
            className: 'button--background-white button--disabled',
            message: reactTranslator.getMessage('settings_disconnect'),
        },
        connect: {
            className: 'button--green',
            message: reactTranslator.getMessage('settings_connect'),
            handler: connectHandler,
        },
        disconnecting: {
            className: 'button--green button--disabled',
            message: reactTranslator.getMessage('settings_connect'),
        },
    };

    let buttonState;

    switch (true) {
        case (settingsStore.isDisconnectingState): {
            buttonState = buttonStates.disconnecting;
            break;
        }
        case (settingsStore.isConnectingIdle
            || settingsStore.isConnectingRetrying
            || settingsStore.isConnectingState): {
            buttonState = buttonStates.connecting;
            break;
        }
        case (settingsStore.isConnected): {
            buttonState = buttonStates.disconnect;
            break;
        }
        case (settingsStore.isDisconnectedIdle
            || settingsStore.isDisconnectedRetrying): {
            buttonState = buttonStates.connect;
            break;
        }
        default: {
            buttonState = buttonStates.connect;
            break;
        }
    }

    return (
        <>
            <button
                type="button"
                className={`button button--medium ${buttonState.className}`}
                onClick={buttonState.handler}
            >
                {buttonState.message}
            </button>
            {settingsStore.canBeExcluded && renderExclusionButton()}
        </>
    );
});

export default GlobalControl;
