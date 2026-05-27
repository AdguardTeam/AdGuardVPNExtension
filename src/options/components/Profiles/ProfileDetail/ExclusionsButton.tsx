import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { useHistory, useParams } from 'react-router-dom';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { ExclusionsMode } from '../../../../common/exclusionsConstants';
import { translator } from '../../../../common/translator';
import { IconButton } from '../../../../common/components/Icons';
import { rootStore } from '../../../stores';
import { Controls } from '../../ui/Controls';
import { getProfileExclusionsRoute } from '../profileRoutes';

/**
 * Navigable row showing current exclusion mode for a profile.
 * Clicking navigates to the profile's exclusions page.
 */
export const ExclusionsButton = observer((): React.ReactElement => {
    const { profilesStore, telemetryStore } = useContext(rootStore);
    const history = useHistory();
    const { id } = useParams<{ id: string }>();

    const cacheEntry = profilesStore.exclusionsCache[id];
    const currentMode = cacheEntry?.currentMode ?? ExclusionsMode.Regular;

    const modeTitle = currentMode === ExclusionsMode.Regular
        ? translator.getMessage('settings_exclusion_general_title')
        : translator.getMessage('settings_exclusion_selective_title');

    const handleClick = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.ProfilesExclusionClick,
            TelemetryScreenName.NewProfilesSettingsScreen,
        );
        history.push(getProfileExclusionsRoute(id));
    };

    return (
        <Controls
            title={translator.getMessage('settings_exclusion_title')}
            description={translator.getMessage('settings_description_current', {
                mode: modeTitle,
            })}
            action={<IconButton name="arrow-down" rotation="clockwise" />}
            onClick={handleClick}
        />
    );
});
