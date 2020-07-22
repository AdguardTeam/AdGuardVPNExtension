import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import rootStore from '../../../stores';

const GlobalControl = observer(() => {
    const { settingsStore, vpnStore } = useContext(rootStore);

    const connectHandler = async () => {
        await settingsStore.setProxyState(true);
    };

    const disconnectHandler = async () => {
        await settingsStore.setProxyState(false);
    };

    const showPromoSaleHandler = async () => {
        await settingsStore.setShowPromo(true);
    };

    const buttonStates = {
        disconnect: {
            className: 'button--outline-secondary',
            message: reactTranslator.translate('settings_disconnect'),
            handler: disconnectHandler,
        },
        connecting: {
            className: 'button--outline-secondary button__disabled',
            message: reactTranslator.translate('settings_button_connecting'),
        },
        connect: {
            className: 'button--green',
            message: reactTranslator.translate('settings_connect'),
            handler: connectHandler,
        },
        showSale: {
            className: 'button--green',
            message: reactTranslator.translate('settings_connect'),
            handler: showPromoSaleHandler,
        },
    };

    let buttonState;

    switch (true) {
        case (!vpnStore.isPremiumToken && settingsStore.saleVisibleState): {
            buttonState = buttonStates.showSale;
            break;
        }
        case (settingsStore.isConnected): {
            buttonState = buttonStates.disconnect;
            break;
        }
        case (settingsStore.isConnectingIdle
            || settingsStore.isConnectingRetrying): {
            buttonState = buttonStates.connecting;
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
