import React, { useCallback, useContext } from 'react';
import { observer } from 'mobx-react';
import { useHistory, useLocation } from 'react-router-dom';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../../stores';
import { WebRTC } from '../../General/WebRTC';
import { DnsSettingsButton } from '../../General/DnsSettings';
import { getProfileDnsRoute, getProfileLocationRoute, withProfileOrigin } from '../profileRoutes';

import { ExclusionsButton } from './ExclusionsButton';
import { LocationButton } from './LocationButton';

/**
 * Screens the settings rows can be rendered on.
 */
export type ProfileSettingsScreenName = TelemetryScreenName.GeneralSettingsScreen
| TelemetryScreenName.ProfileSettingsScreen;

/**
 * ProfileSettings component props.
 */
interface ProfileSettingsProps {
    /**
     * Profile the settings belong to.
     */
    profileId: string;

    /**
     * Whether the block is rendered on a dedicated profile screen.
     * Affects the telemetry screen name.
     */
    isProfileContext?: boolean;
}

/**
 * Reusable block of per-profile settings rows:
 * exclusions, DNS server, quick connect and WebRTC.
 * Rendered on the Settings screen for the active profile
 * and on the profile detail screen.
 */
export const ProfileSettings = observer(({
    profileId,
    isProfileContext = false,
}: ProfileSettingsProps): React.ReactElement => {
    const { telemetryStore } = useContext(rootStore);
    const history = useHistory();
    const location = useLocation();

    const screenName: ProfileSettingsScreenName = isProfileContext
        ? TelemetryScreenName.ProfileSettingsScreen
        : TelemetryScreenName.GeneralSettingsScreen;

    const handleDnsClick = useCallback((): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.DnsServerClick,
            screenName,
        );
        history.push(withProfileOrigin(getProfileDnsRoute(profileId), location.pathname));
    }, [history, location.pathname, profileId, telemetryStore, screenName]);

    const handleLocationClick = useCallback((): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.QuickConnectClick,
            screenName,
        );
        history.push(withProfileOrigin(getProfileLocationRoute(profileId), location.pathname));
    }, [history, location.pathname, profileId, telemetryStore, screenName]);

    return (
        <>
            <ExclusionsButton
                profileId={profileId}
                telemetryScreenName={screenName}
            />
            <DnsSettingsButton profileId={profileId} onClick={handleDnsClick} />
            <LocationButton profileId={profileId} onClick={handleLocationClick} />
            <WebRTC profileId={profileId} isProfileContext={isProfileContext} />
        </>
    );
});
