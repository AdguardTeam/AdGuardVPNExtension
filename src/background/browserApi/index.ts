import browser from 'webextension-polyfill';

import { type BrowserRuntime, runtime } from './runtime';
import { Storage } from './storage';

export type BrowserApi = {
    runtime: BrowserRuntime;
    storage: Storage;
};

export const browserApi: BrowserApi = {
    runtime,
    storage: new Storage(browser),
};
