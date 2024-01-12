import browser from 'webextension-polyfill';
import qs from 'qs';

import { type SocialAuthData, socialAuthSchema } from '../background/auth/socialAuthSchema';
import { thankYouPageAuthHandler } from '../common/utils/auth';
import { MessageType } from '../lib/constants';
import { log } from '../lib/logger';

/**
 * Check if the current URL contains a valid social auth query string after '#'.
 *
 * @returns Parsed social auth parameters if valid,
 * or `null` if the data is not valid or there is no hash in the URL (AG account login).
 */
function getParsedSocialAuth(): SocialAuthData | null {
    const queryString = window.location.href.split('#')[1];

    // if user logins on website with the AdGuard account,
    // href does not contain any hash related to social auth
    if (typeof queryString === 'undefined') {
        return null;
    }

    const data = qs.parse(queryString);
    try {
        return socialAuthSchema.parse(data);
    } catch (e) {
        log.error('Failed to parse social auth data', e, queryString);
        return null;
    }
}

/**
 * Execute a callback once the document is fully loaded.
 *
 * @param {() => void} callback - Function to execute once the document is ready.
 */
function onDocumentReady(callback: () => void) {
    if (document.readyState !== 'complete') {
        window.addEventListener('load', callback);
    } else {
        callback();
    }
}

/**
 * Determine if the given URL is an absolute path (i.e., doesn't start with http:// or https://).
 *
 * @param {string} url - The URL to check.
 * @returns {boolean} - True if the URL is an absolute path, false otherwise.
 */
function isAbsolutePath(url: string) {
    return !url.startsWith('http://') && !url.startsWith('https://');
}

/**
 * Handles the operations to be performed once the document is ready.
 * Extracts token, newUser, and redirectUrl attributes, and sends them in a message.
 *
 * IMPORTANT: The validation of the data is performed on the background page during authenticateThankYouPage().
 */
function documentReadyHandler() {
    const node = document.querySelector('#data');
    const token = node && node.getAttribute('data-token');
    const newUser = (node && node.getAttribute('data-new-user')) || false;

    let redirectUrl = node && node.getAttribute('data-redirect-url');
    if (redirectUrl && isAbsolutePath(redirectUrl)) {
        const baseUrl = window.location.origin;
        redirectUrl = baseUrl + redirectUrl;
    }

    thankYouPageAuthHandler({ token, redirectUrl, newUser });
}

/**
 * Handle the social authentication logic.
 * Send a message to the background script with the parsed social auth parameters.
 *
 * @param authData - Parsed social auth parameters.
 */
function socialAuthHandler(authData: SocialAuthData) {
    browser.runtime.sendMessage({
        type: MessageType.AUTHENTICATE_SOCIAL,
        data: authData,
    });
}

/**
 * Main function to determine which authentication handler to use.
 * Uses social authentication if the URL contains valid social auth parameters,
 * otherwise waits for the document to be ready.
 */
function main() {
    const socialAuthData = getParsedSocialAuth();
    if (socialAuthData) {
        socialAuthHandler(socialAuthData);
    } else {
        onDocumentReady(() => {
            documentReadyHandler();
        });
    }
}

main();
