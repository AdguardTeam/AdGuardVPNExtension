import React, { type ReactElement } from 'react';

import { translator } from '../../common/translator';
import { Modal } from '../../options/components/ui/Modal';
import { Button } from '../../options/components/ui/Button';

/**
 * Props for {@link UsageDataModal}.
 */
export interface UsageDataModalProps {
    /**
     * Whether the modal is open.
     */
    isOpen: boolean;

    /**
     * The URL for the privacy policy.
     */
    privacyUrl: string | undefined;

    /**
     * Callback function to close the modal.
     */
    onClose: () => void;
}

/**
 * Usage data modal. Shown when consent checkbox link clicked.
 */
export function UsageDataModal({ isOpen, privacyUrl, onClose }: UsageDataModalProps): ReactElement {
    return (
        <Modal
            title={translator.getMessage('settings_help_us_improve_modal_title')}
            description={(
                <>
                    <p className="consent__modal-text">
                        {translator.getMessage('settings_help_us_improve_modal_desc_data')}
                    </p>
                    <ul className="consent__modal-list">
                        <li className="consent__modal-list-item">
                            {translator.getMessage('settings_help_us_improve_modal_desc_data_screens')}
                        </li>
                        <li className="consent__modal-list-item">
                            {translator.getMessage('settings_help_us_improve_modal_desc_data_buttons')}
                        </li>
                        <li className="consent__modal-list-item">
                            {translator.getMessage('settings_help_us_improve_modal_desc_data_sessions')}
                        </li>
                    </ul>
                    <p className="consent__modal-text">
                        {translator.getMessage('settings_help_us_improve_modal_desc_improve')}
                    </p>
                    <p className="consent__modal-text">
                        {translator.getMessage('settings_help_us_improve_modal_desc_internally')}
                    </p>
                    <a
                        href={privacyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link consent__modal-link"
                    >
                        {translator.getMessage('settings_help_us_improve_modal_privacy_policy')}
                    </a>
                </>
            )}
            actions={(
                <Button onClick={onClose}>
                    {translator.getMessage('settings_help_us_improve_modal_button')}
                </Button>
            )}
            isOpen={isOpen}
            className="consent__modal"
            onClose={onClose}
        />
    );
}
