import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';

import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { MAX_PROFILES_COUNT } from '../../../common/profiles';
import { translator } from '../../../common/translator';
import { Icon } from '../../../common/components/Icons';
import { rootStore } from '../../stores';
import { Button } from '../ui/Button';
import { Radio } from '../../../common/components/Radio';

import { getProfileRoute } from './profileRoutes';
import { CreateProfileModal } from './modal/CreateProfileModal';

import styles from './profiles.module.pcss';

/**
 * Renders the list of profiles with radio-button style selection indicators.
 */
export const ProfilesList = observer(() => {
    const { profilesStore, telemetryStore } = useContext(rootStore);
    const { profiles, isSwitchingProfile, activeProfileId } = profilesStore;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // `DialogCreateProfile` is rendered on top of this screen,
    // so the page view is re-sent when the dialog closes.
    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.ManageProfilesScreen,
        !isCreateModalOpen,
    );

    const isLimitReached = profiles.length >= MAX_PROFILES_COUNT;

    const handleOpenCreateModal = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.CreateProfileClick,
            TelemetryScreenName.ManageProfilesScreen,
        );
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = (): void => {
        setIsCreateModalOpen(false);
    };

    const handleProfileSelect = async (id: string): Promise<void> => {
        if (id === activeProfileId) {
            return;
        }

        await profilesStore.setActiveProfile(id);
    };

    return (
        <div className={styles.list}>
            {profiles.map((profile) => {
                const isActive = profilesStore.isActive(profile.id);

                return (
                    <div
                        key={profile.id}
                        className={styles.item}
                    >
                        <Radio
                            name="profile"
                            value={profile.id}
                            isActive={isActive}
                            isLoading={isActive && isSwitchingProfile}
                            title={profilesStore.getDisplayName(profile)}
                            onSelect={handleProfileSelect}
                            className={styles.itemRadio}
                        />
                        <Link
                            to={getProfileRoute(profile.id)}
                            className={styles.itemChevron}
                            aria-label={profilesStore.getDisplayName(profile)}
                        >
                            <Icon
                                name="arrow-down"
                                color="gray"
                                rotation="clockwise"
                            />
                        </Link>
                    </div>
                );
            })}
            {!isLimitReached && (
                <>
                    <div className={styles.divider} />
                    <Button
                        variant="transparent"
                        beforeIconName="plus"
                        onClick={handleOpenCreateModal}
                    >
                        {translator.getMessage('settings_profiles_create')}
                    </Button>
                </>
            )}
            <CreateProfileModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
            />
        </div>
    );
});
