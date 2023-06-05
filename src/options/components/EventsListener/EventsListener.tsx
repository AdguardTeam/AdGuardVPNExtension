import React, { useContext, useEffect } from 'react';

import { notifier } from '../../../lib/notifier';
import { messenger } from '../../../lib/messenger';
import { log } from '../../../lib/logger';
import { MessageType } from '../../../lib/constants';
import { rootStore } from '../../stores';

export const EventsListener = () => {
    const {
        authStore,
        settingsStore,
        globalStore,
        exclusionsStore,
    } = useContext(rootStore);

    let removeListenerCallback = () => {};

    const createEventListener = async () => {
        const events = [
            notifier.types.AUTHENTICATE_SOCIAL_SUCCESS,
            notifier.types.EXCLUSIONS_DATA_UPDATED,
            notifier.types.USER_AUTHENTICATED,
            notifier.types.USER_DEAUTHENTICATED,
        ];

        // Subscribe to notification from background page with this method
        // If use runtime.onMessage, then we can intercept messages from popup
        // to the message handler on background page
        removeListenerCallback = await messenger.createEventListener(
            events,
            async (message) => {
                const { type } = message;

                switch (type) {
                    case notifier.types.AUTHENTICATE_SOCIAL_SUCCESS: {
                        authStore.setIsAuthenticated(true);
                        break;
                    }
                    case notifier.types.EXCLUSIONS_DATA_UPDATED: {
                        await exclusionsStore.updateExclusionsData();
                        break;
                    }
                    case notifier.types.USER_AUTHENTICATED: {
                        await globalStore.getOptionsData();
                        await settingsStore.updateCurrentUsername();
                        break;
                    }
                    case notifier.types.USER_DEAUTHENTICATED: {
                        authStore.setIsAuthenticated(false);
                        await settingsStore.updateCurrentUsername();
                        break;
                    }
                    default: {
                        log.debug('Undefined message type:', type);
                        break;
                    }
                }
            },
        );
    };

    /**
     * Handles message from service worker
     * @param message
     */
    const messageHandler = async (message: any) => {
        const { type } = message;
        if (type === MessageType.UPDATE_LISTENERS) {
            await createEventListener();
        }
    };

    // @ts-ignore
    const browserApi = chrome || browser;
    // listen for the message after service worker wakes up to update events listeners
    // this listener will work only for MV3
    browserApi.runtime.onMessage.addListener(messageHandler);

    (async () => {
        await createEventListener();
    })();

    useEffect(() => {
        return () => {
            removeListenerCallback();
            browserApi.runtime.onMessage.removeListener(messageHandler);
        };
    }, []);

    return (<span />);
};
