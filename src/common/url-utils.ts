import { getDomain, parse } from 'tldts';
import { isIP } from 'is-ip';

// TODO: move this file to common/utils directory

const HTTPS_PROTOCOL = 'https://';

/**
 * Removes wildcard mark from the beginning of hostname
 * @param hostname
 */
export const cleanHostname = (hostname: string) => {
    const hostnameWithoutWildcard = hostname.replace(/^\*./, '');
    return hostnameWithoutWildcard;
};

/**
 * Checks if provided hostname is top level domain
 * @param hostname
 */
export const isTopLevel = (hostname: string) => {
    const hostnameWithoutWildcard = cleanHostname(hostname);
    const parsed = parse(hostnameWithoutWildcard, { allowPrivateDomains: true });

    return parsed?.publicSuffix === hostname;
};

/**
 * Here eTLD has many meanings:
 * - for regular hostnames returns eTLD + 1
 * - for hostnames presented by ip address returns as is
 * - for hostnames presented by TLD returns TLD
 */
export const getETld = (hostname: string) => {
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

export const getSubdomain = (hostname: string, eTld: string) => {
    return hostname
        .replace(eTld, '')
        .replace('www.', '')
        .slice(0, -1);
};

/**
 * Returns hostname of url if it was correct, otherwise return input url
 * @param url
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
 * Returns protocol of url if it was correct, otherwise return null
 * @param url
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
 * Returns hostname of url if it was correct, otherwise return input url
 * @param url
 */
export const getHostname = (url: string | undefined | null) => {
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
 * Checks if string is wildcard
 * @param targetString
 */
export const isWildcard = (targetString: string) => {
    return targetString === '*';
};
