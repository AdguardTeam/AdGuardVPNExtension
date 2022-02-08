import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { Title } from '../../../ui/Title';
import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';

import './confirm-add-modal.pcss';

export const ConfirmAddModal = observer(() => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);
    const { confirmAddModalOpen, urlToConfirm } = exclusionsStore;

    const closeModal = () => {
        exclusionsStore.setConfirmAddModalOpen(false);
    };

    const confirmAddUrl = async () => {
        if (urlToConfirm) {
            const addedExclusionsCount = await exclusionsStore.addUrlToExclusions(urlToConfirm);
            notificationsStore.notifySuccess(
                reactTranslator.getMessage(
                    'options_exclusions_added_exclusions',
                    { count: addedExclusionsCount },
                ),
                {
                    action: reactTranslator.getMessage('settings_exclusions_undo'),
                    handler: exclusionsStore.restoreExclusions,
                },
            );
        }
        closeModal();
    };

    return (
        <Modal
            isOpen={confirmAddModalOpen}
            className="modal confirm-add-modal"
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
                    title={reactTranslator.getMessage('settings_exclusion_add_website')}
                />
                <div className="confirm-add-modal__message">
                    {reactTranslator.getMessage('settings_exclusions_add_invalid_domain', { url: urlToConfirm })}
                </div>
            </div>
            <div className="confirm-add-modal__actions">
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
                    onClick={confirmAddUrl}
                >
                    {reactTranslator.getMessage('settings_exclusion_add')}
                </button>
            </div>
        </Modal>
    );
});
