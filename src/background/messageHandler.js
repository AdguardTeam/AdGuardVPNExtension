import browser from 'webextension-polyfill';
import { MESSAGES_TYPES } from '../lib/constants';
import auth from './auth';
import popupData from './popupData';

const messagesHandler = async (message, sender) => {
    const { type, data } = message;
    switch (type) {
        case MESSAGES_TYPES.AUTHENTICATE_SOCIAL: {
            const { tab: { id } } = sender;
            const { queryString } = message;
            return auth.authenticateSocial(queryString, id);
        }
        case MESSAGES_TYPES.GET_POPUP_DATA: {
            const { url, numberOfTries } = data;
            // TODO remove get popup data with cancel
            const popupInitData = await popupData.getPopupDataRetry(url, numberOfTries);
            console.log(popupInitData);
            return popupInitData;
        }
        default:
            throw new Error(`Unknown message type received: ${type}`);
    }
    // TODO check if it works if return something else
    return Promise.resolve();
};

const init = () => {
    browser.runtime.onMessage.addListener(messagesHandler);
};

export default {
    init,
};
