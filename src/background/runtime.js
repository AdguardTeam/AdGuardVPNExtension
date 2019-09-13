import browser from 'webextension-polyfill';

export const getUrl = url => browser.runtime.getURL(url);
