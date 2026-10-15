import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../../stores';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { Title } from '../../ui/Title';
import { ProfileActions } from '../ProfileActions';
import { ProfileSettings } from '../ProfileSettings';
import { RenameProfileModal } from '../modal/RenameProfileModal';
import { DeleteProfileModal } from '../modal/DeleteProfileModal';
import { PROFILES_PATH } from '../profileRoutes';

import styles from './profile-detail.module.pcss';

/**
 * Profile detail page showing per-profile settings.
 */
export const ProfileDetail = observer(() => {
    const { profilesStore, telemetryStore } = useContext(rootStore);
    const history = useHistory();
    const { id } = useParams<{ id: string }>();

    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const profile = profilesStore.profiles.find((p) => p.id === id);

    const isDialogOpen = isRenameModalOpen || isDeleteModalOpen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.ProfileSettingsScreen,
        !!profile && !isDialogOpen,
    );

    const handleBack = (): void => {
        history.push(PROFILES_PATH);
    };

    if (!profile) {
        return <Redirect to={PROFILES_PATH} />;
    }

    return (
        <div className={styles.root}>
            <Title
                title={profilesStore.getDisplayName(profile)}
                action={(
                    <ProfileActions
                        profileId={profile.id}
                        onRename={(): void => setIsRenameModalOpen(true)}
                        onDelete={(): void => setIsDeleteModalOpen(true)}
                    />
                )}
                onClick={handleBack}
            />
            <ProfileSettings profileId={profile.id} isProfileContext />
            <RenameProfileModal
                isOpen={isRenameModalOpen}
                profileId={profile.id}
                currentName={profile.name}
                onClose={(): void => setIsRenameModalOpen(false)}
            />
            <DeleteProfileModal
                isOpen={isDeleteModalOpen}
                profileId={profile.id}
                profileName={profilesStore.getDisplayName(profile)}
                isActive={profilesStore.isActive(profile.id)}
                onClose={(): void => setIsDeleteModalOpen(false)}
            />
        </div>
    );
});
