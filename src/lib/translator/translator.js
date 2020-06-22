import browser from 'webextension-polyfill';
import { formatter } from './formatter';

const translate = (key, values) => {
    const message = browser.i18n.getMessage(key);
    const formatted = formatter(message, values);
    return formatted.join('');
};

/**
 * Creates translation function for strings used in the React components
 * @param React
 * @returns {function} translateReact with bound React
 */
const createReactTranslator = (React) => {
    /**
     * Searches for locale message by key, formats it
     * and returns array of react components or string
     * @param {string} key - message key
     * @param {*} values - object of values used to replace defined nodes in parsed message
     * @returns {ReactNode[]|string}
     */
    const translateReact = (key, values) => {
        const message = browser.i18n.getMessage(key);
        const formatted = formatter(message, values);
        const reactChildren = React.Children.toArray(formatted);
        // if there is only strings in the array we join them
        if (reactChildren.every((child) => typeof child === 'string')) {
            return reactChildren.join('');
        }
        return reactChildren;
    };

    return translateReact;
};

const translator = {
    translate,
    createReactTranslator,
};

export default translator;
