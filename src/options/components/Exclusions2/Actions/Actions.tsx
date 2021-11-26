import React, { useContext } from 'react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';

import './actions.pcss';

// TODO import
export const Actions = () => {
    const { exclusionsStore } = useContext(rootStore);

    const onAddExclusionClick = () => {
        exclusionsStore.openAddExclusionModal();
    };

    const onExportExclusionsClick = async () => {
        await exclusionsStore.exportExclusions();
    };

    const onImportExclusionsClick = async () => {
        // await exclusionsStore.importExclusions();
    };

    const onRemoveAllClick = async () => {
        await exclusionsStore.clearExclusionsList();
    };

    const onMoreActionsClick = () => {
        // FIXME implement
        console.log('onMoreActionsClick');
    };

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
                    className="actions__more-actions-button"
                >
                    <svg className="actions__more-actions-button__icon">
                        <use xlinkHref="#more-actions" />
                    </svg>
                </button>
                <ul className="actions__more-actions-list">
                    <li onClick={onExportExclusionsClick}>
                        {reactTranslator.getMessage('settings_exclusions_action_export')}
                    </li>
                    <li onClick={onImportExclusionsClick}>
                        {reactTranslator.getMessage('settings_exclusions_action_import')}
                    </li>
                    <li onClick={onRemoveAllClick}>
                        {reactTranslator.getMessage('settings_exclusions_action_remove_all')}
                    </li>
                </ul>
            </div>
            {/* FIXME add tooltip? */}
            <div onClick={onMoreActionsClick}>
                {/* ... */}
            </div>
        </>
    );
};
