import JSZip from 'jszip';

import { translator } from '../../../../common/translator';

const EXCLUSIONS_FILES_MARKERS = {
    REGULAR: 'regular.txt',
    SELECTIVE: 'selective.txt',
    ZIP: '.zip',
    TXT: '.txt',
};

export const EXCLUSION_DATA_TYPES = {
    REGULAR: 'regular',
    SELECTIVE: 'selective',
    TXT: 'txt',
};

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

const readZipFile = async (file) => {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);

    // MACOS adds hidden files with same filename, but starting with ".", filter them
    const PATH_SEPARATOR = '/';
    const HIDDEN_FILES_START = '.';
    // https://stuk.github.io/jszip/documentation/api_jszip/filter.html
    const files = zipContent.filter((relativePath, file) => {
        const [last] = file.name.split(PATH_SEPARATOR).reverse();
        return !last.startsWith(HIDDEN_FILES_START);
    });

    const regularExclusionsFile = files.find((file) => {
        return file.name.endsWith(EXCLUSIONS_FILES_MARKERS.REGULAR);
    });

    const selectiveExclusionsFile = files.find((file) => {
        return file.name.endsWith(EXCLUSIONS_FILES_MARKERS.SELECTIVE);
    });

    if (!regularExclusionsFile && !selectiveExclusionsFile) {
        const requiredExtensionsString = [
            EXCLUSIONS_FILES_MARKERS.REGULAR,
            EXCLUSIONS_FILES_MARKERS.SELECTIVE,
        ]
            .map((ext) => `"${ext}"`)
            .join(', ');
        const errorMessage = translator.getMessage(
            'options_exclusions_import_error_wrong_extensions_in_zip',
            {
                extensions: requiredExtensionsString,
                filename: file.name,
            },
        );
        throw new Error(errorMessage);
    }

    const resultExclusions = [];
    if (regularExclusionsFile) {
        // https://stuk.github.io/jszip/documentation/api_zipobject/async.html
        const regularExclusionsString = await regularExclusionsFile.async('text');
        resultExclusions.push({
            type: EXCLUSION_DATA_TYPES.REGULAR,
            content: regularExclusionsString,
        });
    }

    if (selectiveExclusionsFile) {
        // https://stuk.github.io/jszip/documentation/api_zipobject/async.html
        const selectiveExclusionsString = await selectiveExclusionsFile.async('text');
        resultExclusions.push({
            type: EXCLUSION_DATA_TYPES.SELECTIVE,
            content: selectiveExclusionsString,
        });
    }

    return resultExclusions;
};

export const readExclusionsFile = async (file) => {
    const fileName = file.name;
    switch (true) {
        case (fileName.endsWith(`.${EXCLUSIONS_FILES_MARKERS.REGULAR}`)
            || fileName === EXCLUSIONS_FILES_MARKERS.REGULAR): {
            return [{ type: EXCLUSION_DATA_TYPES.REGULAR, content: await readFile(file) }];
        }
        case (fileName.endsWith(`.${EXCLUSIONS_FILES_MARKERS.SELECTIVE}`)
            || fileName === EXCLUSIONS_FILES_MARKERS.SELECTIVE): {
            return [{ type: EXCLUSION_DATA_TYPES.SELECTIVE, content: await readFile(file) }];
        }
        case (fileName.endsWith(EXCLUSIONS_FILES_MARKERS.ZIP)): {
            return readZipFile(file);
        }
        case (fileName.endsWith(EXCLUSIONS_FILES_MARKERS.TXT)): {
            return [{ type: EXCLUSION_DATA_TYPES.TXT, content: await readFile(file) }];
        }
        default: {
            const errorMessage = translator.getMessage(
                'options_exclusions_import_error_wrong_extensions',
                {
                    extensions: Object.values(EXCLUSIONS_FILES_MARKERS)
                        .map((ext) => `"${ext}"`)
                        .join(', '),
                },
            );
            throw new Error(errorMessage);
        }
    }
};
