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
 * Navigable row showing the current location for a profile.
 * Clicking navigates to the profile's location settings page.
 */
export const LocationButton = observer(({ profileId, onClick }: LocationButtonProps): React.ReactElement => {
    const { profilesStore } = useContext(rootStore);

    const quickConnect = profilesStore.quickConnectCache[profileId];
    const isFastest = quickConnect === QuickConnectSetting.FastestLocation;

    const locationData = profilesStore.locationCache[profileId];
    const locationName = locationData ? `${locationData.cityName}, ${locationData.countryName}` : null;

    const description = !isFastest && locationName
        ? translator.getMessage('settings_description_current', { mode: locationName })
        : translator.getMessage('settings_description_current', {
            mode: translator.getMessage('settings_location_fastest_title'),
        });

    return (
        <Controls
            title={translator.getMessage('settings_location_label')}
            description={description}
            action={<IconButton name="arrow-down" rotation="clockwise" />}
            onClick={onClick}
        />
    );
});
