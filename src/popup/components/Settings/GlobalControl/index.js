import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';

const GlobalControl = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { isExcluded, exclusionsInverted } = settingsStore;

    const connectHandler = async () => {
        await settingsStore.setProxyState(true);
    };

    const disconnectHandler = async () => {
        await settingsStore.setProxyState(false);
    };

    const disableVpnForCurrentSite = async () => {
        await settingsStore.disableVpnOnCurrentTab();
    };

    const enableVpnForCurrentSite = async () => {
        await settingsStore.enableVpnOnCurrentTab();
    };

    const renderExclusionButton = (isExcluded, exclusionsInverted) => {
        const texts = {
            enable: reactTranslator.getMessage('popup_settings_enable_vpn'),
            disable: reactTranslator.getMessage('popup_settings_disable_vpn'),
        };

        const getText = (enable) => {
            if (enable) {
                return texts.enable;
            }
            return texts.disable;
        };

        const buttonsInfo = {
            add: {
                text: getText(!exclusionsInverted),
                handler: disableVpnForCurrentSite,
            },
            remove: {
                text: getText(exclusionsInverted),
                handler: enableVpnForCurrentSite,
            },
        };

        const button = isExcluded ? buttonsInfo.remove : buttonsInfo.add;

        return (
            <button
                onClick={button.handler}
                type="button"
                className="button button--inline settings__exclusion-btn"
            >
                {button.text}
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
    };

    let buttonState;

    switch (true) {
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
        <>
            <button
                type="button"
                className={`button button--medium ${buttonState.className}`}
                onClick={buttonState.handler}
            >
                {buttonState.message}
            </button>
            {settingsStore.canBeExcluded && renderExclusionButton(isExcluded, exclusionsInverted)}
        </>
    );
});

export default GlobalControl;
