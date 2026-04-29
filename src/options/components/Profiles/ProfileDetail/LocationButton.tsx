import React, { useContext } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { translator } from '../../../../common/translator';
import { IconButton } from '../../../../common/components/Icons';
import { rootStore } from '../../../stores';
import { Controls } from '../../ui/Controls';

/**
 * Navigable row showing current location for a profile.
 * Clicking navigates to the profile's location selection page.
 */
export const LocationButton = (): React.ReactElement => {
    const { profilesStore, settingsStore } = useContext(rootStore);
    const history = useHistory();
    const { id } = useParams<{ id: string }>();

    const selectedLocationId = profilesStore.locationCache.get(id) ?? null;
    const location = selectedLocationId
        ? settingsStore.locations.find((l) => l.id === selectedLocationId)
        : null;

    const locationName = location
        ? `${location.countryName}, ${location.cityName}`
        : null;

    const description = locationName
        ? translator.getMessage('settings_location_description_current', { locationName })
        : translator.getMessage('settings_location_not_selected');

    const handleClick = (): void => {
        history.push(`/profiles/${id}/location`);
    };

    return (
        <Controls
            title={translator.getMessage('settings_location_label')}
            description={description}
            action={<IconButton name="arrow-down" rotation="clockwise" />}
            onClick={handleClick}
        />
    );
};
