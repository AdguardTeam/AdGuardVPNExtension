import browser from 'webextension-polyfill';

import { MessageType } from '../../common/constants';

/**
 * Sends the message to the option's page to update event listeners
 */
export const updateOptionsPageListeners = async (): Promise<void> => {
    try {
        await browser.runtime.sendMessage({ type: MessageType.UPDATE_LISTENERS });
    } catch (e) {
        // ignore error of there is no options page
    }
};
