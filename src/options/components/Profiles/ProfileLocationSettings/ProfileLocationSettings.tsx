import React, {
    useContext,
    useState,
    useCallback,
    useRef,
} from 'react';
import { observer } from 'mobx-react';
import {
    Redirect,
    useHistory,
    useLocation,
    useParams,
} from 'react-router-dom';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { QuickConnectSetting } from '../../../../common/constants';
import { isLocationAvailableForToken } from '../../../../common/helpers';
import { translator } from '../../../../common/translator';
import { messenger } from '../../../../common/messenger';
import { getFlagIconStyle } from '../../../../common/utils/flagIcon';
import { type LocationWithPingInterface } from '../../../../common/schema/endpoints/locationWithPing';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { rootStore } from '../../../stores';
import { useProfileRouteNavigation } from '../../../hooks/useProfileRouteNavigation';
import { Title } from '../../ui/Title';
import { Radio } from '../../../../common/components/Radio';
import { Input } from '../../ui/Input';
import { ProfileHint } from '../../ui/ProfileHint';
import { getProfileRoute, getProfileSubScreenOrigin, PROFILES_PATH } from '../profileRoutes';

import styles from './profile-location-settings.module.pcss';

/**
 * Sentinel value representing automatic (fastest) location selection.
 */
const AUTO_LOCATION_VALUE = 'auto';

/**
 * Sentinel value representing the "last used location" strategy.
 */
const LAST_USED_LOCATION_VALUE = 'lastUsed';

/**
 * Radio group name shared by all location options.
 */
const LOCATION_RADIO_GROUP_NAME = 'profile-location';

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
    const { profilesStore, settingsStore, telemetryStore } = useContext(rootStore);
    const history = useHistory();
    const location = useLocation();
    const { id: profileId } = useParams<{ id: string }>();

    const navigateToProfile = useProfileRouteNavigation(getProfileRoute);

    const handleProfileHintClick = (hintProfileId: string): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.AppliesToProfileClick,
            TelemetryScreenName.QuickConnectScreen,
        );
        navigateToProfile(hintProfileId);
    };

    const [searchValue, setSearchValue] = useState('');

    /**
     * Counter of the location choices made in this screen. Used to ignore
     * the handlers that were in flight when another option was picked.
     */
    const selectGenerationRef = useRef(0);

    const { locations, isPremiumToken } = settingsStore;
    const profile = profilesStore.profiles.find((p) => p.id === profileId);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.QuickConnectScreen,
        !!profile,
    );

    const quickConnect = profilesStore.quickConnectCache[profileId];
    const isFastestSelected = quickConnect === QuickConnectSetting.FastestLocation;
    const isLastUsedSelected = quickConnect === QuickConnectSetting.LastUsedLocation;
    const isSpecificLocationSelected = quickConnect === QuickConnectSetting.SpecificLocation;
    const locationData = profilesStore.locationCache[profileId];
    const selectedLocationId = locationData?.id ?? null;

    const origin = getProfileSubScreenOrigin(location.search, profileId);

    const handleBack = useCallback((): void => {
        history.push(origin);
    }, [history, origin]);

    const handleSelect = useCallback(async (value: string): Promise<void> => {
        selectGenerationRef.current += 1;
        const generation = selectGenerationRef.current;

        if (value === AUTO_LOCATION_VALUE) {
            telemetryStore.sendCustomEvent(
                TelemetryActionName.FastestQuickConnectClick,
                TelemetryScreenName.QuickConnectScreen,
            );
            await profilesStore.updateQuickConnectCache(profileId, QuickConnectSetting.FastestLocation);
            return;
        }

        if (value === LAST_USED_LOCATION_VALUE) {
            telemetryStore.sendCustomEvent(
                TelemetryActionName.LastQuickConnectClick,
                TelemetryScreenName.QuickConnectScreen,
            );
            await profilesStore.updateQuickConnectCache(profileId, QuickConnectSetting.LastUsedLocation);
            return;
        }

        telemetryStore.sendCustomEvent(
            TelemetryActionName.LocationQuickConnectClick,
            TelemetryScreenName.QuickConnectScreen,
        );

        const strategyBeforeApply = profilesStore.quickConnectCache[profileId];

        const isLocationApplied = await messenger.setCurrentLocation(profileId, value);
        const strategyChanged = profilesStore.quickConnectCache[profileId] !== strategyBeforeApply;

        // The strategy may have changed while the location was being applied:
        // another option was picked (re-clicking the already active one does not
        // change the cache value, hence the generation check) or the settings
        // were synced from the background. The latest choice wins in both cases.
        const isOutdated = selectGenerationRef.current !== generation;

        if (!isLocationApplied || strategyChanged || isOutdated) {
            return;
        }

        await profilesStore.updateQuickConnectCache(profileId, QuickConnectSetting.SpecificLocation);
    }, [profileId, profilesStore, telemetryStore]);

    if (!profile) {
        return <Redirect to={PROFILES_PATH} />;
    }

    const normalizedSearch = searchValue.toLowerCase().trim();

    const filteredLocations = locations
        .filter((loc) => {
            return loc.available !== false
                && isLocationAvailableForToken(loc, isPremiumToken)
                && (loc.countryName.toLowerCase().includes(normalizedSearch)
                    || loc.cityName.toLowerCase().includes(normalizedSearch));
        })
        .sort((a, b) => getLocationKey(a).localeCompare(getLocationKey(b)));

    return (
        <div className={styles.root}>
            <Title
                title={translator.getMessage('settings_quick_connect_title')}
                subtitle={<ProfileHint profileId={profileId} onClick={handleProfileHintClick} />}
                subtitleIndent={false}
                onClick={handleBack}
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
                    <>
                        <Radio
                            name={LOCATION_RADIO_GROUP_NAME}
                            value={AUTO_LOCATION_VALUE}
                            isActive={isFastestSelected}
                            title={translator.getMessage('settings_location_fastest_title')}
                            description={translator.getMessage('settings_location_fastest_description')}
                            onSelect={handleSelect}
                        />
                        <Radio
                            name={LOCATION_RADIO_GROUP_NAME}
                            value={LAST_USED_LOCATION_VALUE}
                            isActive={isLastUsedSelected}
                            title={translator.getMessage('settings_quick_connect_last_used')}
                            description={translator.getMessage('settings_location_last_used_description')}
                            onSelect={handleSelect}
                        />
                    </>
                )}

                {filteredLocations.length === 0 && (
                    <div className={styles.empty}>
                        {translator.getMessage('endpoints_not_found')}
                    </div>
                )}

                {filteredLocations.map((location) => (
                    <Radio
                        key={location.id}
                        name={LOCATION_RADIO_GROUP_NAME}
                        value={location.id}
                        isActive={isSpecificLocationSelected && location.id === selectedLocationId}
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
