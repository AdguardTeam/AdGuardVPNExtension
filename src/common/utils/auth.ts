import browser from 'webextension-polyfill';

import { log } from '../logger';
import { MessageType } from '../constants';

/**
 * Handle the authentication callback page logic.
 *
 * Send a message to the background script with an response URL.
 *
 * IMPORTANT: In this case, the background page is responsible for the response URL validation,
 * so if any error occurs, it will be logged in the background page console.
 * Otherwise an error will be missed if the error is thrown in the content script
 * because its page closes immediately after the response URL is sent.
 *
 * @param responseUrl The response URL.
 */
export const callbackPageAuthHandler = (responseUrl: string): void => {
    browser.runtime.sendMessage({
        type: MessageType.WEB_AUTH_FLOW_CALLBACK,
        data: { responseUrl },
    }).catch((err) => {
        log.error('Failed to send message:', err);
    });
};
