import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { ExcludeSite } from './ExcludeSite/ExcludeSite';

type ButtonStates = {
    [key: string]: {
        className: string,
        message: React.ReactNode,
        handler?: () => Promise<void>,
    }
};

export const GlobalControl = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const connectHandler = async (): Promise<void> => {
        await settingsStore.setProxyState(true);
    };

    const disconnectHandler = async (): Promise<void> => {
        await settingsStore.setProxyState(false);
    };

    const buttonStates: ButtonStates = {
        disconnect: {
            className: 'button--background-white',
            message: reactTranslator.getMessage('settings_disconnect'),
            handler: disconnectHandler,
        },
        connecting: {
            className: 'button--background-white',
            message: reactTranslator.getMessage('settings_disconnect'),
            handler: disconnectHandler,
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
        case (settingsStore.isConnectingIdle):
        case (settingsStore.isConnectingRetrying): {
            buttonState = buttonStates.connecting;
            break;
        }
        case (settingsStore.isIdle):
        case (settingsStore.isDisconnectedIdle):
        case (settingsStore.isDisconnectedRetrying): {
            buttonState = buttonStates.connect;
            break;
        }
        default: {
            buttonState = buttonStates.connect;
            break;
        }
    }

    // check if the warning should be shown. AG-25941
    if (settingsStore.isVpnBlocked) {
        // no need for the warning if a user is connected successfully
        if (settingsStore.isConnected) {
            // close only the notice if it was shown
            uiStore.closeVpnBlockedErrorNotice();
            // but do not close the details with problem description
        } else {
            // the warning should be shown again if it was closed manually and a user is trying to connect
            uiStore.openVpnBlockedErrorNotice();
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
            {settingsStore.canBeExcluded && <ExcludeSite />}
        </>
    );
});
