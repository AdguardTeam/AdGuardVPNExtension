/* eslint-disable react/no-unstable-nested-components */
import React, { type ReactElement } from 'react';

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
     * URL for support page.
     *
     * Note: Optional, because in higher level component (App.tsx) it is fetched asynchronously.
     * If not provided, the link will be rendered as `#`.
     */
    supportUrl?: string;

    /**
     * Whether to show support link.
     */
    shouldShowSupportLink: boolean;

    /**
     * Callback function to close the modal.
     */
    onClose: () => void;
}

/**
 * Failed to login modal component. Shown when the user fails to log in.
 */
export function FailedToLoginModal({
    isOpen,
    supportUrl = '#',
    shouldShowSupportLink,
    onClose,
}: FailedToLoginModalProps): ReactElement {
    const description = shouldShowSupportLink
        ? reactTranslator.getMessage('auth_failed_to_login_description', {
            a: (chunks: string) => (
                <a
                    href={supportUrl}
                    className="link consent__modal-link"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {chunks}
                </a>
            ),
        })
        : translator.getMessage('auth_failed_to_login_description_without_support');

    return (
        <Modal
            title={translator.getMessage('auth_failed_to_login_title')}
            description={description}
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
