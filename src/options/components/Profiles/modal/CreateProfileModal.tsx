import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { useHistory } from 'react-router-dom';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { type ProfileOperationResponse } from '../../../../common/profiles';
import { translator } from '../../../../common/translator';
import { messenger } from '../../../../common/messenger';
import { rootStore } from '../../../stores';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { getProfileRoute } from '../profileRoutes';

import { ProfileNameModal } from './ProfileNameModal';

/**
 * Props for the CreateProfileModal component.
 */
interface CreateProfileModalProps {
    /**
     * Whether the modal is open.
     */
    isOpen: boolean;

    /**
     * Handler called when the modal should close.
     */
    onClose: () => void;
}

/**
 * Modal for creating a new profile.
 */
export const CreateProfileModal = observer((
    {
        isOpen,
        onClose,
    }: CreateProfileModalProps,
) => {
    const { telemetryStore } = useContext(rootStore);
    const history = useHistory();

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogCreateProfile,
        isOpen,
    );

    const handleSubmit = (name: string): Promise<ProfileOperationResponse> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.AddNameProfilesClick,
            TelemetryScreenName.DialogCreateProfile,
        );
        return messenger.createProfile(name);
    };

    return (
        <ProfileNameModal
            isOpen={isOpen}
            title={translator.getMessage('settings_profiles_create_modal_title')}
            submitText={translator.getMessage('settings_profiles_create_modal_submit')}
            inputLabel={translator.getMessage('settings_profiles_create_modal_name_label')}
            initialName=""
            onSubmit={handleSubmit}
            onSuccess={(profileId): void => {
                if (profileId) {
                    history.push(getProfileRoute(profileId));
                }
            }}
            onClose={onClose}
        />
    );
});
