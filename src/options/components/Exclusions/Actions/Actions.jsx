/* eslint-disable no-await-in-loop */
import React, { useContext, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import FileSaver from 'file-saver';
import JSZip from 'jszip';
import format from 'date-fns/format';
import identity from 'lodash/identity';

import { reactTranslator } from '../../../../common/reactTranslator';
import { translator } from '../../../../common/translator';
import messenger from '../../../../lib/messenger';
import { rootStore } from '../../../stores';
import { log } from '../../../../lib/logger';
import { isValidExclusion } from '../../../../lib/string-utils';
import { readExclusionsFile, EXCLUSION_DATA_TYPES } from './fileHelpers';
import { SelectListModal } from '../ExclusionsModal/SelectListModal';
import { RemoveExclusionsModal } from '../ExclusionsModal/RemoveExclusionsModal';

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

const EXCLUSION_FILES_EXTENSIONS = {
    REGULAR: '.regular.txt',
    SELECTIVE: '.selective.txt',
};

const ZIP_FILENAME = 'exclusions.zip';

const handleRegularExclusionsString = async (exclusionsString) => {
    const regularExclusions = prepareExclusionsAfterImport(exclusionsString);
    return messenger.addRegularExclusions(regularExclusions);
};

const handleSelectiveExclusionsString = async (exclusionsString) => {
    const selectiveExclusions = prepareExclusionsAfterImport(exclusionsString);
    return messenger.addSelectiveExclusions(selectiveExclusions);
};

const handleExclusionsExport = async () => {
    const exclusions = await messenger.getExclusionsData();

    const zip = new JSZip();
    const nowFormatted = getCurrentTimeFormatted();
    zip.file(`${nowFormatted}${EXCLUSION_FILES_EXTENSIONS.REGULAR}`, prepareExclusionsForExport(exclusions.regular));
    zip.file(`${nowFormatted}${EXCLUSION_FILES_EXTENSIONS.SELECTIVE}`, prepareExclusionsForExport(exclusions.selective));

    const zipContent = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(zipContent, ZIP_FILENAME);
};

export const Actions = observer(() => {
    const { notificationsStore, settingsStore } = useContext(rootStore);

    const importEl = useRef(null);

    const [isSelectListModalOpen, setSelectListModalState] = useState(false);
    const [isApproveDeleteModalOpen, setApproveDeleteModalState] = useState(false);
    const [fileContent, setFileContent] = useState('');

    const closeSelectListModal = () => {
        setSelectListModalState(false);
        setFileContent('');
    };

    const openSelectListModal = () => {
        setSelectListModalState(true);
    };

    const handleRegularClick = async () => {
        const exclusionsAddedCount = await handleRegularExclusionsString(fileContent);
        notificationsStore.notifySuccess(
            translator.getMessage(
                'options_exclusions_import_successful',
                { count: exclusionsAddedCount },
            ),
        );
        closeSelectListModal();
    };

    const handleSelectiveClick = async () => {
        const exclusionsAddedCount = await handleSelectiveExclusionsString(fileContent);
        notificationsStore.notifySuccess(translator.getMessage(
            'options_exclusions_import_successful',
            { count: exclusionsAddedCount },
        ));
        closeSelectListModal();
    };

    const handleExclusionsImport = () => {
        importEl.current.click();
    };

    const handleTxtExclusionsData = (content) => {
        setFileContent(content);
        openSelectListModal();
        return null;
    };

    const handleExclusionsData = async (exclusionsData) => {
        const txtExclusionsData = exclusionsData.find((d) => d.type === EXCLUSION_DATA_TYPES.TXT);
        if (txtExclusionsData) {
            return handleTxtExclusionsData(txtExclusionsData.content);
        }

        let addedExclusions = 0;

        for (let i = 0; i < exclusionsData.length; i += 1) {
            const { type, content } = exclusionsData[i];
            if (type === EXCLUSION_DATA_TYPES.REGULAR) {
                addedExclusions += await handleRegularExclusionsString(content);
            } else if (type === EXCLUSION_DATA_TYPES.SELECTIVE) {
                addedExclusions += await handleSelectiveExclusionsString(content);
            }
        }

        return addedExclusions;
    };

    const inputChangeHandler = async (e) => {
        const [file] = e.target.files;

        // clear input to track consequent file uploads
        e.target.value = '';

        try {
            const exclusionsData = await readExclusionsFile(file);
            const exclusionsAdded = await handleExclusionsData(exclusionsData);
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

    const closeApproveDeleteModal = () => {
        setApproveDeleteModalState(false);
    };

    const openApproveDeleteModal = () => {
        setApproveDeleteModalState(true);
    };

    const handleExclusionsDelete = () => {
        openApproveDeleteModal();
    };

    const handleCancelDeleteExclusionsClick = () => {
        closeApproveDeleteModal();
    };

    const handleDeleteExclusionsClick = async () => {
        await settingsStore.deleteCurrentModeExclusions();
        closeApproveDeleteModal();
    };

    return (
        <div>
            <SelectListModal
                isOpen={isSelectListModalOpen}
                closeModal={closeSelectListModal}
                handleRegularClick={handleRegularClick}
                handleSelectiveClick={handleSelectiveClick}
            />
            <RemoveExclusionsModal
                isOpen={isApproveDeleteModalOpen}
                closeModal={closeApproveDeleteModal}
                handleCancelClick={handleCancelDeleteExclusionsClick}
                handleDeleteClick={handleDeleteExclusionsClick}
                currentMode={settingsStore.exclusionsCurrentMode}
            />
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
            <button
                type="button"
                className="button button--control"
                onClick={handleExclusionsDelete}
            >
                {reactTranslator.getMessage('settings_exclusions_delete_button')}
            </button>
        </div>
    );
});
