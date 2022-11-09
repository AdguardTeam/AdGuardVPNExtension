import browser from 'webextension-polyfill';
import runtime from './runtime';
import Storage from './storage';

export const browserApi = {
    runtime,
    storage: new Storage(browser),
};
