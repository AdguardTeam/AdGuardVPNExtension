import browser from 'webextension-polyfill';

/**
 * This function moved into separate api file, in order to hide unhandled promise errors
 * @param args
 * @returns {Promise<void>}
 */
const sendMessage = async (...args) => {
    try {
        await browser.runtime.sendMessage(...args);
    } catch (e) {
        // ignore
    }
};

export const getUrl = (url) => browser.runtime.getURL(url);

const getManifest = () => {
    return browser.runtime.getManifest();
};

export default {
    sendMessage,
    getManifest,
};
