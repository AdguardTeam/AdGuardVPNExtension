import browser from 'webextension-polyfill';
import { formatter } from './formatter';

/**
 * Retrieves message from locales by key, using browser.i18n API
 * https://developer.chrome.com/extensions/i18n
 * and formats it
 * @param {string} key - message key
 * @param {Object} values - values for tag nodes and placeholders
 * @returns {string}
 */
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
    /* eslint-disable max-len */
    /**
     * Searches for locale message by key, formats it
     * and returns array of react components or string
     * e.g.
     * message:
     *
     *     "popup_auth_agreement_consent": {
     *          "message": "By using AdGuard VPN, you agree to our <eula>EULA</eula> and <privacy>Privacy Policy</privacy>",
     *          "description": "NOTICE! respect spaces between tags"
     *      },
     *
     * can be translated into next component:
     *
     * const component = reactTranslator.translate('popup_auth_agreement_consent', {
     *          eula: (chunks) => (
     *              <button
     *                  className="auth__privacy-link"
     *                  onClick={handleEulaClick}
     *              >
     *                  {chunks}
     *              </button>
     *          ),
     *          privacy: (chunks) => (
     *              <button
     *                  className="auth__privacy-link"
     *                  onClick={handlePrivacyClick}
     *              >
     *                  {chunks}
     *              </button>
     *          ),
     *
     * Note how functions in the values argument can be used with handlers
     *
     * @param {string} key - message key
     * @param {*} values - object of values used to replace defined nodes in parsed message
     * @returns {ReactNode[]|string}
     */
    /* eslint-enable max-len */
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
