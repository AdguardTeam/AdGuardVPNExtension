import browser from 'webextension-polyfill';
import { MessageType } from '../../lib/constants';

/**
 * Sends message to the options page to update event listeners
 */
export const wakeUpOptionsPage = () => {
    browser.runtime.sendMessage({ type: MessageType.UPDATE_LISTENERS })
        // ignore error of there is no options page
        .catch(() => {});
};
