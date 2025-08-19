/* eslint-disable react/no-unstable-nested-components */
import React from 'react';

import { SUPPORT_EMAIL } from '../../background/constants';
import { translator } from '../../common/translator';
import { reactTranslator } from '../../common/reactTranslator';
import { Modal } from '../../options/components/ui/Modal';
import { Button } from '../../options/components/ui/Button';

/**
 * Props for {@link FailedToLoginModal}.
 */
export interface FailedToLoginModalProps {
    /**
     * Whether the modal is open.
     */
    isOpen: boolean;

    /**
     * Callback function to close the modal.
     */
    onClose: () => void;
}

/**
 * Failed to login modal component. Shown when the user fails to log in.
 */
export function FailedToLoginModal({ isOpen, onClose }: FailedToLoginModalProps) {
    return (
        <Modal
            title={translator.getMessage('auth_failed_to_login_title')}
            description={(
                reactTranslator.getMessage('auth_failed_to_login_description', {
                    a: (chunks: string) => (
                        <a
                            href={`mailto:${SUPPORT_EMAIL}`}
                            className="link consent__modal-link"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {chunks}
                        </a>
                    ),
                })
            )}
            actions={(
                <Button onClick={onClose}>
                    {translator.getMessage('auth_failed_to_login_button')}
                </Button>
            )}
            isOpen={isOpen}
            className="consent__modal"
            onClose={onClose}
        />
    );
}
