import { useContext, useEffect, useRef } from 'react';

import { notifier } from '../../common/notifier';
import { messenger } from '../../common/messenger';
import { MessageType } from '../../common/constants';
import { log } from '../../common/logger';
import { rootStore } from '../stores';
import { Prefs } from '../../common/prefs';

const NOTIFIER_EVENTS = [
    notifier.types.AUTHENTICATE_SOCIAL_SUCCESS,
    notifier.types.EXCLUSIONS_DATA_UPDATED,
    notifier.types.USER_AUTHENTICATED,
    notifier.types.USER_DEAUTHENTICATED,
];

export const useMessageHandler = () => {
    const {
        authStore,
        settingsStore,
        globalStore,
        exclusionsStore,
    } = useContext(rootStore);

    const reloadingRef = useRef<boolean>(false);
    const callbackRef = useRef<(() => Promise<void>) | null>(null);

    const messageHandler = async (message: any) => {
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
                await globalStore.getOptionsData(reloadingRef.current);
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
    };

    /**
     * Subscribe to notification from background page with this method
     * If use runtime.onMessage, then we can intercept messages from popup
     * to the message handler on background page.
     */
    const createMessageListener = async () => {
        return messenger.createEventListener(NOTIFIER_EVENTS, messageHandler);
    };

    const handleBrowserMessage = async (message: any) => {
        const { type } = message;
        if (type === MessageType.UPDATE_LISTENERS) {
            reloadingRef.current = true;
            if (callbackRef.current) {
                callbackRef.current();
            }

            callbackRef.current = await createMessageListener();
        }
    };

    useEffect(() => {
        (async () => {
            callbackRef.current = await createMessageListener();
        })();

        // don't need to add listeners in Firefox mv2,
        // because options page listeners have to be updated in mv3 only
        // TODO: resolve for Firefox mv3
        if (!Prefs.isFirefox()) {
            chrome.runtime.onMessage.addListener(handleBrowserMessage);
        }

        return () => {
            if (callbackRef.current) {
                callbackRef.current();
            }

            // TODO: resolve for Firefox mv3
            if (!Prefs.isFirefox()) {
                chrome.runtime.onMessage.removeListener(handleBrowserMessage);
            }
        };
    }, []);
};
