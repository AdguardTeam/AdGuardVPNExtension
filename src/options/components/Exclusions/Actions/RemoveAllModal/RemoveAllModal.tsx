import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryScreenName } from '../../../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../../../stores';
import { translator } from '../../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../../common/telemetry/useTelemetryPageViewEvent';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';

export const RemoveAllModal = observer(() => {
    const { exclusionsStore, notificationsStore, telemetryStore } = useContext(rootStore);

    const isOpen = exclusionsStore.removeAllModalOpen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogExclusionsRemoveAll,
        isOpen,
    );

    const closeModal = () => {
        exclusionsStore.closeRemoveAllModal();
    };

    const removeAllExclusions = async () => {
        await exclusionsStore.clearExclusionsList();
        closeModal();
        notificationsStore.notifySuccess(
            translator.getMessage('options_exclusions_remove_all_success'),
            {
                action: translator.getMessage('settings_exclusions_undo'),
                handler: exclusionsStore.restoreExclusions,
            },
        );
    };

    return (
        <Modal
            title={translator.getMessage('settings_exclusions_remove_all_exclusions')}
            description={translator.getMessage('settings_exclusions_remove_all_exclusions_message')}
            actions={(
                <>
                    <Button variant="outlined" onClick={closeModal}>
                        {translator.getMessage('options_exclusions_delete_cancel_button')}
                    </Button>
                    <Button color="danger" onClick={removeAllExclusions}>
                        {translator.getMessage('settings_exclusion_modal_remove')}
                    </Button>
                </>
            )}
            isOpen={isOpen}
            className="exclusions__modal exclusions__modal--empty-body"
            size="medium"
            onClose={closeModal}
        />
    );
});
