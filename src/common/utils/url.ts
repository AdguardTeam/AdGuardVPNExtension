import { getDomain, parse } from 'tldts';
import { isIP } from 'is-ip';

const HTTPS_PROTOCOL = 'https://';

/**
 * Removes wildcard mark from the beginning of hostname.
 *
 * @param hostname
 *
 * @returns Hostname without wildcard mark.
 */
const cleanHostname = (hostname: string): string => {
    const hostnameWithoutWildcard = hostname.replace(/^\*./, '');
    return hostnameWithoutWildcard;
};

/**
 * Checks if provided hostname is top level domain.
 *
 * @param hostname
 *
 * @returns True if hostname is top level domain, false otherwise.
 */
export const isTopLevel = (hostname: string): boolean => {
    const hostnameWithoutWildcard = cleanHostname(hostname);
    const parsed = parse(hostnameWithoutWildcard, { allowPrivateDomains: true });

    return parsed?.publicSuffix === hostname;
};

/**
 * Here eTLD has many meanings:
 * - for regular hostnames returns eTLD + 1
 * - for hostnames presented by ip address returns as is
 * - for hostnames presented by TLD returns TLD
 *
 * @returns TLD or null if it can't be determined.
 */
export const getETld = (hostname: string): string | null => {
    const SEPARATOR = '.';

    // if hostname is ip address we return it unchanged
    if (isIP(hostname)) {
        return hostname;
    }

    const hostnameWithoutWildcard = cleanHostname(hostname);

    if (isTopLevel(hostnameWithoutWildcard)) {
        return hostnameWithoutWildcard;
    }

    const parts = hostnameWithoutWildcard.split(SEPARATOR);
    let domainParts = parts.splice(parts.length - 2, 2);
    // don't validate hostname to be able to add domain longer then 63 symbols
    const domain = getDomain(domainParts.join(SEPARATOR), { validateHostname: false });
    if (domain) {
        return domain;
    }

    while (parts.length > 0) {
        const nextPart = parts.pop();
        if (nextPart) {
            domainParts = [nextPart, ...domainParts];
        }

        const domain = getDomain(domainParts.join(SEPARATOR));
        if (domain) {
            return domain;
        }
    }

    return null;
};

export const getSubdomain = (hostname: string, eTld: string): string => {
    return hostname
        .replace(eTld, '')
        .replace('www.', '')
        .slice(0, -1);
};

/**
 * Returns hostname of url if it was correct, otherwise return input url
 *
 * @param url
 *
 * @returns Hostname or input url if it was incorrect.
 */
const getUrlProperties = (url: string): string | URL => {
    let urlObj;

    try {
        urlObj = new URL(url);
    } catch (e) {
        return url;
    }

    return urlObj;
};

/**
 * Returns protocol of url if it was correct, otherwise return null.
 *
 * @param url
 *
 * @returns Protocol or null if url was incorrect.
 */
export const getProtocol = (url?: string): string | null => {
    if (!url) {
        return null;
    }

    const urlObj = getUrlProperties(url);

    if (typeof urlObj === 'string') {
        return null;
    }

    return urlObj.protocol || null;
};

/**
 * Returns hostname of url if it was correct, otherwise return input url.
 *
 * @param url
 *
 * @returns Hostname or input url if it was incorrect.
 */
export const getHostname = (url: string | undefined | null): string | null => {
    if (!url) {
        return null;
    }

    let urlString = String(url);

    if (urlString.match(/(^|:\/\/)www\./)) {
        urlString = urlString.replace('www.', '');
    }

    if (!getProtocol(urlString)) {
        urlString = `${HTTPS_PROTOCOL}${urlString}`;
    }

    const urlObj = getUrlProperties(urlString);

    if (typeof urlObj === 'string') {
        // if urlObj is string,
        // it means that getUrlProperties got error and returned url,
        // and HTTPS_PROTOCOL has to be removed.
        // it is firefox issue: new URL(<domain>) throws error if domain has wildcard
        return urlString.replace(HTTPS_PROTOCOL, '');
    }

    const hostname = urlObj.hostname.replace('%2A', '*');

    return hostname || urlString;
};

/**
 * Checks if string is wildcard.
 *
 * @param targetString
 *
 * @returns True if string is wildcard, false otherwise.
 */
export const isWildcard = (targetString: string): boolean => {
    return targetString === '*';
};
