/* eslint-disable no-await-in-loop */
import React, { useContext, useState, useRef } from 'react';
import { observer } from 'mobx-react';

import identity from 'lodash/identity';
import format from 'date-fns/format';
import JSZip from 'jszip';
import FileSaver from 'file-saver';

import { rootStore } from '../../../stores';
import { translator } from '../../../../common/translator';
import { isValidExclusion } from '../../../../common/utils/string';
import { type ExclusionsContentMap } from '../../../../common/constants';
import { log } from '../../../../common/logger';
import { messenger } from '../../../../common/messenger';
import { ExclusionsMode } from '../../../../common/exclusionsConstants';
import { Select } from '../../ui/Select';

import { SelectListModal } from './SelectListModal';
import { ExclusionDataType, type ExclusionsImportData, readExclusionsFile } from './fileHelpers';
import { RemoveAllModal } from './RemoveAllModal';

import './actions.pcss';

enum Action {
    Default = 'default',
    Export = 'export',
    Import = 'import',
    Remove = 'remove',
}

const prepareExclusionsAfterImport = (exclusionsString: string) => {
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

const handleGeneralExclusionsString = async (exclusionsString: string): Promise<number> => {
    const generalExclusions = prepareExclusionsAfterImport(exclusionsString);
    return messenger.addRegularExclusions(generalExclusions);
};

const handleSelectiveExclusionsString = async (exclusionsString: string): Promise<number> => {
    const selectiveExclusions = prepareExclusionsAfterImport(exclusionsString);
    return messenger.addSelectiveExclusions(selectiveExclusions);
};

const exportExclusions = async () => {
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

export const Actions = observer(() => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);
    const { selectListModalOpen } = exclusionsStore;

    const importEl = useRef<HTMLInputElement>(null);

    const [fileContent, setFileContent] = useState('');

    const closeSelectListModal = () => {
        exclusionsStore.closeSelectListModal();
        setFileContent('');
    };

    const openSelectListModal = () => {
        exclusionsStore.openSelectListModal();
    };

    const handleRegularClick = async () => {
        const exclusionsAddedCount = await handleGeneralExclusionsString(fileContent);
        notificationsStore.notifySuccess(
            translator.getMessage(
                'options_exclusions_import_successful',
                { count: exclusionsAddedCount },
            ),
            {
                action: translator.getMessage('settings_exclusions_undo'),
                handler: exclusionsStore.restoreExclusions,
            },
        );
        await exclusionsStore.updateExclusionsData();
        closeSelectListModal();
    };

    const handleSelectiveClick = async () => {
        const exclusionsAddedCount = await handleSelectiveExclusionsString(fileContent);
        notificationsStore.notifySuccess(
            translator.getMessage(
                'options_exclusions_import_successful',
                { count: exclusionsAddedCount },
            ),
            {
                action: translator.getMessage('settings_exclusions_undo'),
                handler: exclusionsStore.restoreExclusions,
            },
        );
        await exclusionsStore.updateExclusionsData();
        closeSelectListModal();
    };

    const handleTxtExclusionsData = (content: string) => {
        setFileContent(content);
        openSelectListModal();
        return null;
    };

    const handleAction = async (action: Action) => {
        switch (action) {
            case Action.Export: {
                await exportExclusions();
                break;
            }
            case Action.Import: {
                if (importEl.current) {
                    importEl.current.click();
                }
                break;
            }
            case Action.Remove: {
                await exclusionsStore.openRemoveAllModal();
                break;
            }
            default: break;
        }
    };

    const handleExclusionsData = async (exclusionsData: ExclusionsImportData[]) => {
        const txtExclusionsData = exclusionsData.find((d) => d.type === ExclusionDataType.Txt);

        if (txtExclusionsData) {
            return handleTxtExclusionsData(txtExclusionsData.content);
        }

        const exclusionsContentMap: ExclusionsContentMap = {
            [ExclusionsMode.Regular]: [],
            [ExclusionsMode.Selective]: [],
        };

        for (let i = 0; i < exclusionsData.length; i += 1) {
            const { type, content } = exclusionsData[i];
            if (type === ExclusionDataType.General) {
                // eslint-disable-next-line max-len
                exclusionsContentMap[ExclusionsMode.Regular] = prepareExclusionsAfterImport(content);
            } else if (type === ExclusionDataType.Selective) {
                // eslint-disable-next-line max-len
                exclusionsContentMap[ExclusionsMode.Selective] = prepareExclusionsAfterImport(content);
            }
        }

        const addedExclusions = messenger.addExclusionsMap(exclusionsContentMap);
        return addedExclusions;
    };

    const inputChangeHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) {
            return;
        }

        exclusionsStore.setImportingExclusions(true);

        const [file] = e.target.files;
        e.target.value = '';

        try {
            const exclusionsData = await readExclusionsFile(file);
            const exclusionsAdded = await handleExclusionsData(exclusionsData);
            if (exclusionsAdded !== null) {
                notificationsStore.notifySuccess(
                    translator.getMessage(
                        'options_exclusions_import_successful',
                        { count: exclusionsAdded },
                    ),
                    {
                        action: translator.getMessage('settings_exclusions_undo'),
                        handler: exclusionsStore.restoreExclusions,
                    },
                );
                await exclusionsStore.updateExclusionsData();
            }
            exclusionsStore.setImportingExclusions(false);
        } catch (e) {
            notificationsStore.notifyError(e.message);
            exclusionsStore.setImportingExclusions(false);
        }
    };

    return (
        <>
            <div className="actions">
                <Select
                    value={Action.Default}
                    options={[
                        {
                            value: Action.Default,
                            title: translator.getMessage('settings_exclusion_actions'),
                            shouldSkip: true,
                        },
                        {
                            value: Action.Export,
                            title: translator.getMessage('settings_exclusions_action_export'),
                            shouldSkip: exclusionsStore.isAllExclusionsListsEmpty,
                        },
                        {
                            value: Action.Import,
                            title: translator.getMessage('settings_exclusions_action_import'),
                        },
                        {
                            value: Action.Remove,
                            title: translator.getMessage('settings_exclusions_action_remove_all'),
                            shouldSkip: exclusionsStore.isCurrentModeExclusionsListEmpty,
                        },
                    ]}
                    onChange={handleAction}
                />
                <input
                    type="file"
                    accept=".txt, .zip"
                    ref={importEl}
                    onChange={inputChangeHandler}
                    style={{ display: 'none' }}
                />
            </div>
            <SelectListModal
                isOpen={selectListModalOpen}
                closeModal={closeSelectListModal}
                handleRegularClick={handleRegularClick}
                handleSelectiveClick={handleSelectiveClick}
            />
            <RemoveAllModal />
        </>
    );
});
