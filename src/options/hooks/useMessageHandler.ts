import { useContext, useEffect, useRef } from 'react';

import browser from 'webextension-polyfill';

import { notifier } from '../../common/notifier';
import { type Message, messenger } from '../../common/messenger';
import { MessageType, SETTINGS_IDS } from '../../common/constants';
import { log } from '../../common/logger';
import { rootStore } from '../stores';

const NOTIFIER_EVENTS = [
    notifier.types.AUTHENTICATE_SOCIAL_SUCCESS,
    notifier.types.EXCLUSIONS_DATA_UPDATED,
    notifier.types.USER_AUTHENTICATED,
    notifier.types.USER_DEAUTHENTICATED,
    notifier.types.SETTING_UPDATED,
];

export const useMessageHandler = () => {
    const {
        authStore,
        settingsStore,
        globalStore,
        exclusionsStore,
        telemetryStore,
    } = useContext(rootStore);

    const reloadingRef = useRef<boolean>(false);
    const callbackRef = useRef<(() => Promise<void>) | null>(null);

    const messageHandler = async (message: Message) => {
        const { type, data, value } = message;

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
            case notifier.types.SETTING_UPDATED: {
                if (
                    data === SETTINGS_IDS.HELP_US_IMPROVE
                    && typeof value === 'boolean'
                ) {
                    telemetryStore.setIsHelpUsImproveEnabled(value);
                }
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

        browser.runtime.onMessage.addListener(handleBrowserMessage);

        return () => {
            if (callbackRef.current) {
                callbackRef.current();
            }

            browser.runtime.onMessage.removeListener(handleBrowserMessage);
        };
    }, []);
};
