import React, { type PropsWithChildren, type ReactElement } from 'react';

import { translator } from '../../../../common/translator';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';

/**
 * Props for ProfileModalBase component.
 */
interface ProfileModalBaseProps extends PropsWithChildren {
    /**
     * Modal title.
     */
    title: string;

    /**
     * Whether the modal is open.
     */
    isOpen: boolean;

    /**
     * Text of the submit button.
     */
    submitText: string;

    /**
     * Whether the submit button is disabled.
     */
    isSubmitDisabled?: boolean;

    /**
     * Whether the action is dangerous (sets red color and moves submit button to the right).
     */
    isDangerAction?: boolean;

    /**
     * Handler called when the submit button is clicked.
     */
    onSubmit: () => void | Promise<void>;

    /**
     * Handler called when the modal should close.
     */
    onClose: () => void;
}

/**
 * Base profile modal with title, submit/cancel buttons, and arbitrary content.
 */
export function ProfileModalBase({
    title,
    isOpen,
    submitText,
    isSubmitDisabled,
    isDangerAction,
    onSubmit,
    onClose,
    children,
}: ProfileModalBaseProps): ReactElement {
    const submitButton = (
        <Button
            color={isDangerAction ? 'danger' : 'primary'}
            disabled={isSubmitDisabled}
            onClick={onSubmit}
        >
            {submitText}
        </Button>
    );

    const cancelButton = (
        <Button
            variant="outlined"
            onClick={onClose}
        >
            {translator.getMessage('settings_profiles_modal_cancel')}
        </Button>
    );

    return (
        <Modal
            title={title}
            isOpen={isOpen}
            size="medium"
            fullWidthActions
            actions={(
                <>
                    {isDangerAction ? cancelButton : submitButton}
                    {isDangerAction ? submitButton : cancelButton}
                </>
            )}
            onClose={onClose}
        >
            {children}
        </Modal>
    );
}
