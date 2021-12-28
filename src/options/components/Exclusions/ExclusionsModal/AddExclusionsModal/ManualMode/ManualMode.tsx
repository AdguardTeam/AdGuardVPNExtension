import React, { useContext, useState } from 'react';
import Modal from 'react-modal';

import { Title } from '../../../../ui/Title';
import { rootStore } from '../../../../../stores';
import { reactTranslator } from '../../../../../../common/reactTranslator';

import './manual-mode.pcss';

export const ManualMode = () => {
    const { exclusionsStore } = useContext(rootStore);

    const [inputValue, setInputValue] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const closeExclusionModal = () => {
        exclusionsStore.closeAddExclusionModal();
    };

    const closeModals = () => {
        setIsConfirmModalOpen(false);
        closeExclusionModal();
    };

    const addUrl = async (
        e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
    ) => {
        e.preventDefault();

        if (exclusionsStore.validateUrl(inputValue)) {
            await exclusionsStore.addUrlToExclusions(inputValue);
            closeExclusionModal();
        } else {
            setIsConfirmModalOpen(true);
        }
    };

    const confirmAddUrl = async () => {
        await exclusionsStore.addUrlToExclusions(inputValue);
        closeModals();
    };

    return (
        <>
            <form
                className="manual-mode"
                onSubmit={addUrl}
            >
                <label className="input">
                    <div className="input__label">
                        {reactTranslator.getMessage('settings_exclusion_domain_name')}
                    </div>
                    <input
                        type="text"
                        className="input__in input__in--content"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                </label>
                <div className="manual-mode__actions">
                    <button
                        type="button"
                        className="button button--large button--outline-gray"
                        onClick={closeExclusionModal}
                    >
                        {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                    </button>
                    <button
                        type="button"
                        className="button button--large button--primary"
                        onClick={addUrl}
                        disabled={!inputValue}
                    >
                        {reactTranslator.getMessage('settings_exclusion_add_manually_add')}
                    </button>
                </div>
            </form>
            <Modal
                isOpen={isConfirmModalOpen}
                className="modal manual-mode__confirm-modal"
                overlayClassName="overlay overlay--fullscreen"
                onRequestClose={closeModals}
            >
                <button
                    type="button"
                    className="button button--icon modal__close-icon"
                    onClick={closeModals}
                >
                    <svg className="icon icon--button icon--cross">
                        <use xlinkHref="#cross" />
                    </svg>
                </button>
                <div className="settings__section">
                    <Title
                        title={reactTranslator.getMessage('settings_exclusion_add_website') as string}
                    />
                    {reactTranslator.getMessage('settings_exclusions_add_invalid_domain')}
                </div>
                <div className="manual-mode__confirm-modal__actions">
                    <button
                        type="button"
                        className="button button--large button--outline-gray"
                        onClick={closeModals}
                    >
                        {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                    </button>
                    <button
                        type="button"
                        className="button button--large button--primary"
                        onClick={confirmAddUrl}
                    >
                        {reactTranslator.getMessage('settings_exclusion_add')}
                    </button>
                </div>
            </Modal>
        </>
    );
};
