import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { translator } from '../../../../common/translator';
import { IconButton, Icon } from '../../../../common/components/Icons';
import { Radio } from '../../../../common/components/Radio';
import { messenger } from '../../../../common/messenger';
import { log } from '../../../../common/logger';
import { getProfileDisplayName } from '../../../../common/profiles';
import { rootStore } from '../../../stores';

import styles from './profiles-screen.module.pcss';

const RADIO_NAME = 'profile';

/**
 * Full-screen popup panel showing the list of profiles with radio selection.
 */
export const ProfilesScreen = observer(() => {
    const { vpnStore, telemetryStore } = useContext(rootStore);
    const { profiles, activeProfileId, isSwitchingProfile } = vpnStore;

    const handleProfileSelect = async (profileId: string): Promise<void> => {
        if (profileId === activeProfileId) {
            return;
        }
        telemetryStore.sendCustomEvent(
            TelemetryActionName.ChooseProfilesClick,
            TelemetryScreenName.ProfilesScreen,
        );
        try {
            await messenger.switchProfile(profileId);
        } catch (e) {
            log.error('[vpn.ProfilesScreen]: Failed to switch profile', e);
        }
    };

    const handleSettingsClick = async (): Promise<void> => {
        try {
            await messenger.openProfilesPage();
        } catch (e) {
            log.error('[vpn.ProfilesScreen]: Failed to open profiles page', e);
        }
        window.close();
    };

    return (
        <div className={styles.root}>
            <IconButton
                name="back"
                className={styles.header}
                onClick={(): void => vpnStore.setProfilesScreenOpen(false)}
            />
            <div className={styles.title}>
                {translator.getMessage('popup_profiles_title')}
            </div>
            <div className={styles.list}>
                {profiles.map((profile) => (
                    <Radio
                        key={profile.id}
                        name={RADIO_NAME}
                        titleClassName={styles.profileItemTitle}
                        value={profile.id}
                        isActive={profile.id === activeProfileId}
                        isLoading={profile.id === activeProfileId && isSwitchingProfile}
                        title={getProfileDisplayName(profile.id, profile.name)}
                        onSelect={handleProfileSelect}
                    />
                ))}
                <button
                    type="button"
                    className={styles.settingsLink}
                    onClick={handleSettingsClick}
                >
                    <span className={styles.settingsText}>
                        {translator.getMessage('popup_profiles_settings')}
                    </span>
                    <Icon
                        name="arrow-down"
                        color="gray"
                        rotation="clockwise"
                    />
                </button>
            </div>
        </div>
    );
});
