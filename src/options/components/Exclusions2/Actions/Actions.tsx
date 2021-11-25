import React, { useContext } from 'react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';

import './actions.pcss';

// TODO
//  - import
//  - export
//  - remove
//  - add exclusion
export const Actions = () => {
    const { exclusionsStore } = useContext(rootStore);

    const onAddExclusionClick = () => {
        exclusionsStore.openAddExclusionModal();
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
                    <li>Export exclusions</li>
                    <li>Import exclusions</li>
                    <li onClick={onRemoveAllClick}>Remove all</li>
                </ul>
            </div>
            {/* FIXME add tooltip? */}
            <div onClick={onMoreActionsClick}>
                {/* ... */}
            </div>
        </>
    );
};
