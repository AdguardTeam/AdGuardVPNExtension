import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';

export const ActionsRemoveAllModal = observer(() => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);

    const handleCloseModal = () => {
        exclusionsStore.closeRemoveAllModal();
    };

    const handleRemoveAll = async () => {
        await exclusionsStore.clearExclusionsList();
        handleCloseModal();
        notificationsStore.notifySuccess(
            reactTranslator.getMessage('options_exclusions_remove_all_success'),
            {
                action: reactTranslator.getMessage('settings_exclusions_undo'),
                handler: exclusionsStore.restoreExclusions,
            },
        );
    };

    // FIXME: Translation
    return (
        <Modal
            title={reactTranslator.getMessage('settings_exclusions_remove_all_exclusions')}
            description="Do you want to remove the entire list of exclusions?"
            descriptionClassName="exclusions__modal-description"
            open={exclusionsStore.removeAllModalOpen}
            onClose={handleCloseModal}
        >
            <div className="exclusions__modal-actions">
                <Button variant="outline" onClick={handleCloseModal}>
                    {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                </Button>
                <Button color="red" onClick={handleRemoveAll}>
                    {reactTranslator.getMessage('settings_exclusion_modal_remove')}
                </Button>
            </div>
        </Modal>
    );
});
