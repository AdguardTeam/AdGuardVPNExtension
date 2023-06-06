declare namespace browser {
    const runtime: typeof chrome.runtime;
}

export const browserApi = chrome || browser;
