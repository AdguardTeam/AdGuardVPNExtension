import { getDomain, parse } from 'tldts';
import ipaddr from 'ipaddr.js';

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
    if (ipaddr.isValid(hostname)) {
        return hostname;
    }

    const hostnameWithoutWildcard = cleanHostname(hostname);

    if (isTopLevel(hostnameWithoutWildcard)) {
        return hostnameWithoutWildcard;
    }

    const parts = hostnameWithoutWildcard.split(SEPARATOR);
    let domainParts = parts.splice(parts.length - 2, 2);
    const domain = getDomain(domainParts.join(SEPARATOR));
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
 * @param {string} url
 * @returns {string}
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
 * Returns hostname of url if it was correct, otherwise return input url
 * @param {string | undefined } url
 * @returns {string | null}
 */
export const getHostname = (url: unknown) => {
    if (!url) {
        return null;
    }

    const urlString = String(url);

    const urlObj = getUrlProperties(urlString);

    if (typeof urlObj === 'string') {
        return urlString;
    }

    return urlObj.hostname ? urlObj.hostname : urlString;
};

/**
 * Returns protocol of url if it was correct, otherwise return input url
 * @param {string} url
 * @returns {string}
 */
export const getProtocol = (url: unknown): string | null => {
    if (!url) {
        return null;
    }

    const urlObj = getUrlProperties(url as string);

    if (typeof urlObj === 'string') {
        return url as string;
    }

    return urlObj.protocol ? urlObj.protocol : url as string;
};
