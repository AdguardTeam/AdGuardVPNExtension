import { useContext, useEffect, useRef } from 'react';

import browser, { type Runtime } from 'webextension-polyfill';

import { notifier } from '../../common/notifier';
import { type NotifierMessage, messenger } from '../../common/messenger';
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

    const messageHandler = async (message: NotifierMessage) => {
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

    /**
     * Handle messages from the background page.
     * This function intentionally not async to avoid interception of several
     * listeners. In order to deal with async code we return `true` as result
     * of listener to keep the message channel open until the response is sent.
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#sending_an_asynchronous_response_using_sendresponse}
     *
     * @param message Message from background page.
     * @param sender Sender of the message.
     * @param sendResponse Response function to send response back to the sender.
     *
     * @returns True if message type is UPDATE_LISTENERS to keep the message
     * channel open until the callback is invoked.
     */
    const handleBrowserMessage = (
        message: any,
        sender: Runtime.MessageSender,
        sendResponse: (response: unknown) => void,
        // eslint-disable-next-line consistent-return
    ): any => {
        const { type } = message;
        if (type === MessageType.UPDATE_LISTENERS) {
            reloadingRef.current = true;
            if (callbackRef.current) {
                callbackRef.current();
            }

            createMessageListener().then((callback) => {
                callbackRef.current = callback;

                // By sending a response, we indicate that we have handled
                // the message and that the message channel can be closed.
                sendResponse(null);
            });

            // Return true to keep the message
            // channel open until the callback is invoked
            return true;
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
