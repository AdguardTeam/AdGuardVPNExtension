import browser from 'webextension-polyfill';

import { browserApi } from '../browserApi';

// There are different browser actions implementation depending on manifest version:
// old browserAction API for manifest version 2
// Action API for manifest version 3
export const browserAction = browserApi.runtime.isManifestVersion2() ? browser.browserAction : browser.action;
