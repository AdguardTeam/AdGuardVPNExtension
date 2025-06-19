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
        shouldRenderStatsScreen,
        range,
        firstStatsDate,
        isStatisticsLoading,
        isStatsDisabled,
        isMenuOpen,
        isWhySafeModalOpen,
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

    // These screens are rendered on top of `StatsScreen` / `LocationScreen` screens
    const isOverlappedWithScreen = isMenuOpen // `SettingsStatsScreen`
        || isWhySafeModalOpen // `WhySafeScreen`
        || isClearModalOpen; // `ClearStatsScreen`

    const canSendStatsTelemetry = shouldRenderStatsScreen
        && !selectedLocation
        && !isOverlappedWithScreen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.StatsScreen,
        canSendStatsTelemetry,
    );

    const canSendLocationStatsTelemetry = shouldRenderStatsScreen
        && !!selectedLocation
        && !isOverlappedWithScreen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.LocationScreen,
        canSendLocationStatsTelemetry,
    );

    if (!shouldRenderStatsScreen) {
        return null;
    }

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
            title={translator.getMessage('popup_stats_for_browser_title')}
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
