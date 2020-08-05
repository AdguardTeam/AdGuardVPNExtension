import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import rootStore from '../../../stores';
import { PROMO_SALE_STATUSES } from '../../../../lib/constants';

const GlobalControl = observer(() => {
    const { settingsStore, vpnStore } = useContext(rootStore);

    const { isExcluded, exclusionsInverted } = settingsStore;

    const connectHandler = async () => {
        await settingsStore.setProxyState(true);
        if (!vpnStore.isPremiumToken
            && settingsStore.saleVisibleState === PROMO_SALE_STATUSES.DISPLAY_BEFORE_CLICK) {
            await settingsStore.setSalePromoStatus(PROMO_SALE_STATUSES.DISPLAY_ON_POPUP_OPEN);
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
            enable: reactTranslator.translate('popup_settings_enable_vpn'),
            disable: reactTranslator.translate('popup_settings_disable_vpn'),
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
            message: reactTranslator.translate('settings_disconnect'),
            handler: disconnectHandler,
        },
        connecting: {
            className: 'button--outline-secondary button--disabled',
            message: reactTranslator.translate('settings_disconnect'),
            handler: disconnectHandler,
        },
        connect: {
            className: 'button--green',
            message: reactTranslator.translate('settings_connect'),
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
