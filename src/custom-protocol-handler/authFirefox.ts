import qs from 'qs';

import { Prefs } from '../common/prefs';
import { thankYouPageAuthHandler } from '../common/utils/auth';
import { log } from '../common/logger';

const QUERY_STRING_START = '?';

/**
 * Protocol of custom protocol url for the thankyou page for Firefox.
 *
 * Should be the same as used in `protocol_handlers.protocol` in `manifest.firefox.ts`.
 */
const THANKYOU_PAGE_PROTOCOL = 'ext+adguardvpn:';

/**
 * Pathname of custom protocol url for the thankyou page for Firefox.
 */
const THANKYOU_PAGE_HOST = 'authorized-thankyou-page';

/**
 * Origin of custom protocol url for the thankyou page for Firefox.
 */
const THANKYOU_PAGE_ORIGIN = `${THANKYOU_PAGE_PROTOCOL}//${THANKYOU_PAGE_HOST}`;

/**
 * Marker of the start of the hash in the custom protocol url.
 *
 * Should be the same as used in the hash in `protocol_handlers.uriTemplate` in `manifest.firefox.ts`.
 */
const HASH_START = '#matched=';

/**
 * Splits the `str` by `separator` and returns the second item.
 *
 * @param str String to split.
 * @param separator Separator to split by.
 *
 * @returns Second item after splitting or empty string if there is no second item.
 */
const getSecondItemAfterSplit = (str: string, separator: string): string => {
    return str.split(separator)[1] || '';
};

/**
 * Matches the url from the custom protocol handler by the {@link HASH_START} marker.
 *
 * @param href Window.location.href.
 *
 * @returns Matched url.
 */
const getMatchedUrl = (href: string): string => {
    return getSecondItemAfterSplit(href, HASH_START);
};

/**
 * Returns the raw auth data from the matched custom protocol url query string.
 *
 * @param matchedUrl Url matched by the {@link HASH_START} marker.
 * @param pathname Window.location.pathname.
 *
 * @returns Raw auth data from the query string.
 */
const getRawAuthData = (matchedUrl: string, pathname: string): unknown => {
    const queryString = getSecondItemAfterSplit(matchedUrl, `${pathname}${QUERY_STRING_START}`);
    return qs.parse(queryString);
};

/**
 * Authentication on website does not work in Firefox MV3
 * because it has disabled host permissions for all urls by default
 * and content scripts cannot be injected because of that.
 *
 * That's why custom protocol handler is used to open the extension's background page
 * where the auth data is extracted from the url.
 *
 * IMPORTANT: So called "social authentication" is not needed to be handled here
 * because it can only be initiated from the popup (which uses extra property 'state' to match the response).
 */
((): void => {
    if (!Prefs.isFirefox()) {
        return;
    }

    // url from the hash
    const matchedUrlStr = decodeURIComponent(getMatchedUrl(window.location.href)).trim();
    if (matchedUrlStr.length === 0) {
        log.error('Empty matched url');
        return;
    }

    const matchedUrl = new URL(matchedUrlStr);
    const { protocol, host } = matchedUrl;

    if (protocol !== THANKYOU_PAGE_PROTOCOL) {
        log.error(`Unknown protocol: ${protocol}`);
        return;
    }

    if (host !== THANKYOU_PAGE_HOST) {
        log.error(`Unknown host: ${host}`);
        return;
    }

    const data = getRawAuthData(matchedUrlStr, THANKYOU_PAGE_ORIGIN);
    thankYouPageAuthHandler(data);

    window.close();
})();
