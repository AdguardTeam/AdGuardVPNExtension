import browser from 'webextension-polyfill';
import { MessageType } from '../lib/constants';

const CREDENTIALS_KEY = 'credentials';
const TOKEN_TYPE = 'bearer';

const credentialsString = sessionStorage.getItem(CREDENTIALS_KEY);

if (credentialsString) {
    const credentials = JSON.parse(credentialsString);
    const authCredentials = {
        ...credentials,
        tokenType: TOKEN_TYPE,
    };

    browser.runtime.sendMessage({
        type: MessageType.AUTHENTICATE_THANKYOU_PAGE,
        data: { authCredentials },
    });
}
