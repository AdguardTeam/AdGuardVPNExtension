import browser from 'webextension-polyfill';
// TODO figure out how to handle library specific things,
//  it shouldn't be inside translator library
import React from 'react';
import { formatter } from './formatter';

const translate = (key) => {
    const message = browser.i18n.getMessage(key);
    return message;
};

const translateReact = (key, values) => {
    const message = browser.i18n.getMessage(key);
    // TODO handle parse errors, fallback to base locale
    const formatted = formatter(message, values);
    const reactChildren = React.Children.toArray(formatted);
    return reactChildren;
};

const translator = {
    translate,
    translateReact,
};

export default translator;
