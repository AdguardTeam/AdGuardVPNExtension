import React, { useContext } from 'react';

import { rootStore } from '../../../stores';
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
                {/* FIXME add to translations */}
                <button
                    type="button"
                    className="actions__add-website simple-button"
                    onClick={onAddExclusionClick}
                >
                    + Add a website
                </button>
            </div>
            {/* FIXME add tooltip? */}
            <div onClick={onMoreActionsClick}>
                {/* ... */}
            </div>
        </>
    );
};
