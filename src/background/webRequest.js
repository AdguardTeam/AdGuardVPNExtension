import browser from 'webextension-polyfill';

const onResponseStarted = (callback) => {
    browser.webRequest.onResponseStarted.addListener(callback, { urls: ['<all_urls>'] });
};

const onCompleted = (callback) => {
    browser.webRequest.onCompleted.addListener(callback, { urls: ['<all_urls>'] });
};

export default {
    onResponseStarted,
    onCompleted,
};
