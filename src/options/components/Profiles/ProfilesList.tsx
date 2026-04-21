import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { useHistory } from 'react-router-dom';

import { MAX_PROFILES_COUNT } from '../../../common/profilesConstants';
import { translator } from '../../../common/translator';
import { Icon } from '../../../common/components/Icons';
import { rootStore } from '../../stores';
import { Button } from '../ui/Button';
import { Radio } from '../ui/Radio';

import styles from './profiles.module.pcss';

/**
 * Renders the list of profiles with radio-button style selection indicators.
 */
export const ProfilesList = observer(() => {
    const { profilesStore } = useContext(rootStore);
    const history = useHistory();

    const { profiles } = profilesStore;

    const isLimitReached = profiles.length >= MAX_PROFILES_COUNT;

    const handleNavigate = (profileId: string): void => {
        history.push(`/profiles/${profileId}`);
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
                            title={profilesStore.getDisplayName(profile)}
                            onSelect={(id): void => profilesStore.setActiveProfile(id)}
                            className={styles.itemRadio}
                        />
                        <button
                            type="button"
                            className={styles.itemChevron}
                            onClick={(): void => handleNavigate(profile.id)}
                            aria-label={profilesStore.getDisplayName(profile)}
                        >
                            <Icon
                                name="arrow-down"
                                color="gray"
                                rotation="clockwise"
                            />
                        </button>
                    </div>
                );
            })}
            {!isLimitReached && (
                <Button
                    variant="transparent"
                    beforeIconName="plus"
                    // FIXME: AG-52848 Implement profile creation flow and replace this placeholder onClick handler
                    // eslint-disable-next-line no-alert
                    onClick={(): void => alert('Coming soon...')}
                    className={styles.createBtn}
                >
                    {translator.getMessage('settings_profiles_create')}
                </Button>
            )}
        </div>
    );
});
