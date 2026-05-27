import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { Title } from '../ui/Title';

import { ProfilesList } from './ProfilesList';
import { ProfileActions } from './ProfileActions';

import styles from './profiles.module.pcss';

/**
 * Profiles settings page component.
 */
export const Profiles = observer(() => {
    const { profilesStore } = useContext(rootStore);

    const { activeProfile } = profilesStore;

    return (
        <div className={styles.root}>
            <Title
                title={translator.getMessage('settings_profiles_title')}
                subtitle={translator.getMessage('settings_profiles_subtitle')}
                action={activeProfile && (
                    <ProfileActions profileId={activeProfile.id} />
                )}
            />
            <ProfilesList />
        </div>
    );
});
