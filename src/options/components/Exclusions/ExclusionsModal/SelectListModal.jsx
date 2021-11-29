import React from 'react';

import { ExclusionsModal } from './ExclusionsModal';
import { reactTranslator } from '../../../../common/reactTranslator';

export const SelectListModal = ({
    isOpen, closeModal, handleRegularClick, handleSelectiveClick,
}) => {
    const title = reactTranslator.getMessage('options_exclusions_import_select_title');
    return (
        <ExclusionsModal
            isOpen={isOpen}
            closeModal={closeModal}
            title={title}
        >
            <div className="modal__buttons">
                <button
                    type="button"
                    onClick={handleRegularClick}
                    className="button modal__button modal__button--first"
                >
                    {reactTranslator.getMessage('options_exclusions_import_select_regular')}
                </button>
                <button
                    type="button"
                    onClick={handleSelectiveClick}
                    className="button modal__button"
                >
                    {reactTranslator.getMessage('options_exclusions_import_select_selective')}
                </button>
            </div>
        </ExclusionsModal>
    );
};
