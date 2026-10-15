import React, { useContext, type ReactElement } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { type ProfileOperationResponse, ProfileNameValidationResult } from '../../../../common/profiles';
import { messenger } from '../../../../common/messenger';
import { log } from '../../../../common/logger';
import { getErrorMessage } from '../../../../common/utils/error';
import { translator } from '../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { rootStore } from '../../../stores';
import { getValidationErrorMessage } from '../profileValidation';

import { ProfileNameModal } from './ProfileNameModal';

/**
 * Props for the RenameProfileModal component.
 */
interface RenameProfileModalProps {
    /**
     * Whether the modal is open.
     */
    isOpen: boolean;

    /**
     * Profile ID to rename.
     */
    profileId: string;

    /**
     * Current profile display name.
     */
    currentName: string;

    /**
     * Handler called when the modal should close.
     */
    onClose: () => void;
}

/**
 * Modal for renaming a profile.
 */
export const RenameProfileModal = observer(({
    isOpen,
    profileId,
    currentName,
    onClose,
}: RenameProfileModalProps): ReactElement => {
    const { telemetryStore, notificationsStore, globalStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.EditNameProfilesScreen,
        isOpen,
    );

    const handleSubmit = (name: string): Promise<ProfileOperationResponse> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.SaveNewNameProfilesClick,
            TelemetryScreenName.EditNameProfilesScreen,
        );
        return messenger.renameProfile(profileId, name);
    };

    return (
        <ProfileNameModal
            isOpen={isOpen}
            title={translator.getMessage('settings_profiles_rename_modal_title')}
            submitText={translator.getMessage('settings_profiles_rename_modal_submit')}
            inputLabel={translator.getMessage('settings_profiles_rename_modal_name_label')}
            initialName={currentName}
            onSubmit={handleSubmit}
            onSuccess={(): void => {
                notificationsStore.notifySuccess(
                    translator.getMessage('profile_name_updated'),
                    {
                        action: translator.getMessage('settings_exclusions_undo'),
                        handler: async (): Promise<void> => {
                            try {
                                const response = await messenger.renameProfile(profileId, currentName);

                                if (response.result !== ProfileNameValidationResult.Ok) {
                                    const validationMessage = getValidationErrorMessage(response.result);

                                    if (validationMessage) {
                                        notificationsStore.notifyError(validationMessage);
                                    }
                                    return;
                                }

                                await globalStore.getOptionsData(true);
                            } catch (e) {
                                log.error('[vpn.RenameProfileModal]: failed to undo rename:', e);
                                notificationsStore.notifyError(getErrorMessage(e));
                            }
                        },
                    },
                );
            }}
            onClose={onClose}
        />
    );
});
