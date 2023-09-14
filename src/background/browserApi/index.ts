import browser from 'webextension-polyfill';

import { Runtime, runtime } from './runtime';
import { Storage } from './storage';

export type BrowserApi = {
    runtime: Runtime;
    storage: Storage;
};

export const browserApi: BrowserApi = {
    runtime,
    storage: new Storage(browser),
};
