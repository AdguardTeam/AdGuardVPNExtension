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
}

const ZIP_FILENAME = 'exclusions.zip';

const handleRegularExclusionsString = async (exclusionsString) => {
    const regularExclusions = prepareExclusionsAfterImport(exclusionsString);
    await messenger.addRegularExclusions(regularExclusions);
};

const handleSelectiveExclusionsString = async (exclusionsString) => {
    const selectiveExclusions = prepareExclusionsAfterImport(exclusionsString);
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
        if (file.name.endsWith(FILE_EXTENSIONS.REGULAR)) {
            regularExclusionsFile = file;
        } else if (file.name.endsWith(FILE_EXTENSIONS.SELECTIVE)) {
            selectiveExclusionsFile = file;
        }
    });

    if (!regularExclusionsFile && !selectiveExclusionsFile) {
        const requiredExtensionsString = [FILE_EXTENSIONS.REGULAR, FILE_EXTENSIONS.SELECTIVE]
            .map(ext => `"${ext}"`)
            .join(', ');
        const errorMessage = translator.getMessage(
            `options_exclusions_import_error_wrong_extensions_in_zip`,
            {
                extensions: requiredExtensionsString,
                filename: file.name,
            }
        )
        throw new Error(errorMessage);
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
        await handleRegularExclusionsString(fileContent);
        notificationsStore.notifySuccess(translator.getMessage('options_exclusions_import_successful'));
        closeModal();
    };

    const handleSelectiveClick = async () => {
        await handleSelectiveExclusionsString(fileContent);
        notificationsStore.notifySuccess(translator.getMessage('options_exclusions_import_successful'));
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
            await handleRegularExclusionsString(regularExclusionsString);
        },
        selective: async (file) => {
            const selectiveExclusionsString = await readFile(file);
            await handleSelectiveExclusionsString(selectiveExclusionsString);
        },
        zip: async (file) => {
            await handleZipExclusionsFile(file);
        },
        txt: async (file) => {
            const fileContent = await readFile(file);
            setFileContent(fileContent);
            openModal();
        }
    }

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
                            .map(ext => `"${ext}"`)
                            .join(', '),
                    }
                )
                throw new Error(errorMessage);
            }
        }
    };

    const inputChangeHandler = async (e) => {
        const [file] = e.target.files;
        const fileName = file.name;

        // clear input to track consequent file uploads
        e.target.value = '';

        const handler = getFileHandler(fileName);

        try {
            await handler(file);
            notificationsStore.notifySuccess(translator.getMessage('options_exclusions_import_successful'));
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
