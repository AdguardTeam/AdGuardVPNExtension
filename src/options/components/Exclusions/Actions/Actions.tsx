import React, {
    useContext, useState, useRef, useEffect,
} from 'react';
import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { RemoveAllModal } from './RemoveAllModal';
import { readExclusionsFile } from './fileHelpers';
import { translator } from '../../../../common/translator';
import { ExclusionsDataToImport } from '../../../../background/exclusions/exclusions/ExclusionsManager';

import './actions.pcss';

export const Actions = () => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);

    const [isMoreActionsMenuOpen, setIsMoreActionsMenuOpen] = useState(false);

    const importEl = useRef(null);
    const moreActionsMenu = useRef(null);

    const onAddExclusionClick = () => {
        exclusionsStore.openAddExclusionModal();
    };

    const onExportExclusionsClick = async () => {
        await exclusionsStore.exportExclusions();
    };

    const onImportExclusionsClick = () => {
        // @ts-ignore
        importEl.current.click();
    };

    const onRemoveAllClick = async () => {
        await exclusionsStore.openRemoveAllModal();
    };

    const onMoreActionsClick = () => {
        setIsMoreActionsMenuOpen(!isMoreActionsMenuOpen);
    };

    const inputChangeHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // @ts-ignore
        const [file] = e.target.files;
        e.target.value = '';

        try {
            const exclusionsData = await readExclusionsFile(file);
            await exclusionsStore.importExclusions(exclusionsData as ExclusionsDataToImport[]);
            notificationsStore.notifySuccess(translator.getMessage('options_exclusions_import_successful'));
        } catch (e: any) {
            notificationsStore.notifyError(e.message);
        }
    };

    useEffect(() => {
        // @ts-ignore
        moreActionsMenu.current.focus();
    });

    const moreActionsButtonClassnames = classnames('actions__more-actions-button', {
        active: isMoreActionsMenuOpen,
    });

    const moreActionsListClassnames = classnames('actions__more-actions-list', {
        visible: isMoreActionsMenuOpen,
    });

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
                        {/* TODO disable if there are no exclusions */}
                        {reactTranslator.getMessage('settings_exclusions_action_export')}
                    </li>
                    <li onClick={onImportExclusionsClick}>
                        {reactTranslator.getMessage('settings_exclusions_action_import')}
                    </li>
                    <li onClick={onRemoveAllClick}>
                        {/* TODO disable if there are no exclusions */}
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
};
