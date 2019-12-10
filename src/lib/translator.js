import browser from 'webextension-polyfill';

const translate = (key) => {
    return browser.i18n.getMessage(key);
};

const translator = {
    translate,
};

export default translator;
