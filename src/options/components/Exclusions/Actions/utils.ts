import format from 'date-fns/format';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import identity from 'lodash/identity';

import { isValidExclusion } from '../../../../common/utils/string';
import { messenger } from '../../../../common/messenger';
import { log } from '../../../../common/logger';

/**
 * Parses line-by-line, each line:
 * - Normalized.
 * - Skipped and logged if it's not valid exclusion.
 *
 * @param exclusionsString Raw string content containing all exclusions separated with newline.
 * @returns Array of parsed exclusions.
 */
export const prepareExclusionsAfterImport = (exclusionsString: string) => {
    return exclusionsString
        .split('\n')
        .map((str) => str.trim())
        .filter(identity)
        .filter((exclusionStr) => {
            if (isValidExclusion(exclusionStr)) {
                return true;
            }
            log.debug(`Invalid exclusion: ${exclusionStr}`);
            return false;
        })
        .reverse();
};

/**
 * Exports both general and selective exclusions in zip archive:
 *
 * - exclusions-yyyy_MM_dd-HH_mm_ss.zip
 *   - yyyy_MM_dd-HH_mm_ss.general.txt
 *   - yyyy_MM_dd-HH_mm_ss.selective.txt
 */
export const exportExclusions = async () => {
    const nowFormatted = format(Date.now(), 'yyyy_MM_dd-HH_mm_ss');
    const ZIP_FILENAME = `exclusions-${nowFormatted}.zip`;

    const EXCLUSION_FILES_EXTENSIONS = {
        GENERAL: '.general.txt',
        SELECTIVE: '.selective.txt',
    };

    const zip = new JSZip();

    const generalExclusions = await messenger.getGeneralExclusions();
    const selectiveExclusions = await messenger.getSelectiveExclusions();

    zip.file(`${nowFormatted}${EXCLUSION_FILES_EXTENSIONS.GENERAL}`, generalExclusions);
    zip.file(`${nowFormatted}${EXCLUSION_FILES_EXTENSIONS.SELECTIVE}`, selectiveExclusions);

    const zipContent = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(zipContent, ZIP_FILENAME);
};
