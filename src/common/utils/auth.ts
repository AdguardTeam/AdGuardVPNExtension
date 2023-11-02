import browser from 'webextension-polyfill';

import { log } from '../../lib/logger';
import { MessageType } from '../../lib/constants';

/**
 * Handle the website authentication logic.
 *
 * Send a message to the background script with an auth data.
 *
 * IMPORTANT: An auth data is `unknown`, so it shall be parsed on background page.
 * In this case, the background page is responsible for the auth data validation,
 * so if any error occurs, it will be logged in the background page console.
 * Otherwise an error will be missed if the error is thrown in the content script
 * because its page closes immediately after the auth data is sent.
 *
 * @param data Auth data.
 */
export const thankYouPageAuthHandler = (data: unknown): void => {
    browser.runtime.sendMessage({
        type: MessageType.AUTHENTICATE_THANKYOU_PAGE,
        data,
    }).catch((err) => {
        log.error('Failed to send message:', err);
    });
};
