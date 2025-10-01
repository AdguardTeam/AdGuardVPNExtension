import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { translator } from '../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { rootStore } from '../../stores';

import { StatsScreen } from './StatsScreen';

export const Stats = observer(() => {
    const { statsStore, telemetryStore } = useContext(rootStore);
    const {
        isAllLocationsScreenOpen,
        range,
        firstStatsDate,
        isStatisticsLoading,
        isStatsDisabled,
        isMenuOpen,
        isStatsInfoModalOpen,
        isDisableModalOpen,
        isClearModalOpen,
        totalUsage,
        locations,
        selectedLocation,
        closeStatsScreen,
        openAllLocationsScreen,
        closeAllLocationsScreen,
        openLocationScreen,
        closeLocationScreen,
        updateRange,
        updateIsStatsDisabled,
        clearAllStats,
    } = statsStore;

    const isLocationScreenOpen = !!selectedLocation;

    // These screens are rendered on top of `StatsScreen`, `LocationScreen`,
    // `AllLocationsScreen` screens and their disabled versions.
    const isOverlappedWithScreen = isMenuOpen // `SettingsStatsScreen`
        || isStatsInfoModalOpen // `StatsInfoScreen`
        || isDisableModalOpen // `DisableStatsScreen`
        || isClearModalOpen; // `ClearStatsScreen`

    const canSendStatsTelemetry = !isLocationScreenOpen // `LocationStatsScreen`
        && !isAllLocationsScreenOpen // `AllLocationsStatsScreen`
        && !isOverlappedWithScreen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.StatsScreen,
        canSendStatsTelemetry && !isStatsDisabled,
    );

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DisabledStatsScreen,
        canSendStatsTelemetry && isStatsDisabled,
    );

    const canSendLocationStatsTelemetry = isLocationScreenOpen
        && !isOverlappedWithScreen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.LocationStatsScreen,
        canSendLocationStatsTelemetry && !isStatsDisabled,
    );

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DisabledLocationStatsScreen,
        canSendLocationStatsTelemetry && isStatsDisabled,
    );

    const canSendAllLocationsStatsTelemetry = isAllLocationsScreenOpen
        && !isLocationScreenOpen // `LocationStatsScreen`
        && !isOverlappedWithScreen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.AllLocationsStatsScreen,
        canSendAllLocationsStatsTelemetry && !isStatsDisabled,
    );

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DisabledAllLocationsStatsScreen,
        canSendAllLocationsStatsTelemetry && isStatsDisabled,
    );

    if (selectedLocation) {
        const { location, usage } = selectedLocation;
        const { countryCode, countryName, cityName } = location;

        return (
            <StatsScreen
                type="location"
                title={`${countryName} (${cityName})`}
                range={range}
                firstStatsDate={firstStatsDate}
                isLoading={isStatisticsLoading}
                isDisabled={isStatsDisabled}
                usage={usage}
                countryCode={countryCode}
                onBackClick={closeLocationScreen}
                onClear={clearAllStats}
                onRangeChange={updateRange}
                onDisableChange={updateIsStatsDisabled}
            />
        );
    }

    if (isAllLocationsScreenOpen) {
        return (
            <StatsScreen
                type="all-locations"
                title={translator.getMessage('popup_stats_locations')}
                range={range}
                firstStatsDate={firstStatsDate}
                isLoading={isStatisticsLoading}
                isDisabled={isStatsDisabled}
                locations={locations}
                onBackClick={closeAllLocationsScreen}
                onClear={clearAllStats}
                onRangeChange={updateRange}
                onAllLocationsClick={openAllLocationsScreen}
                onLocationClick={openLocationScreen}
                onDisableChange={updateIsStatsDisabled}
            />
        );
    }

    return (
        <StatsScreen
            type="main"
            title={translator.getMessage('popup_stats')}
            range={range}
            firstStatsDate={firstStatsDate}
            isLoading={isStatisticsLoading}
            isDisabled={isStatsDisabled}
            usage={totalUsage}
            locations={locations}
            onBackClick={closeStatsScreen}
            onClear={clearAllStats}
            onRangeChange={updateRange}
            onAllLocationsClick={openAllLocationsScreen}
            onLocationClick={openLocationScreen}
            onDisableChange={updateIsStatsDisabled}
        />
    );
});
