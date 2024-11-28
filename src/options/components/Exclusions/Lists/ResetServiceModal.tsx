import React from 'react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

export interface ResetServiceModalProps {
    open: boolean;
    hostname: string;
    onClose: () => void;
    onConfirm: () => void;
}

export function ResetServiceModal({
    open,
    hostname,
    onClose,
    onConfirm,
}: ResetServiceModalProps) {
    const description = reactTranslator.getMessage(
        'settings_exclusion_reset_service_confirmation_message',
        { hostname },
    );

    return (
        <Modal
            title={reactTranslator.getMessage('settings_exclusion_reset_to_default')}
            description={description}
            open={open}
            variant="thin"
            onClose={onClose}
        >
            <div className="exclusions__modal-actions">
                <Button variant="outline" onClick={onClose}>
                    {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                </Button>
                <Button onClick={onConfirm}>
                    {reactTranslator.getMessage('settings_exclusion_reset_button')}
                </Button>
            </div>
        </Modal>
    );
}
