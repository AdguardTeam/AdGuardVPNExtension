import { log } from '../../../../common/logger';
import { isValidExclusion } from '../../../../common/utils/string';
import {
    getNormalizedExclusionHostname,
    isValidNormalizedExclusionHostname,
} from '../../../../common/utils/exclusionsNormalization';

const NEW_LINE_SEPARATOR = '\n';

/**
 * Splits, trims, normalizes, validates and reverses exclusion lines from imported text.
 *
 * @param exclusionsString Raw text content from an imported file.
 *
 * @returns Valid normalized exclusions in reverse order.
 */
export const prepareExclusionsAfterImport = (exclusionsString: string): string[] => {
    return exclusionsString
        .split(NEW_LINE_SEPARATOR)
        .map((str) => str.trim())
        .filter((str) => str.length > 0)
        .map((exclusionStr) => {
            const normalizedExclusion = getNormalizedExclusionHostname(exclusionStr);

            if (normalizedExclusion && isValidNormalizedExclusionHostname(normalizedExclusion)) {
                return normalizedExclusion;
            }

            // Fallback: accept hostnames with private/non-public TLDs
            // (e.g. nas.local, git.corp) that getETld does not recognize.
            if (normalizedExclusion && isValidExclusion(normalizedExclusion)) {
                return normalizedExclusion;
            }

            log.debug(`[vpn.prepareExclusionsAfterImport]: Invalid exclusion: ${exclusionStr}`);
            return null;
        })
        .filter((exclusion): exclusion is string => exclusion !== null)
        .reverse();
};
