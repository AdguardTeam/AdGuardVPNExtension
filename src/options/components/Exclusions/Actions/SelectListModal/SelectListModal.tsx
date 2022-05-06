import React from 'react';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { ExclusionsModal } from '../../ExclusionsModal/ExclusionsModal';

interface SelectListModalProps {
    isOpen: boolean;
    closeModal: () => void;
    handleRegularClick: () => void;
    handleSelectiveClick: () => void;
}

export const SelectListModal = ({
    isOpen,
    closeModal,
    handleRegularClick,
    handleSelectiveClick,
}: SelectListModalProps) => {
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
                    className="button button--outline-light-gray modal__button modal__button--first"
                >
                    {reactTranslator.getMessage('options_exclusions_import_select_regular')}
                </button>
                <button
                    type="button"
                    onClick={handleSelectiveClick}
                    className="button button--outline-light-gray modal__button"
                >
                    {reactTranslator.getMessage('options_exclusions_import_select_selective')}
                </button>
            </div>
        </ExclusionsModal>
    );
};
