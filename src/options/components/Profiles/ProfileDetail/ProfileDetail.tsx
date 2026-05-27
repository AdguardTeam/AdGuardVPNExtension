import React, { useContext, useCallback } from 'react';
import { observer } from 'mobx-react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../../stores';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { WebRTC } from '../../General/WebRTC';
import { DnsSettingsButton } from '../../General/DnsSettings';
import { Title } from '../../ui/Title';
import { ProfileActions } from '../ProfileActions';
import { PROFILES_PATH, getProfileDnsRoute, getProfileLocationRoute } from '../profileRoutes';

import { ExclusionsButton } from './ExclusionsButton';
import { LocationButton } from './LocationButton';

import styles from './profile-detail.module.pcss';

/**
 * Profile detail page showing per-profile settings.
 */
export const ProfileDetail = observer(() => {
    const { profilesStore, telemetryStore } = useContext(rootStore);
    const history = useHistory();
    const { id } = useParams<{ id: string }>();

    const profile = profilesStore.profiles.find((p) => p.id === id);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.NewProfilesSettingsScreen,
        !!profile,
    );

    const handleBack = (): void => {
        history.push(PROFILES_PATH);
    };

    const handleDnsClick = useCallback((): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.ChooseDnsProfilesClick,
            TelemetryScreenName.NewProfilesSettingsScreen,
        );
        history.push(getProfileDnsRoute(id));
    }, [history, id, telemetryStore]);

    const handleLocationClick = useCallback((): void => {
        history.push(getProfileLocationRoute(id));
    }, [history, id]);

    if (!profile) {
        return <Redirect to={PROFILES_PATH} />;
    }

    const displayName = profilesStore.getDisplayName(profile);

    return (
        <div className={styles.root}>
            <Title
                title={displayName}
                action={<ProfileActions profileId={profile.id} />}
                onClick={handleBack}
            />
            <LocationButton profileId={profile.id} onClick={handleLocationClick} />
            <WebRTC profileId={profile.id} isProfileContext />
            <DnsSettingsButton profileId={profile.id} onClick={handleDnsClick} />
            <ExclusionsButton />
        </div>
    );
});
