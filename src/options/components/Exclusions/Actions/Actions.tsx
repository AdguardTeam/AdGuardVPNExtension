/* eslint-disable no-await-in-loop */
import React, {
    useContext,
    useState,
    useRef,
} from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';
import identity from 'lodash/identity';
import format from 'date-fns/format';
import JSZip from 'jszip';
import FileSaver from 'file-saver';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { RemoveAllModal } from './RemoveAllModal';
import { ExclusionDataType, ExclusionsImportData, readExclusionsFile } from './fileHelpers';
import { translator } from '../../../../common/translator';
import { isValidExclusion } from '../../../../lib/string-utils';
import { ExclusionsContentMap } from '../../../../lib/constants';
import { log } from '../../../../lib/logger';
import { messenger } from '../../../../lib/messenger';
import { SelectListModal } from './SelectListModal/SelectListModal';
import { ExclusionsMode } from '../../../../common/exclusionsConstants';
import { useOutsideClick } from '../../../../common/components/ui/useOutsideClick';

import './actions.pcss';

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

    const [isMoreActionsMenuOpen, setIsMoreActionsMenuOpen] = useState(false);

    const importEl = useRef<HTMLInputElement>(null);
    const moreActionsMenu = useRef<HTMLUListElement>(null);

    const [isSelectListModalOpen, setSelectListModalState] = useState(false);
    const [fileContent, setFileContent] = useState('');

    const ref = useRef<HTMLDivElement>(null);

    useOutsideClick(ref, () => setIsMoreActionsMenuOpen(false));

    const closeSelectListModal = () => {
        setSelectListModalState(false);
        setFileContent('');
    };

    const openSelectListModal = () => {
        setSelectListModalState(true);
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

    const handleTxtExclusionsData = (content: string) => {
        setFileContent(content);
        openSelectListModal();
        return null;
    };

    const onExportExclusionsClick = async () => {
        await exportExclusions();
    };

    const onImportExclusionsClick = () => {
        if (importEl.current) {
            importEl.current.click();
        }
    };

    const onRemoveAllClick = async () => {
        await exclusionsStore.openRemoveAllModal();
    };

    const onMoreActionsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setIsMoreActionsMenuOpen(!isMoreActionsMenuOpen);
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

    const moreActionsListClassnames = classnames('actions__more-actions-list', {
        visible: isMoreActionsMenuOpen,
    });

    const exportClassnames = classnames({
        'actions__hidden-action': exclusionsStore.isAllExclusionsListsEmpty,
    });

    const removeAllClassnames = classnames({
        'actions__hidden-action': exclusionsStore.isCurrentModeExclusionsListEmpty,
    });

    return (
        <>
            <div
                className="actions"
                ref={ref}
            >
                <button
                    type="button"
                    className="actions__button selector__value"
                    onClick={onMoreActionsClick}
                >
                    {reactTranslator.getMessage('settings_exclusion_actions')}
                </button>
                <ul
                    className={moreActionsListClassnames}
                    ref={moreActionsMenu}
                    tabIndex={-1}
                >
                    <li
                        className={exportClassnames}
                        onClick={onExportExclusionsClick}
                    >
                        {reactTranslator.getMessage('settings_exclusions_action_export')}
                    </li>
                    <li onClick={onImportExclusionsClick}>
                        {reactTranslator.getMessage('settings_exclusions_action_import')}
                    </li>
                    <li
                        className={removeAllClassnames}
                        onClick={onRemoveAllClick}
                    >
                        {reactTranslator.getMessage('settings_exclusions_action_remove_all')}
                    </li>
                </ul>
                <input
                    type="file"
                    accept=".txt, .zip"
                    ref={importEl}
                    onChange={inputChangeHandler}
                    style={{ display: 'none' }}
                />
            </div>
            <SelectListModal
                isOpen={isSelectListModalOpen}
                closeModal={closeSelectListModal}
                handleRegularClick={handleRegularClick}
                handleSelectiveClick={handleSelectiveClick}
            />
            <RemoveAllModal />
        </>
    );
});
