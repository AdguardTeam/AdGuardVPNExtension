import React, { useContext, useState, useCallback } from 'react';
import { observer } from 'mobx-react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { QuickConnectSetting } from '../../../../common/constants';
import { translator } from '../../../../common/translator';
import { messenger } from '../../../../common/messenger';
import { getFlagIconStyle } from '../../../../common/utils/flagIcon';
import { type LocationWithPingInterface } from '../../../../common/schema/endpoints/locationWithPing';
import { rootStore } from '../../../stores';
import { Title } from '../../ui/Title';
import { Radio } from '../../../../common/components/Radio';
import { Input } from '../../ui/Input';
import { ProfileHint } from '../../ui/ProfileHint';
import { getProfileRoute, PROFILES_PATH } from '../profileRoutes';

import styles from './profile-location-settings.module.pcss';

/**
 * Sentinel value representing automatic (fastest) location selection.
 */
const AUTO_LOCATION_VALUE = 'auto';

/**
 * Builds a sort key for a location by combining country and city names.
 *
 * @param loc Location to build key for.
 * @returns Combined sort key string.
 */
const getLocationKey = (loc: LocationWithPingInterface): string => {
    return `${loc.countryName}${loc.cityName}`;
};

/**
 * Profile location settings page.
 * Shows a searchable list of VPN locations with radio buttons
 * for selecting a location per profile.
 */
export const ProfileLocationSettings = observer(() => {
    const { profilesStore, settingsStore } = useContext(rootStore);
    const history = useHistory();
    const { id: profileId } = useParams<{ id: string }>();

    const [searchValue, setSearchValue] = useState('');

    const { locations, isPremiumToken } = settingsStore;
    const profile = profilesStore.profiles.find((p) => p.id === profileId);
    const quickConnect = profilesStore.quickConnectCache[profileId];
    const isFastestSelected = quickConnect === QuickConnectSetting.FastestLocation;
    const locationData = profilesStore.locationCache[profileId];
    const selectedLocationId = locationData?.id ?? null;

    const handleBack = useCallback((): void => {
        history.push(getProfileRoute(profileId));
    }, [history, profileId]);

    const handleSelect = useCallback(async (locationId: string): Promise<void> => {
        if (locationId === AUTO_LOCATION_VALUE) {
            await profilesStore.updateQuickConnectCache(profileId, QuickConnectSetting.FastestLocation);
        } else {
            await profilesStore.updateQuickConnectCache(profileId, QuickConnectSetting.LastUsedLocation);
            await messenger.setCurrentLocation(profileId, locationId);
        }
    }, [profileId, profilesStore]);

    if (!profile) {
        return <Redirect to={PROFILES_PATH} />;
    }

    const normalizedSearch = searchValue.toLowerCase().trim();

    const filteredLocations = locations
        .filter((loc) => {
            return loc.available !== false
                && (isPremiumToken || !loc.premiumOnly)
                && (loc.countryName.toLowerCase().includes(normalizedSearch)
                    || loc.cityName.toLowerCase().includes(normalizedSearch));
        })
        .sort((a, b) => getLocationKey(a).localeCompare(getLocationKey(b)));

    return (
        <div className={styles.root}>
            <Title
                title={translator.getMessage('settings_location_label')}
                subtitle={<ProfileHint profileId={profileId} />}
                onClick={handleBack}
                subtitleIndent={false}
            />

            <div className={styles.search}>
                <Input
                    placeholder={translator.getMessage('endpoints_search')}
                    value={searchValue}
                    onChange={setSearchValue}
                />
            </div>

            <div className={styles.list}>
                {normalizedSearch === '' && (
                    <Radio
                        name="profile-location"
                        value={AUTO_LOCATION_VALUE}
                        isActive={isFastestSelected}
                        title={translator.getMessage('settings_location_fastest_title')}
                        description={translator.getMessage('settings_location_fastest_description')}
                        onSelect={handleSelect}
                    />
                )}

                {filteredLocations.length === 0 && (
                    <div className={styles.empty}>
                        {translator.getMessage('endpoints_not_found')}
                    </div>
                )}

                {filteredLocations.map((location) => (
                    <Radio
                        key={location.id}
                        name="profile-location"
                        value={location.id}
                        isActive={!isFastestSelected && location.id === selectedLocationId}
                        title={(
                            <span className={styles.location}>
                                <span
                                    className={styles.flag}
                                    style={getFlagIconStyle(location.countryCode)}
                                />
                                <span className={styles.locationInfo}>
                                    <span className={styles.country}>
                                        {location.countryName}
                                    </span>
                                    <span className={styles.city}>
                                        {location.cityName}
                                    </span>
                                </span>
                            </span>
                        )}
                        onSelect={handleSelect}
                    />
                ))}
            </div>
        </div>
    );
});
