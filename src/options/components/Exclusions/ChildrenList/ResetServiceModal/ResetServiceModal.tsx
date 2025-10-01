import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { translator } from '../../../../../common/translator';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';

export const ResetServiceModal = observer(() => {
    const { exclusionsStore } = useContext(rootStore);
    const { selectedExclusion } = exclusionsStore;

    if (!selectedExclusion) {
        return null;
    }

    const closeModal = (): void => {
        exclusionsStore.setResetServiceModalOpen(false);
    };

    const resetServiceData = async (): Promise<void> => {
        await exclusionsStore.resetServiceData(selectedExclusion.id);
        closeModal();
    };

    return (
        <Modal
            title={translator.getMessage('settings_exclusion_reset_to_default')}
            description={
                translator.getMessage(
                    'settings_exclusion_reset_service_confirmation_message',
                    { hostname: selectedExclusion.hostname },
                )
            }
            actions={(
                <>
                    <Button variant="outlined" onClick={closeModal}>
                        {translator.getMessage('settings_exclusion_modal_cancel')}
                    </Button>
                    <Button onClick={resetServiceData}>
                        {translator.getMessage('settings_exclusion_reset_button')}
                    </Button>
                </>
            )}
            isOpen={exclusionsStore.resetServiceModalOpen}
            className="exclusions__modal exclusions__modal--empty-body"
            size="medium"
            onClose={closeModal}
        />
    );
});
