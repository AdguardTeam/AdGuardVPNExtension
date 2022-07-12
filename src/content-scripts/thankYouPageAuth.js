import browser from 'webextension-polyfill';
import qs from 'qs';

import { MessageType } from '../lib/constants';

const CREDENTIALS_KEY = 'credentials';
const TOKEN_TYPE = 'bearer';

const credentialsString = sessionStorage.getItem(CREDENTIALS_KEY);

if (credentialsString) {
    const queryString = window.location.href.split('?')[1];
    const queryData = qs.parse(queryString);
    const {
        new_user: newUser,
    } = queryData;

    const isNewUser = !!(parseInt(newUser, 10));
    const credentials = JSON.parse(credentialsString);
    const authCredentials = {
        ...credentials,
        tokenType: TOKEN_TYPE,
    };

    (async () => {
        await browser.runtime.sendMessage({
            type: MessageType.AUTHENTICATE_THANKYOU_PAGE,
            data: { authCredentials, isNewUser },
        });
        // delete credentials from sessionStorage after authentication
        sessionStorage.removeItem(CREDENTIALS_KEY);
    })();
}
