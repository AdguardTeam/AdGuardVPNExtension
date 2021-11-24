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
            </div>
            {/* FIXME add tooltip? */}
            <div onClick={onMoreActionsClick}>
                {/* ... */}
            </div>
        </>
    );
};
