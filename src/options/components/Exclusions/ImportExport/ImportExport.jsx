import React, { useRef, useState, useContext } from 'react';
import { observer } from 'mobx-react';
import FileSaver from 'file-saver';
import JSZip from 'jszip';
import format from 'date-fns/format';
import identity from 'lodash/identity';
import Modal from 'react-modal';

import { reactTranslator } from '../../../../common/reactTranslator';
import { translator } from '../../../../common/translator';
import messenger from '../../../../lib/messenger';
import { rootStore } from '../../../stores';
import { log } from '../../../../lib/logger';
import { isValidExclusion } from '../../../../lib/string-utils';

import './import-export.pcss';

const getCurrentTimeFormatted = () => {
    return format(Date.now(), 'yyyy_MM_dd-HH_mm_ss');
};

const prepareExclusionsForExport = (exclusions) => {
    return exclusions
        .reverse()
        .filter((exclusion) => exclusion.enabled)
        .map((exclusion) => exclusion.hostname)
        .join('\n');
};

const prepareExclusionsAfterImport = (exclusionsString) => {
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

const FILE_EXTENSIONS = {
    REGULAR: '.regular.txt',
    SELECTIVE: '.selective.txt',
    ZIP: '.zip',
    TXT: '.txt',
};

const ZIP_FILENAME = 'exclusions.zip';

const handleRegularExclusionsString = async (exclusionsString) => {
    const regularExclusions = prepareExclusionsAfterImport(exclusionsString);
    const addedExclusions = messenger.addRegularExclusions(regularExclusions);
    return addedExclusions;
};

const handleSelectiveExclusionsString = async (exclusionsString) => {
    const selectiveExclusions = prepareExclusionsAfterImport(exclusionsString);
    const addedExclusions = await messenger.addSelectiveExclusions(selectiveExclusions);
    return addedExclusions;
};

const handleZipExclusionsFile = async (file) => {
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
        return file.name.endsWith(FILE_EXTENSIONS.REGULAR);
    });

    const selectiveExclusionsFile = files.find((file) => {
        return file.name.endsWith(FILE_EXTENSIONS.SELECTIVE);
    });

    if (!regularExclusionsFile && !selectiveExclusionsFile) {
        const requiredExtensionsString = [FILE_EXTENSIONS.REGULAR, FILE_EXTENSIONS.SELECTIVE]
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

    let exclusionsAdded = 0;
    if (regularExclusionsFile) {
        // https://stuk.github.io/jszip/documentation/api_zipobject/async.html
        const regularExclusionsString = await regularExclusionsFile.async('text');
        exclusionsAdded += await handleRegularExclusionsString(regularExclusionsString);
    }

    if (selectiveExclusionsFile) {
        // https://stuk.github.io/jszip/documentation/api_zipobject/async.html
        const selectiveExclusionsString = await selectiveExclusionsFile.async('text');
        exclusionsAdded += await handleSelectiveExclusionsString(selectiveExclusionsString);
    }

    return exclusionsAdded;
};

export const ImportExport = observer(() => {
    const { notificationsStore } = useContext(rootStore);

    const importEl = useRef(null);

    const [isModalOpen, setModalOpenState] = useState(false);
    const [fileContent, setFileContent] = useState('');

    const closeModal = () => {
        setModalOpenState(false);
        setFileContent('');
    };

    const openModal = () => {
        setModalOpenState(true);
    };

    const handleRegularClick = async () => {
        const exclusionsAddedCount = await handleRegularExclusionsString(fileContent);
        notificationsStore.notifySuccess(
            translator.getMessage(
                'options_exclusions_import_successful',
                { count: exclusionsAddedCount },
            ),
        );
        closeModal();
    };

    const handleSelectiveClick = async () => {
        const exclusionsAddedCount = await handleSelectiveExclusionsString(fileContent);
        notificationsStore.notifySuccess(translator.getMessage(
            'options_exclusions_import_successful',
            { count: exclusionsAddedCount },
        ));
        closeModal();
    };

    const handleExclusionsExport = async () => {
        const exclusions = await messenger.getExclusionsData();

        const zip = new JSZip();
        const nowFormatted = getCurrentTimeFormatted();
        zip.file(`${nowFormatted}${FILE_EXTENSIONS.REGULAR}`, prepareExclusionsForExport(exclusions.regular));
        zip.file(`${nowFormatted}${FILE_EXTENSIONS.SELECTIVE}`, prepareExclusionsForExport(exclusions.selective));

        const zipContent = await zip.generateAsync({ type: 'blob' });
        FileSaver.saveAs(zipContent, ZIP_FILENAME);
    };

    const handleExclusionsImport = () => {
        importEl.current.click();
    };

    const fileHandlers = {
        regular: async (file) => {
            const regularExclusionsString = await readFile(file);
            return handleRegularExclusionsString(regularExclusionsString);
        },
        selective: async (file) => {
            const selectiveExclusionsString = await readFile(file);
            return handleSelectiveExclusionsString(selectiveExclusionsString);
        },
        zip: async (file) => {
            return handleZipExclusionsFile(file);
        },
        txt: async (file) => {
            const fileContent = await readFile(file);
            setFileContent(fileContent);
            openModal();
            return null;
        },
    };

    const getFileHandler = (fileName) => {
        switch (true) {
            case (fileName.endsWith(FILE_EXTENSIONS.REGULAR)): {
                return fileHandlers.regular;
            }
            case (fileName.endsWith(FILE_EXTENSIONS.SELECTIVE)): {
                return fileHandlers.selective;
            }
            case (fileName.endsWith(FILE_EXTENSIONS.ZIP)): {
                return fileHandlers.zip;
            }
            case (fileName.endsWith(FILE_EXTENSIONS.TXT)): {
                return fileHandlers.txt;
            }
            default: {
                const errorMessage = translator.getMessage(
                    'options_exclusions_import_error_wrong_extensions',
                    {
                        extensions: Object.values(FILE_EXTENSIONS)
                            .map((ext) => `"${ext}"`)
                            .join(', '),
                    },
                );
                throw new Error(errorMessage);
            }
        }
    };

    const inputChangeHandler = async (e) => {
        const [file] = e.target.files;
        const fileName = file.name;

        // clear input to track consequent file uploads
        e.target.value = '';

        try {
            const handler = getFileHandler(fileName);
            const exclusionsAdded = await handler(file);
            if (exclusionsAdded !== null) {
                notificationsStore.notifySuccess(translator.getMessage(
                    'options_exclusions_import_successful',
                    { count: exclusionsAdded },
                ));
            }
        } catch (e) {
            notificationsStore.notifyError(e.message);
        }
    };

    return (
        <div>
                <Modal
                    isOpen={isModalOpen}
                    className="modal modal--big modal-exclusions-select"
                    overlayClassName="overlay overlay--fullscreen"
                    onRequestClose={closeModal}
                >
                    <button
                        type="button"
                        className="button button--icon checkbox__button modal__close-icon"
                        onClick={closeModal}
                    >
                        <svg className="icon icon--button icon--cross">
                            <use xlinkHref="#cross" />
                        </svg>
                    </button>
                    <div className="modal__title">
                        {reactTranslator.getMessage('options_exclusions_import_select_title')}
                    </div>
                    <div className="modal__buttons">
                        <button
                            type="button"
                            onClick={handleRegularClick}
                            className="button modal__button modal__button--first"
                        >
                            {reactTranslator.getMessage('options_exclusions_import_select_regular')}
                        </button>
                        <button
                            type="button"
                            onClick={handleSelectiveClick}
                            className="button modal__button"
                        >
                            {reactTranslator.getMessage('options_exclusions_import_select_selective')}
                        </button>
                    </div>
                </Modal>
                <input
                    type="file"
                    accept=".txt, .zip"
                    ref={importEl}
                    onChange={inputChangeHandler}
                    style={{ display: 'none' }}
                />
                <button
                    type="button"
                    className="button button--control"
                    onClick={handleExclusionsImport}
                >
                    {reactTranslator.getMessage('settings_exclusions_import_button')}
                </button>
                <button
                    type="button"
                    className="button button--control"
                    onClick={handleExclusionsExport}
                >
                    {reactTranslator.getMessage('settings_exclusions_export_button')}
                </button>
        </div>
    );
});
