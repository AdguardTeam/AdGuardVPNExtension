import browser from 'webextension-polyfill';
import { MessageType } from '../lib/constants';

const AUTH_TOKEN_KEY = 'access_token';

const accessToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
// FIXME remove expiresIn and get it from sessionStorage
const expiresIn = 2909934;

if (accessToken) {
    const credentials = {
        accessToken,
        expiresIn,
        tokenType: 'bearer',
    };

    browser.runtime.sendMessage({
        type: MessageType.AUTHENTICATE_THANKYOU_PAGE,
        data: { credentials },
    });
}
