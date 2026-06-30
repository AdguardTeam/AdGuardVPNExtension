import { isIP } from 'is-ip';

import { getETld, getHostname, isKnownPublicSuffix } from './url';

const DOT = '.';
const DOUBLE_DOT_PREFIX = '..';
const WILDCARD_LEADING_DOT_PREFIX = '*..';
const WILDCARD_PREFIX = '*.';
const LEADING_DOT_LENGTH = DOT.length;

/**
 * Checks whether a hostname is a single non-IP label (contains no dot).
 *
 * @param hostname Hostname to check.
 *
 * @returns True if hostname is a single non-IP label.
 */
const isSingleLabel = (hostname: string): boolean => {
    return !isIP(hostname) && !hostname.includes(DOT);
};

/**
 * Checks whether a hostname has a leading-dot form that must never be stored.
 *
 * @param hostname Hostname to check.
 *
 * @returns True if hostname must be rejected without force-add.
 */
export const hasInvalidExclusionHostnameDots = (hostname: string): boolean => {
    const trimmedHostname = hostname.trim();

    if (!trimmedHostname) {
        return false;
    }

    if (trimmedHostname === DOT
        || trimmedHostname.startsWith(DOUBLE_DOT_PREFIX)
        || trimmedHostname.startsWith(WILDCARD_LEADING_DOT_PREFIX)
    ) {
        return true;
    }

    if (!trimmedHostname.startsWith(DOT)) {
        return false;
    }

    const hostnameWithoutLeadingDot = trimmedHostname.slice(LEADING_DOT_LENGTH);
    return !hostnameWithoutLeadingDot || isIP(hostnameWithoutLeadingDot);
};

/**
 * Normalizes an already extracted exclusion hostname.
 *
 * Strips exactly one leading dot from domain/TLD inputs (e.g. `.com` → `com`).
 * Already-valid hostnames (`com`, `*.com`, `example.com`) pass through unchanged.
 *
 * @param hostname Hostname to normalize.
 *
 * @returns Normalized hostname, or null when input must be rejected.
 */
export const normalizeExclusionHostname = (hostname: string): string | null => {
    const trimmedHostname = hostname.trim();

    if (!trimmedHostname || hasInvalidExclusionHostnameDots(trimmedHostname)) {
        return null;
    }

    if (trimmedHostname.startsWith(DOT)) {
        return trimmedHostname.slice(LEADING_DOT_LENGTH);
    }

    return trimmedHostname;
};

/**
 * Extracts and normalizes an exclusion hostname from user input or URL.
 *
 * @param url User-entered exclusion URL or hostname.
 *
 * @returns Normalized hostname, or null when input must be rejected.
 */
export const getNormalizedExclusionHostname = (url: string | undefined | null): string | null => {
    const trimmedUrl = typeof url === 'string' ? url.trim() : url;
    const hostname = getHostname(trimmedUrl);

    if (!hostname) {
        return null;
    }

    return normalizeExclusionHostname(hostname);
};

/**
 * Checks whether a normalized exclusion hostname can be processed by exclusions.
 *
 * @param hostname Normalized hostname.
 *
 * @returns True if hostname is a valid exclusion hostname.
 */
export const isValidNormalizedExclusionHostname = (hostname: string): boolean => {
    /**
     * tldts treats any single label (e.g. "aaaaa") as a top-level suffix,
     * so getETld returns truthy for meaningless bare strings. Reject
     * single-label hostnames that are not real ICANN or private suffixes.
     */
    if (isSingleLabel(hostname) && !isKnownPublicSuffix(hostname)) {
        return false;
    }

    return !!getETld(hostname);
};

/**
 * Exclusion input validity categories for the manual-add flow.
 */
export enum ExclusionInputCategory {
    /**
     * Real domain — added directly without confirmation.
     */
    Valid = 'valid',

    /**
     * TLD-only known suffix (e.g. "com") — added via force-add confirmation.
     */
    Confirmable = 'confirmable',

    /**
     * Malformed or non-existing TLD (e.g. "aaaaa") — rejected with inline error.
     */
    Invalid = 'invalid',
}

/**
 * Classifies exclusion input into a validity category.
 *
 * @param url User-entered exclusion URL or hostname.
 *
 * @returns Category describing how the input should be handled.
 */
export const getExclusionInputCategory = (url: string): ExclusionInputCategory => {
    const hostname = getNormalizedExclusionHostname(url);

    // Malformed input (e.g. "..com", ".", ".127.0.0.1") cannot be normalized.
    if (!hostname) {
        return ExclusionInputCategory.Invalid;
    }

    // Single-label hostnames and wildcard TLD-only inputs (e.g. "com", "*.com"):
    // known suffix is confirmable, unknown (e.g. "aaaaa", "*.aaaaa") is invalid.
    if (!isIP(hostname)) {
        const label = hostname.startsWith(WILDCARD_PREFIX)
            ? hostname.slice(WILDCARD_PREFIX.length)
            : hostname;

        if (isSingleLabel(label)) {
            return isKnownPublicSuffix(label)
                ? ExclusionInputCategory.Confirmable
                : ExclusionInputCategory.Invalid;
        }
    }

    return isValidNormalizedExclusionHostname(hostname)
        ? ExclusionInputCategory.Valid
        : ExclusionInputCategory.Invalid;
};
