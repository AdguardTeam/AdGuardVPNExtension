import React, { useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import { type ProfileOperationResponse, ProfileNameValidationResult } from '../../../../common/profiles';
import { log } from '../../../../common/logger';
import { getErrorMessage } from '../../../../common/utils/error';
import { rootStore } from '../../../stores';
import { Input } from '../../ui/Input';
import { getValidationErrorMessage } from '../profileValidation';

import { ProfileModalBase } from './ProfileModalBase';

const PROFILE_NAME_INPUT_ID = 'profile-name';

/**
 * Props for the ProfileNameModal component.
 */
interface ProfileNameModalProps {
    /**
     * Whether the modal is open.
     */
    isOpen: boolean;

    /**
     * Modal title.
     */
    title: string;

    /**
     * Text for the submit button.
     */
    submitText: string;

    /**
     * Label text for the name input field.
     */
    inputLabel: string;

    /**
     * Initial value of the name input.
     */
    initialName: string;

    /**
     * Async action to perform on submit. Must return a profile operation response.
     *
     * @param name Profile name entered by the user.
     */
    onSubmit: (name: string) => Promise<ProfileOperationResponse>;

    /**
     * Called after a successful submit. Receives the profile ID when available.
     *
     * @param profileId Profile ID returned by the operation.
     */
    onSuccess?: (profileId?: string) => void;

    /**
     * Handler called when the modal should close.
     */
    onClose: () => void;
}

/**
 * Shared modal for creating and renaming profiles.
 * Handles name input state, validation errors, and submit flow.
 */
export const ProfileNameModal = observer(({
    isOpen,
    title,
    submitText,
    inputLabel,
    initialName,
    onSubmit,
    onSuccess,
    onClose,
}: ProfileNameModalProps) => {
    const { globalStore, notificationsStore } = useContext(rootStore);

    const [name, setName] = useState(initialName);
    const [nameError, setNameError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isNameEmpty = name.trim().length === 0;

    const resetState = (): void => {
        setName(initialName);
        setNameError(null);
        setIsSubmitting(false);
    };

    useEffect(() => {
        if (isOpen) {
            resetState();
        }
    }, [isOpen, initialName]);

    const handleClose = (): void => {
        resetState();
        onClose();
    };

    const handleNameChange = (value: string): void => {
        setName(value);
        if (nameError) {
            setNameError(null);
        }
    };

    const handleSubmit = async (): Promise<void> => {
        if (isSubmitting || isNameEmpty) {
            return;
        }

        setNameError(null);
        setIsSubmitting(true);

        try {
            const response = await onSubmit(name);

            if (response.result !== ProfileNameValidationResult.Ok) {
                setNameError(getValidationErrorMessage(response.result));
            } else {
                await globalStore.getOptionsData(true);
                handleClose();
                onSuccess?.(response.profileId);
                return;
            }
        } catch (e) {
            log.error('[vpn.ProfileNameModal]: failed:', e);
            notificationsStore.notifyError(getErrorMessage(e));
        }

        setIsSubmitting(false);
    };

    return (
        <ProfileModalBase
            title={title}
            isOpen={isOpen}
            submitText={submitText}
            isSubmitDisabled={isSubmitting || isNameEmpty}
            onSubmit={handleSubmit}
            onClose={handleClose}
        >
            <Input
                id={PROFILE_NAME_INPUT_ID}
                name={PROFILE_NAME_INPUT_ID}
                label={inputLabel}
                value={name}
                onChange={handleNameChange}
                error={nameError}
            />
        </ProfileModalBase>
    );
});
