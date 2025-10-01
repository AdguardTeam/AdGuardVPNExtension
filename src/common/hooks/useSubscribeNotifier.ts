import { useEffect, useRef } from 'react';

import browser, { type Runtime } from 'webextension-polyfill';

import { type NotifierType } from '../notifier';
import { type NotifierMessage, messenger } from '../messenger';
import { MessageType } from '../constants';

/**
 * Hook that subscribes for notifier events from background.
 *
 * @param events Events list to subscribe for.
 * @param messageHandler Handler for notifier messages.
 * @param onListenersUpdate Callback for when listeners are updated.
 */
export function useSubscribeNotifier(
    events: NotifierType[],
    messageHandler: (message: NotifierMessage) => Promise<void> | void,
    onListenersUpdate?: () => void,
): void {
    const callbackRef = useRef<(() => Promise<void>) | null>(null);

    /**
     * Subscribe to notification from background page with this method
     * If use runtime.onMessage, then we can intercept messages from popup
     * to the message handler on background page.
     *
     * @returns A function that can be called to remove the event listener subscription.
     */
    const createMessageListener = async (): Promise<() => Promise<void>> => {
        return messenger.createEventListener(events, messageHandler);
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
            if (onListenersUpdate) {
                onListenersUpdate();
            }

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
        (async (): Promise<void> => {
            callbackRef.current = await createMessageListener();
        })();

        browser.runtime.onMessage.addListener(handleBrowserMessage);

        return (): void => {
            if (callbackRef.current) {
                callbackRef.current();
            }

            browser.runtime.onMessage.removeListener(handleBrowserMessage);
        };
    }, []);
}
