import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { ExclusionsModal } from '../../ExclusionsModal/ExclusionsModal';
import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';

import './remove-all-modal.pcss';

export const RemoveAllModal = observer(() => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);

    const isOpen = exclusionsStore.removeAllModalOpen;

    const closeModal = () => {
        exclusionsStore.closeRemoveAllModal();
    };

    const removeAllExclusions = async () => {
        await exclusionsStore.clearExclusionsList();
        closeModal();
        notificationsStore.notifySuccess(
            reactTranslator.getMessage('options_exclusions_remove_all_success'),
            {
                action: reactTranslator.getMessage('settings_exclusions_undo'),
                handler: exclusionsStore.restoreExclusions,
            },
        );
    };

    return (
        <ExclusionsModal
            isOpen={isOpen}
            closeModal={closeModal}
            title={reactTranslator.getMessage('settings_exclusions_remove_all_exclusions')}
        >
            <div className="remove-all-modal">
                <div className="remove-all-modal__message">
                    {reactTranslator.getMessage('settings_exclusions_remove_all_exclusions_message')}
                </div>
                <div className="form__actions">
                    <button
                        type="button"
                        className="button button--large button--outline-secondary"
                        onClick={closeModal}
                    >
                        {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                    </button>
                    <button
                        type="button"
                        className="button button--large button--primary"
                        onClick={removeAllExclusions}
                    >
                        {reactTranslator.getMessage('settings_exclusion_modal_remove')}
                    </button>
                </div>
            </div>
        </ExclusionsModal>
    );
});
