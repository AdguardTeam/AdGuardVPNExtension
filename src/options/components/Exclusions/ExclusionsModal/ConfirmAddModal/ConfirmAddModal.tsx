import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../../background/telemetry';
import { rootStore } from '../../../../stores';
import { translator } from '../../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../../common/telemetry';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';

/**
 * Confirm add modal component.
 */
export const ConfirmAddModal = observer(() => {
    const { exclusionsStore, notificationsStore, telemetryStore } = useContext(rootStore);
    const { confirmAddModalOpen, urlToConfirm } = exclusionsStore;

    const isOpen = confirmAddModalOpen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogExclusionsAddNotValidDomain,
        isOpen,
    );

    const closeModal = (shouldSendTelemetryEvent: boolean) => {
        if (shouldSendTelemetryEvent) {
            telemetryStore.sendCustomEvent(
                TelemetryActionName.ExitInvalidDomainClick,
                TelemetryScreenName.DialogExclusionsAddNotValidDomain,
            );
        }

        exclusionsStore.setConfirmAddModalOpen(false);
    };

    const confirmAddUrl = async () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.AddInvalidDomainClick,
            TelemetryScreenName.DialogExclusionsAddNotValidDomain,
        );

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
        closeModal(false);
    };

    const handleClose = () => {
        closeModal(true);
    };

    return (
        <Modal
            title={translator.getMessage('settings_exclusion_add_website')}
            description={translator.getMessage('settings_exclusions_add_invalid_domain', { url: urlToConfirm })}
            actions={(
                <>
                    <Button variant="outlined" onClick={handleClose}>
                        {translator.getMessage('settings_exclusion_modal_cancel')}
                    </Button>
                    <Button onClick={confirmAddUrl}>
                        {translator.getMessage('settings_exclusion_add')}
                    </Button>
                </>
            )}
            isOpen={isOpen}
            className="exclusions__modal exclusions__modal--empty-body"
            size="medium"
            onClose={handleClose}
        />
    );
});
