import browser from 'webextension-polyfill';

/**
 * This function moved into separate api file, in order to hide unhandled promise errors
 * @param message
 * @param responseCallback
 * @returns {Promise<void>}
 */
const sendMessage = async (message, responseCallback) => {
    if (!responseCallback || typeof responseCallback !== 'function') {
        try {
            await browser.runtime.sendMessage(message);
        } catch (e) {} // eslint-disable-line no-empty
    } else {
        try {
            await browser.runtime.sendMessage(message, responseCallback);
        } catch (e) {} // eslint-disable-line no-empty
    }
};

const browserApi = {
    sendMessage,
};

export default browserApi;
