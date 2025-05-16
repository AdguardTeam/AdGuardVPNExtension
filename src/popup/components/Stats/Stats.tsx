import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryScreenName } from '../../../background/telemetry';
import { translator } from '../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../common/telemetry';
import { rootStore } from '../../stores';

import { StatsScreen } from './StatsScreen';

export const Stats = observer(() => {
    const { statsStore, telemetryStore } = useContext(rootStore);
    const {
        isAllLocationsScreenOpen,
        shouldRenderStatsScreen,
        range,
        firstStatsDate,
        isMenuOpen,
        isWhySafeModalOpen,
        isClearModalOpen,
        totalUsageData,
        allLocationsDataUsage,
        selectedLocationDataUsage,
        totalTimeUsageMs,
        closeStatsScreen,
        openAllLocationsScreen,
        closeAllLocationsScreen,
        openLocationScreen,
        closeLocationScreen,
        updateRange,
        clearAllStats,
    } = statsStore;

    // These screens are rendered on top of `StatsScreen` / `LocationScreen` screens
    const isOverlappedWithScreen = isMenuOpen // `SettingsStatsScreen`
        || isWhySafeModalOpen // `WhySafeScreen`
        || isClearModalOpen; // `ClearStatsScreen`

    const canSendStatsTelemetry = shouldRenderStatsScreen
        && !selectedLocationDataUsage
        && !isOverlappedWithScreen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.StatsScreen,
        canSendStatsTelemetry,
    );

    const canSendLocationStatsTelemetry = shouldRenderStatsScreen
        && !!selectedLocationDataUsage
        && !isOverlappedWithScreen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.LocationScreen,
        canSendLocationStatsTelemetry,
    );

    if (!shouldRenderStatsScreen) {
        return null;
    }

    if (selectedLocationDataUsage) {
        const { location, dataUsage, timeUsageMs } = selectedLocationDataUsage;
        const { countryCode, countryName, cityName } = location;

        return (
            <StatsScreen
                type="location"
                title={`${countryName} (${cityName})`}
                range={range}
                firstStatsDate={firstStatsDate}
                dataUsage={dataUsage}
                timeUsageMs={timeUsageMs}
                countryCode={countryCode}
                onBackClick={closeLocationScreen}
                onClear={clearAllStats}
                onRangeChange={updateRange}
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
                locations={allLocationsDataUsage}
                onBackClick={closeAllLocationsScreen}
                onClear={clearAllStats}
                onRangeChange={updateRange}
                onAllLocationsClick={openAllLocationsScreen}
                onLocationClick={openLocationScreen}
            />
        );
    }

    return (
        <StatsScreen
            type="main"
            title={translator.getMessage('popup_stats_for_browser_title')}
            range={range}
            firstStatsDate={firstStatsDate}
            dataUsage={totalUsageData}
            locations={allLocationsDataUsage}
            timeUsageMs={totalTimeUsageMs}
            onBackClick={closeStatsScreen}
            onClear={clearAllStats}
            onRangeChange={updateRange}
            onAllLocationsClick={openAllLocationsScreen}
            onLocationClick={openLocationScreen}
        />
    );
});
