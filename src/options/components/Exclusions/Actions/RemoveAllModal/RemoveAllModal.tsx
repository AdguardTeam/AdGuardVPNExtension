import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { ExclusionsModal } from '../../ExclusionsModal/ExclusionsModal';
import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';

import './remove-all-modal.pcss';

// FIXME remove @ts-ignore
// @ts-ignore
export const RemoveAllModal = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const isOpen = exclusionsStore.removeAllModalOpen;

    const closeModal = () => {
        exclusionsStore.closeRemoveAllModal();
    };

    const removeAllExclusions = async () => {
        await exclusionsStore.clearExclusionsList();
        closeModal();
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
                <button
                    type="button"
                    className="button button--medium button--outline-secondary"
                    onClick={closeModal}
                >
                    {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                </button>
                <button
                    type="button"
                    className="button button--medium button--primary"
                    onClick={removeAllExclusions}
                >
                    {reactTranslator.getMessage('settings_exclusion_modal_remove')}
                </button>
            </div>
        </ExclusionsModal>
    );
});
