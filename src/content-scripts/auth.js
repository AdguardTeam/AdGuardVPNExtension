import browser from 'webextension-polyfill';
import { MESSAGES_TYPES } from '../lib/constants';

browser.runtime.sendMessage({ type: MESSAGES_TYPES.AUTHENTICATE_SOCIAL, queryString: window.location.href.split('#')[1] });
