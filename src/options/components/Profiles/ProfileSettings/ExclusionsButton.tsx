import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { useHistory, useLocation } from 'react-router-dom';

import { TelemetryActionName } from '../../../../background/telemetry/telemetryEnums';
import { ExclusionsMode } from '../../../../common/exclusionsConstants';
import { translator } from '../../../../common/translator';
import { IconButton } from '../../../../common/components/Icons';
import { rootStore } from '../../../stores';
import { Controls } from '../../ui/Controls';
import { getProfileExclusionsRoute, withProfileOrigin } from '../profileRoutes';

import { type ProfileSettingsScreenName } from './ProfileSettings';

/**
 * ExclusionsButton component props.
 */
export interface ExclusionsButtonProps {
    /**
     * Profile ID to read the current exclusions mode from.
     */
    profileId: string;

    /**
     * Screen the row is rendered on, used for telemetry.
     */
    telemetryScreenName: ProfileSettingsScreenName;
}

/**
 * Navigable row showing current exclusion mode for a profile.
 * Clicking navigates to the profile's exclusions page.
 */
export const ExclusionsButton = observer(({
    profileId,
    telemetryScreenName,
}: ExclusionsButtonProps): React.ReactElement => {
    const { profilesStore, telemetryStore } = useContext(rootStore);
    const history = useHistory();
    const location = useLocation();

    const cacheEntry = profilesStore.exclusionsCache[profileId];
    const currentMode = cacheEntry?.currentMode ?? ExclusionsMode.Regular;

    const modeState = currentMode === ExclusionsMode.Regular
        ? translator.getMessage('settings_exclusion_general_state')
        : translator.getMessage('settings_exclusion_selective_state');

    const handleClick = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.ExclusionsSettingsClick,
            telemetryScreenName,
        );
        history.push(withProfileOrigin(getProfileExclusionsRoute(profileId), location.pathname));
    };

    return (
        <Controls
            title={translator.getMessage('settings_exclusion_title')}
            description={(
                <span className="controls__state">{modeState}</span>
            )}
            action={<IconButton name="arrow-down" rotation="clockwise" />}
            onClick={handleClick}
        />
    );
});
