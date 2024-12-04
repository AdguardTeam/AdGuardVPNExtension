import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import Modal from 'react-modal';

import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { Title } from '../../../ui/Title';
import { translator } from '../../../../../common/translator';

import './reset-service-modal.pcss';

export const ResetServiceModal = observer(() => {
    const { exclusionsStore } = useContext(rootStore);
    const { selectedExclusion } = exclusionsStore;

    if (!selectedExclusion) {
        return null;
    }

    const closeModal = () => {
        exclusionsStore.setResetServiceModalOpen(false);
    };

    const resetServiceData = async () => {
        await exclusionsStore.resetServiceData(selectedExclusion.id);
        closeModal();
    };

    return (
        <Modal
            isOpen={exclusionsStore.resetServiceModalOpen}
            className="modal modal-exclusions reset-service-modal"
            overlayClassName="overlay overlay--fullscreen"
            onRequestClose={closeModal}
        >
            <button
                type="button"
                className="button button--icon modal__close-icon"
                onClick={closeModal}
            >
                <svg className="icon icon--button icon--cross">
                    <use xlinkHref="#cross" />
                </svg>
            </button>
            <div className="settings__section">
                <Title
                    title={translator.getMessage('settings_exclusion_reset_to_default')}
                />
                {reactTranslator.getMessage(
                    'settings_exclusion_reset_service_confirmation_message',
                    { hostname: selectedExclusion.hostname },
                )}
            </div>
            <div className="reset-service-modal__actions">
                <button
                    type="button"
                    className="button button--large button--outline-gray"
                    onClick={closeModal}
                >
                    {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                </button>
                <button
                    type="button"
                    className="button button--large button--primary"
                    onClick={resetServiceData}
                >
                    {reactTranslator.getMessage('settings_exclusion_reset_button')}
                </button>
            </div>
        </Modal>
    );
});
