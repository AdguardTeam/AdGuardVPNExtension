import React, { useContext, useRef, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { translator } from '../../../../../common/translator';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { type ExclusionsContentMap } from '../../../../../common/constants';
import { messenger } from '../../../../../common/messenger';
import { ExclusionsMode } from '../../../../../common/exclusionsConstants';

import { ActionsMenu } from './ActionsMenu';
import {
    exportExclusions,
    handleGeneralExclusionsString,
    handleSelectiveExclusionsString,
    prepareExclusionsAfterImport,
} from './utils';
import { ExclusionDataType, type ExclusionsImportData, readExclusionsFile } from './fileHelpers';
import { ActionsSelectModal } from './ActionsSelectModal';

export const Actions = observer(() => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);

    const importEl = useRef<HTMLInputElement>(null);

    const [isSelectListModalOpen, setSelectListModalState] = useState(false);
    const [fileContent, setFileContent] = useState('');

    const openSelectListModal = () => {
        setSelectListModalState(true);
    };

    const closeSelectListModal = () => {
        setSelectListModalState(false);
        setFileContent('');
    };

    const handleExportClick = async () => {
        await exportExclusions();
    };

    const handleImportClick = () => {
        if (importEl.current) {
            importEl.current.click();
        }
    };

    const handleRemoveAllClick = async () => {
        await exclusionsStore.openRemoveAllModal();
    };

    const handleTxtExclusionsData = (content: string) => {
        setFileContent(content);
        openSelectListModal();
        return null;
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
                        action: reactTranslator.getMessage('settings_exclusions_undo'),
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

    const handleRegularClick = async () => {
        const exclusionsAddedCount = await handleGeneralExclusionsString(fileContent);
        notificationsStore.notifySuccess(
            translator.getMessage(
                'options_exclusions_import_successful',
                { count: exclusionsAddedCount },
            ),
            {
                action: reactTranslator.getMessage('settings_exclusions_undo'),
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
                action: reactTranslator.getMessage('settings_exclusions_undo'),
                handler: exclusionsStore.restoreExclusions,
            },
        );
        await exclusionsStore.updateExclusionsData();
        closeSelectListModal();
    };

    return (
        <>
            <ActionsMenu
                showExport={!exclusionsStore.isAllExclusionsListsEmpty}
                showRemoveAll={!exclusionsStore.isCurrentModeExclusionsListEmpty}
                onExportExclusionsClick={handleExportClick}
                onImportExclusionsClick={handleImportClick}
                onRemoveAllClick={handleRemoveAllClick}
            />
            <input
                ref={importEl}
                type="file"
                accept=".txt, .zip"
                onChange={inputChangeHandler}
                style={{ display: 'none' }}
            />
            <ActionsSelectModal
                mode={exclusionsStore.currentMode}
                open={isSelectListModalOpen}
                onClose={closeSelectListModal}
                onRegularClick={handleRegularClick}
                onSelectiveClick={handleSelectiveClick}
            />
        </>
    );
});
