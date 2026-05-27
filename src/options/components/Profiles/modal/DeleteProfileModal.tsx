import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import { useHistory } from 'react-router-dom';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { translator } from '../../../../common/translator';
import { log } from '../../../../common/logger';
import { getErrorMessage } from '../../../../common/utils/error';
import { messenger } from '../../../../common/messenger';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { rootStore } from '../../../stores';
import { PROFILES_PATH } from '../profileRoutes';

import { ProfileModalBase } from './ProfileModalBase';

/**
 * Props for the DeleteProfileModal component.
 */
interface DeleteProfileModalProps {
    /**
     * Whether the modal is open.
     */
    isOpen: boolean;

    /**
     * Profile ID to delete.
     */
    profileId: string;

    /**
     * Display name of the profile.
     */
    profileName: string;

    /**
     * Whether the profile is currently active.
     */
    isActive: boolean;

    /**
     * Handler called when the modal should close.
     */
    onClose: () => void;
}

/**
 * Confirmation modal for deleting a profile.
 * Shows different text depending on whether the profile is active.
 */
export const DeleteProfileModal = observer(({
    isOpen,
    profileId,
    profileName,
    isActive,
    onClose,
}: DeleteProfileModalProps) => {
    const { globalStore, notificationsStore, telemetryStore } = useContext(rootStore);
    const history = useHistory();

    const [isSubmitting, setIsSubmitting] = useState(false);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DeleteProfilesScreen,
        isOpen,
    );

    const description = isActive
        ? (
            <>
                {translator.getMessage('settings_profiles_delete_modal_description_active_notice')}
                <br />
                <br />
                {translator.getMessage('settings_profiles_delete_modal_description_active', { profile_name: profileName })}
            </>
        )
        : translator.getMessage('settings_profiles_delete_modal_description');

    const handleSubmit = async (): Promise<void> => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        try {
            telemetryStore.sendCustomEvent(
                TelemetryActionName.DeleteProfileClick,
                TelemetryScreenName.DeleteProfilesScreen,
            );
            await messenger.deleteProfile(profileId);
            await globalStore.getOptionsData(true);
            onClose();
            history.push(PROFILES_PATH);
            return;
        } catch (e) {
            log.error('[vpn.DeleteProfileModal]: Failed to delete profile:', e);
            notificationsStore.notifyError(getErrorMessage(e));
        }

        setIsSubmitting(false);
    };

    return (
        <ProfileModalBase
            title={translator.getMessage('settings_profiles_delete_modal_title', { profile_name: profileName })}
            isOpen={isOpen}
            submitText={translator.getMessage('settings_profiles_delete_modal_submit')}
            isSubmitDisabled={isSubmitting}
            isDangerAction
            onSubmit={handleSubmit}
            onClose={onClose}
        >
            {description}
        </ProfileModalBase>
    );
});
