import React from 'react';

import { ExclusionsModal } from './ExclusionsModal';
import { reactTranslator } from '../../../../common/reactTranslator';
import { ExclusionsModes } from '../../../../common/exclusionsConstants';

export const RemoveExclusionsModal = ({
    isOpen, closeModal, handleCancelClick, handleDeleteClick, currentMode,
}) => {
    const title = reactTranslator.getMessage('options_exclusions_delete_title');

    let description;
    if (currentMode === ExclusionsModes.Regular) {
        description = reactTranslator.getMessage('options_exclusions_delete_regular_description');
    } else if (currentMode === ExclusionsModes.Selective) {
        description = reactTranslator.getMessage('options_exclusions_delete_selective_description');
    }

    return (
        <ExclusionsModal
            isOpen={isOpen}
            closeModal={closeModal}
            title={title}
            description={description}
        >
            <div className="modal__buttons">
                <button
                    type="button"
                    onClick={handleCancelClick}
                    className="button modal__button modal__button--first"
                >
                    {reactTranslator.getMessage('options_exclusions_delete_cancel_button')}
                </button>
                <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="button modal__button modal__button--red"
                >
                    {reactTranslator.getMessage('options_exclusions_delete_approve_button')}
                </button>
            </div>
        </ExclusionsModal>
    );
};
