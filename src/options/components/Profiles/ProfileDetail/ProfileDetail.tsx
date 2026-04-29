import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { isDefaultProfileId } from '../../../../common/profilesConstants';
import { rootStore } from '../../../stores';
import { WebRTC } from '../../General/WebRTC';
import { Title } from '../../ui/Title';
import { ProfileActions } from '../ProfileActions';

import styles from './profile-detail.module.pcss';

/**
 * Profile detail page showing per-profile settings (WebRTC, etc.).
 */
export const ProfileDetail = observer(() => {
    const { profilesStore } = useContext(rootStore);
    const history = useHistory();
    const { id } = useParams<{ id: string }>();

    const profile = profilesStore.profiles.find((p) => p.id === id);

    const handleBack = (): void => {
        history.push('/profiles');
    };

    if (!profile) {
        return <Redirect to="/profiles" />;
    }

    const displayName = profilesStore.getDisplayName(profile);

    const isDefault = isDefaultProfileId(profile.id);
    const isActive = profilesStore.isActive(profile.id);

    return (
        <div className={styles.root}>
            <Title
                title={displayName}
                action={<ProfileActions isDefault={isDefault} isActive={isActive} />}
                onClick={handleBack}
            />
            <WebRTC profileId={profile.id} />
        </div>
    );
});
