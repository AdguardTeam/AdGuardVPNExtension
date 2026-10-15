import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { QuickConnectSetting } from '../../../../common/constants';
import { translator } from '../../../../common/translator';
import { IconButton } from '../../../../common/components/Icons';
import { rootStore } from '../../../stores';
import { Controls } from '../../ui/Controls';

/**
 * LocationButton component props.
 */
interface LocationButtonProps {
    /**
     * Profile ID to read location data from.
     */
    profileId: string;

    /**
     * Click handler for navigation to location settings page.
     */
    onClick: () => void;
}

/**
 * Navigable row showing the current quick connect location for a profile.
 * Clicking navigates to the profile's location settings page.
 */
export const LocationButton = observer(({ profileId, onClick }: LocationButtonProps): React.ReactElement => {
    const { profilesStore } = useContext(rootStore);

    const quickConnect = profilesStore.quickConnectCache[profileId];
    const isFastest = quickConnect === QuickConnectSetting.FastestLocation;
    const isSpecificLocation = quickConnect === QuickConnectSetting.SpecificLocation;

    const locationData = profilesStore.locationCache[profileId];
    const locationName = locationData
        ? `${locationData.countryName}, ${locationData.cityName}`
        : null;

    // Only a location pinned to the profile is shown as a value:
    // other profiles show their quick connect strategy.
    const strategyTitle = isFastest
        ? translator.getMessage('settings_location_fastest_title')
        : translator.getMessage('settings_quick_connect_last_used');
    const currentLocation = isSpecificLocation && locationName ? locationName : strategyTitle;

    return (
        <Controls
            title={translator.getMessage('settings_quick_connect_title')}
            description={(
                <>
                    {translator.getMessage('settings_quick_connect_description')}
                    <br />
                    <br />
                    <span className="controls__state">{currentLocation}</span>
                </>
            )}
            action={<IconButton name="arrow-down" rotation="clockwise" />}
            onClick={onClick}
        />
    );
});
