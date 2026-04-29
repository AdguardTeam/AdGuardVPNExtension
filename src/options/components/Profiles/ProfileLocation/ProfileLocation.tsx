import React, { useCallback, useContext, useState } from 'react';
import { observer } from 'mobx-react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { containsIgnoreCase } from '../../../../common/components/SearchHighlighter/helpers';
import { messenger } from '../../../../common/messenger';
import { translator } from '../../../../common/translator';
import { rootStore } from '../../../stores';
import { Title } from '../../ui/Title';
import { Input } from '../../ui/Input';

import { LocationItem } from './LocationItem';

import styles from './profile-location.module.pcss';

/**
 * Profile location selection page.
 * Shows available VPN locations and lets the user pick a default for the profile.
 */
export const ProfileLocation = observer(() => {
    const { profilesStore, settingsStore } = useContext(rootStore);
    const history = useHistory();
    const { id } = useParams<{ id: string }>();

    const profile = profilesStore.profiles.find((p) => p.id === id);

    const [searchValue, setSearchValue] = useState('');

    const handleBack = useCallback((): void => {
        history.push(`/profiles/${id}`);
    }, [history, id]);

    const handleSelect = useCallback(async (locationId: string): Promise<void> => {
        await messenger.setProfileSetting(id, { selectedLocationId: locationId });
        profilesStore.updateLocationCache(id, locationId);
    }, [id, profilesStore]);

    if (!profile) {
        return <Redirect to="/profiles" />;
    }

    const selectedLocationId = profilesStore.locationCache.get(id) ?? null;

    const { isPremiumToken } = settingsStore;

    const filteredLocations = settingsStore.locations
        .filter((l) => {
            if (!isPremiumToken && l.premiumOnly) {
                return false;
            }
            if (searchValue) {
                return containsIgnoreCase(l.countryName, searchValue)
                    || containsIgnoreCase(l.cityName, searchValue);
            }
            return true;
        })
        .sort((a, b) => {
            const countryDiff = a.countryName.localeCompare(b.countryName);
            if (countryDiff !== 0) {
                return countryDiff;
            }
            return a.cityName.localeCompare(b.cityName);
        });

    const displayName = profilesStore.getDisplayName(profile);

    return (
        <div className={styles.root}>
            <Title
                title={translator.getMessage('settings_location_label')}
                onClick={handleBack}
            />

            <div
                className={styles.subtitle}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                    __html: translator.getMessage('settings_location_applies_to_profile', {
                        profileName: displayName,
                    }),
                }}
            />

            <div className={styles.search}>
                <Input
                    placeholder={translator.getMessage('settings_location_search')}
                    value={searchValue}
                    onChange={setSearchValue}
                />
            </div>

            <div className={styles.list}>
                {filteredLocations.length === 0 && (
                    <div className={styles.empty}>
                        {translator.getMessage('settings_location_not_found')}
                    </div>
                )}
                {filteredLocations.map((location) => (
                    <LocationItem
                        key={location.id}
                        id={location.id}
                        countryName={location.countryName}
                        cityName={location.cityName}
                        countryCode={location.countryCode}
                        selected={location.id === selectedLocationId}
                        onClick={handleSelect}
                    />
                ))}
            </div>
        </div>
    );
});
