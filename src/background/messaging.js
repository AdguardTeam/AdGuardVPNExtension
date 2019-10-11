import browser from 'webextension-polyfill';
import { MESSAGES_TYPES } from '../lib/constants';
import auth from './auth';

// message handler used for message exchange with content pages only
// for other cases use global variable "adguard"
// eslint-disable-next-line no-unused-vars
const messagesHandler = (request, sender, sendResponse) => {
    const { type } = request;
    switch (type) {
        case MESSAGES_TYPES.AUTHENTICATE_SOCIAL: {
            const { tab: { id } } = sender;
            const { queryString } = request;
            auth.authenticateSocial(queryString, id);
            break;
        }
        default:
            break;
    }
    return true;
};

const init = () => {
    browser.runtime.onMessage.addListener(messagesHandler);
};

export default {
    init,
};
