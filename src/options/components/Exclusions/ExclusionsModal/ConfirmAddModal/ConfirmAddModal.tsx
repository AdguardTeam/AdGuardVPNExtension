import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { translator } from '../../../../../common/translator';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';

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
                translator.getMessage(
                    'options_exclusions_added_exclusions',
                    { count: addedExclusionsCount },
                ),
                {
                    action: translator.getMessage('settings_exclusions_undo'),
                    handler: exclusionsStore.restoreExclusions,
                },
            );
        }
        closeModal();
    };

    return (
        <Modal
            title={translator.getMessage('settings_exclusion_add_website')}
            description={translator.getMessage('settings_exclusions_add_invalid_domain', { url: urlToConfirm })}
            actions={(
                <>
                    <Button variant="outlined" onClick={closeModal}>
                        {translator.getMessage('settings_exclusion_modal_cancel')}
                    </Button>
                    <Button onClick={confirmAddUrl}>
                        {translator.getMessage('settings_exclusion_add')}
                    </Button>
                </>
            )}
            isOpen={confirmAddModalOpen}
            className="exclusions__modal exclusions__modal--empty-body"
            size="medium"
            onClose={closeModal}
        />
    );
});
