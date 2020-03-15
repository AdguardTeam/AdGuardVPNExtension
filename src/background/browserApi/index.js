import browser from 'webextension-polyfill';
import runtime from './runtime';
import Storage from './storage';

const browserApi = {
    runtime,
    storage: new Storage(browser),
};

export default browserApi;
