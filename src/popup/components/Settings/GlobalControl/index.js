import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { PROMO_SCREEN_STATES } from '../../../../lib/constants';

const GlobalControl = observer(() => {
    const { settingsStore, vpnStore } = useContext(rootStore);

    const { isExcluded, exclusionsInverted } = settingsStore;

    const connectHandler = async () => {
        await settingsStore.setProxyState(true);
        if (!vpnStore.isPremiumToken
            && settingsStore.promoScreenState === PROMO_SCREEN_STATES.DISPLAY_AFTER_CONNECT_CLICK) {
            await settingsStore.setSalePromoStatus(PROMO_SCREEN_STATES.DISPLAY_ON_POPUP_OPEN);
        }
    };

    const disconnectHandler = async () => {
        await settingsStore.setProxyState(false);
    };

    const addToExclusions = async () => {
        await settingsStore.addToExclusions();
    };

    const removeFromExclusions = async () => {
        await settingsStore.removeFromExclusions();
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
                text: getText(exclusionsInverted),
                handler: addToExclusions,
            },
            remove: {
                text: getText(!exclusionsInverted),
                handler: removeFromExclusions,
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
            className: 'button--outline-secondary',
            message: reactTranslator.getMessage('settings_disconnect'),
            handler: disconnectHandler,
        },
        connecting: {
            className: 'button--outline-secondary button--disabled',
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
