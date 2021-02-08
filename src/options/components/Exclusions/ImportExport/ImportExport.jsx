import React, { useRef } from 'react';
import FileSaver from 'file-saver';
import JSZip from 'jszip';
import format from 'date-fns/format';
import identity from 'lodash/identity';

import { reactTranslator } from '../../../../common/reactTranslator';
import messenger from '../../../../lib/messenger';

const prepareExclusionsContent = (exclusions) => {
    return exclusions
        .reverse()
        .filter((exclusion) => exclusion.enabled)
        .map((exclusion) => exclusion.hostname)
        .join('\n');
};

const getCurrentTimeFormatted = () => {
    return format(Date.now(), 'yyyy_MM_dd-HH_mm_ss');
};

const REGULAR_EXTENSION = '.regular.txt';
const SELECTIVE_EXTENSION = '.selective.txt';
const ZIP_FILENAME = 'exclusions.zip';

const readFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = reject;

        reader.readAsText(file);
    });
};

const prepareExclusions = (exclusionsString) => {
    return exclusionsString
        .split('\n')
        .map((str) => str.trim())
        .filter(identity);
};

const handleRegularExclusionsString = async (exclusionsString) => {
    const regularExclusions = prepareExclusions(exclusionsString);
    await messenger.addRegularExclusions(regularExclusions);
};

const handleSelectiveExclusionsString = async (exclusionsString) => {
    const selectiveExclusions = prepareExclusions(exclusionsString);
    await messenger.addSelectiveExclusions(selectiveExclusions);
};

const handleZipExclusionsFile = async (file) => {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);

    let regularExclusionsFile;
    let selectiveExclusionsFile;

    /**
     * https://stuk.github.io/jszip/documentation/api_jszip/for_each.html
     */
    zipContent.forEach((relativePath, file) => {
        if (file.name.endsWith(REGULAR_EXTENSION)) {
            regularExclusionsFile = file;
        } else if (file.name.endsWith(SELECTIVE_EXTENSION)) {
            selectiveExclusionsFile = file;
        }
    });

    if (!regularExclusionsFile && !selectiveExclusionsFile) {
        // FIXME translate error messages
        throw new Error(`Zip archive: "${file.name}" doesn't contain files with extensions: "${REGULAR_EXTENSION}", ${SELECTIVE_EXTENSION}`);
    }

    if (regularExclusionsFile) {
        // https://stuk.github.io/jszip/documentation/api_zipobject/async.html
        const regularExclusionsString = await regularExclusionsFile.async('text');
        await handleRegularExclusionsString(regularExclusionsString);
    }

    if (selectiveExclusionsFile) {
        // https://stuk.github.io/jszip/documentation/api_zipobject/async.html
        const selectiveExclusionsString = await selectiveExclusionsFile.async('text');
        await handleSelectiveExclusionsString(selectiveExclusionsString);
    }
};

export const ImportExport = () => {
    const importEl = useRef(null);

    const handleExclusionsExport = async () => {
        const exclusions = await messenger.getExclusionsData();

        const zip = new JSZip();
        const nowFormatted = getCurrentTimeFormatted();
        zip.file(`${nowFormatted}${REGULAR_EXTENSION}`, prepareExclusionsContent(exclusions.regular));
        zip.file(`${nowFormatted}${SELECTIVE_EXTENSION}`, prepareExclusionsContent(exclusions.selective));

        const zipContent = await zip.generateAsync({ type: 'blob' });
        FileSaver.saveAs(zipContent, ZIP_FILENAME);
    };

    const handleExclusionsImport = () => {
        importEl.current.click();
    };

    const inputChangeHandler = async (e) => {
        const [file] = e.target.files;
        const fileName = file.name;

        // clear input to track consequent file uploads
        e.target.value = '';

        if (fileName.endsWith(REGULAR_EXTENSION)) {
            const regularExclusionsString = await readFile(file);
            await handleRegularExclusionsString(regularExclusionsString);
        } else if (fileName.endsWith(SELECTIVE_EXTENSION)) {
            const selectiveExclusionsString = await readFile(file);
            await handleSelectiveExclusionsString(selectiveExclusionsString);
        } else if (fileName.endsWith('.zip')) {
            await handleZipExclusionsFile(file);
        } else if (fileName.endsWith('.txt')) {
            // TODO show popup to select to which list append exclusions
        } else {
            // FIXME translate error message
            throw new Error(`Exclusions should have one of extensions: "${REGULAR_EXTENSION}", ${SELECTIVE_EXTENSION}, ".zip"`);
        }
    };

    return (
            <div>
                <input
                    type="file"
                    accept=".txt, .zip"
                    ref={importEl}
                    onChange={inputChangeHandler}
                    style={{ display: 'none' }}
                />
                <button
                    type="button"
                    className="button"
                    onClick={handleExclusionsImport}
                >
                    {reactTranslator.getMessage('settings_exclusions_import_button')}
                </button>
                <button
                    type="button"
                    className="button"
                    onClick={handleExclusionsExport}
                >
                    {reactTranslator.getMessage('settings_exclusions_export_button')}
                </button>
            </div>
    );
};
