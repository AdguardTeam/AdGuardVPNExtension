import {
    useContext,
    useEffect,
    useRef,
} from 'react';
import { notifier } from '../../../lib/notifier';
import { messenger } from '../../../lib/messenger';
import { MessageType } from '../../../lib/constants';
import { log } from '../../../lib/logger';
import { rootStore } from '../../stores';

declare namespace browser {
    const runtime: typeof chrome.runtime;
}

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

        const browserApi = chrome || browser;
        browserApi.runtime.onMessage.addListener(handleBrowserMessage);

        return () => {
            if (callbackRef.current) {
                callbackRef.current();
            }

            browserApi.runtime.onMessage.removeListener(handleBrowserMessage);
        };
    }, []);
};
