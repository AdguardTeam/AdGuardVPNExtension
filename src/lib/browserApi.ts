// we don't use webextension-polyfill here because of the bug
// https://github.com/mozilla/webextension-polyfill/issues/16#issuecomment-371355255
declare namespace browser {
    const runtime: typeof chrome.runtime;
}

export const browserApi = chrome || browser;
