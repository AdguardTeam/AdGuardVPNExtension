/* eslint-disable no-await-in-loop */
import React, {
    useContext,
    useState,
    useRef,
    useEffect,
} from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';
import { identity } from 'lodash';
import format from 'date-fns/format';
import JSZip from 'jszip';
import FileSaver from 'file-saver';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { RemoveAllModal } from './RemoveAllModal';
import { ExclusionDataTypes, ExclusionsImportData, readExclusionsFile } from './fileHelpers';
import { translator } from '../../../../common/translator';
import { isValidExclusion } from '../../../../lib/string-utils';
import { log } from '../../../../lib/logger';
import { messenger } from '../../../../lib/messenger';

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

const handleGeneralExclusions = async (exclusionsString: string): Promise<number> => {
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

    const onAddExclusionClick = () => {
        exclusionsStore.openAddExclusionModal();
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

    const onMoreActionsClick = () => {
        setIsMoreActionsMenuOpen(!isMoreActionsMenuOpen);
    };

    const handleExclusionsData = async (exclusionsData: ExclusionsImportData[]) => {
        // FIXME should we handle txt file? ask Denis
        // const txtExclusionsData = exclusionsData.find((d) => d.type === ExclusionDataTypes.Txt);
        // if (txtExclusionsData) {
        //     return handleTxtExclusionsData(txtExclusionsData.content);
        // }

        let addedExclusions = 0;

        for (let i = 0; i < exclusionsData.length; i += 1) {
            const { type, content } = exclusionsData[i];
            if (type === ExclusionDataTypes.General) {
                addedExclusions += await handleGeneralExclusions(content);
            } else if (type === ExclusionDataTypes.Selective) {
                addedExclusions += await handleSelectiveExclusionsString(content);
            }
        }

        return addedExclusions;
    };

    const inputChangeHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) {
            return;
        }

        const [file] = e.target.files;
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
        } catch (e: any) {
            notificationsStore.notifyError(e.message);
        }
    };

    useEffect(() => {
        if (moreActionsMenu.current) {
            moreActionsMenu.current.focus();
        }
    }, [moreActionsMenu]);

    const moreActionsButtonClassnames = classnames('actions__more-actions-button', {
        active: isMoreActionsMenuOpen,
    });

    const moreActionsListClassnames = classnames('actions__more-actions-list', {
        visible: isMoreActionsMenuOpen,
    });

    if (exclusionsStore.exclusionsSearchValue.length > 0) {
        return null;
    }

    return (
        <>
            <div className="actions">
                <button
                    type="button"
                    className="actions__add-website simple-button"
                    onClick={onAddExclusionClick}
                >
                    {reactTranslator.getMessage('settings_exclusion_add_website')}
                </button>
                <button
                    type="button"
                    className={moreActionsButtonClassnames}
                    onMouseDown={onMoreActionsClick}
                >
                    <svg className="actions__more-actions-button__icon">
                        <use xlinkHref="#more-actions" />
                    </svg>
                </button>
                <ul
                    className={moreActionsListClassnames}
                    ref={moreActionsMenu}
                    tabIndex={-1}
                    onBlur={() => setIsMoreActionsMenuOpen(false)}
                >
                    <li onClick={onExportExclusionsClick}>
                        {/* FIXME disable if there are no exclusions */}
                        {reactTranslator.getMessage('settings_exclusions_action_export')}
                    </li>
                    <li onClick={onImportExclusionsClick}>
                        {reactTranslator.getMessage('settings_exclusions_action_import')}
                    </li>
                    <li onClick={onRemoveAllClick}>
                        {/* FIXME disable if there are no exclusions */}
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
            <RemoveAllModal />
            {/* FIXME add tooltip? */}
            <div onClick={onMoreActionsClick}>
                {/* ... */}
            </div>
        </>
    );
});
