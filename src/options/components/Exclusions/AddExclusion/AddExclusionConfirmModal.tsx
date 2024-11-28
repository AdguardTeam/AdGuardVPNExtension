import React from 'react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

export interface AddExclusionConfirmModalProps {
    open: boolean;
    url?: string;
    onClose: () => void;
    onConfirm: () => void;
}

export function AddExclusionConfirmModal({
    open,
    url,
    onClose,
    onConfirm,
}: AddExclusionConfirmModalProps) {
    if (!url) {
        return null;
    }

    return (
        <Modal
            title={reactTranslator.getMessage('settings_exclusion_add_website')}
            description={reactTranslator.getMessage('settings_exclusions_add_invalid_domain', { url })}
            open={open}
            variant="thin"
            onClose={onClose}
        >
            <div className="exclusions__modal-actions">
                <Button variant="outline" onClick={onClose}>
                    {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                </Button>
                <Button onClick={onConfirm}>
                    {reactTranslator.getMessage('settings_exclusion_add')}
                </Button>
            </div>
        </Modal>
    );
}
